import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtPayload } from '../auth/auth.service';
import { FileEntity, FileType } from '../database/entities/file.entity';
import { UserRole } from '../database/entities/user.entity';
import { FilesService } from './files.service';

const ownerCaller: JwtPayload = { sub: 'u1', email: 'o@o.com', role: UserRole.OWNER, organizationId: 'org-1' };
const adminCaller: JwtPayload = { sub: 'sa', email: 'a@a.com', role: UserRole.SUPER_ADMIN, organizationId: null };
const userCaller: JwtPayload = { sub: 'u2', email: 'u@u.com', role: UserRole.USER, organizationId: 'org-1' };

const makeFile = (overrides: Partial<FileEntity> = {}): FileEntity =>
  ({ id: 'f1', organizationId: 'org-1', createdBy: 'u1', name: 'test.txt', type: FileType.TEXT, storagePath: './uploads/f1.txt', ...overrides }) as FileEntity;

const makeQb = () => {
  const qb: any = {};
  ['where', 'andWhere', 'orderBy'].forEach(m => (qb[m] = jest.fn().mockReturnValue(qb)));
  qb.getMany = jest.fn().mockResolvedValue([makeFile()]);
  return qb;
};

describe('FilesService', () => {
  let service: FilesService;
  let fileRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    fileRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(makeQb()),
      findOne: jest.fn(),
      save: jest.fn(v => Promise.resolve(v)),
      create: jest.fn(v => v),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [FilesService, { provide: getRepositoryToken(FileEntity), useValue: fileRepo }],
    }).compile();

    service = module.get(FilesService);
  });

  describe('upload', () => {
    const multerFile = { originalname: 'a.txt', mimetype: 'text/plain', path: './uploads/a.txt', size: 100 } as Express.Multer.File;

    it('salva arquivo e retorna entidade', async () => {
      const result = await service.upload(multerFile, ownerCaller);
      expect(fileRepo.save).toHaveBeenCalled();
      expect(result.organizationId).toBe('org-1');
    });

    it('classifica image/* como IMAGE', async () => {
      const img = { ...multerFile, mimetype: 'image/png', originalname: 'a.png' } as Express.Multer.File;
      await service.upload(img, ownerCaller);
      const saved = fileRepo.save.mock.calls[0][0];
      expect(saved.type).toBe(FileType.IMAGE);
    });

    it('lança ForbiddenException para SUPER_ADMIN', async () => {
      await expect(service.upload(multerFile, adminCaller)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('OWNER: aplica filtro de org', async () => {
      const qb = makeQb();
      fileRepo.createQueryBuilder.mockReturnValue(qb);
      await service.findAll({}, ownerCaller);
      expect(qb.where).toHaveBeenCalledWith(expect.stringContaining('organizationId'), expect.any(Object));
    });

    it('SUPER_ADMIN: sem filtro de org', async () => {
      const qb = makeQb();
      fileRepo.createQueryBuilder.mockReturnValue(qb);
      await service.findAll({}, adminCaller);
      expect(qb.where).not.toHaveBeenCalled();
    });

    it('USER: aplica filtro org + createdBy/shared', async () => {
      const qb = makeQb();
      fileRepo.createQueryBuilder.mockReturnValue(qb);
      await service.findAll({}, userCaller);
      expect(qb.andWhere).toHaveBeenCalledWith(expect.stringContaining('file_shares'), expect.any(Object));
    });
  });

  describe('findOne', () => {
    it('retorna arquivo da mesma org', async () => {
      fileRepo.findOne.mockResolvedValue(makeFile());
      const result = await service.findOne('f1', ownerCaller);
      expect(result.id).toBe('f1');
    });

    it('lança NotFoundException se não existe', async () => {
      fileRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('x', ownerCaller)).rejects.toThrow(NotFoundException);
    });

    it('lança ForbiddenException para arquivo de outra org', async () => {
      fileRepo.findOne.mockResolvedValue(makeFile({ organizationId: 'org-2' }));
      await expect(service.findOne('f1', ownerCaller)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('criador pode excluir seu próprio arquivo', async () => {
      fileRepo.findOne.mockResolvedValue(makeFile({ createdBy: 'u1' }));
      await expect(service.remove('f1', ownerCaller)).resolves.toBeUndefined();
    });

    it('USER sem ser criador não pode excluir', async () => {
      fileRepo.findOne.mockResolvedValue(makeFile({ createdBy: 'outro' }));
      await expect(service.remove('f1', userCaller)).rejects.toThrow(ForbiddenException);
    });
  });
});
