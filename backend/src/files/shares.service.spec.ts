import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtPayload } from '../auth/auth.service';
import { FileEntity } from '../database/entities/file.entity';
import { FileShare } from '../database/entities/file-share.entity';
import { User, UserRole } from '../database/entities/user.entity';
import { SharesService } from './shares.service';

const caller: JwtPayload = { sub: 'u1', email: 'o@o.com', role: UserRole.OWNER, organizationId: 'org-1' };
const makeFile = (overrides = {}) => ({ id: 'f1', organizationId: 'org-1', createdBy: 'u1', ...overrides }) as FileEntity;
const makeUser = (overrides = {}) => ({ id: 'u2', organizationId: 'org-1', ...overrides }) as User;

describe('SharesService', () => {
  let service: SharesService;
  let fileRepo: Record<string, jest.Mock>;
  let shareRepo: Record<string, jest.Mock>;
  let userRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    fileRepo = { findOne: jest.fn() };
    shareRepo = { findOne: jest.fn(), save: jest.fn(), create: jest.fn(v => v) };
    userRepo = { findOne: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        SharesService,
        { provide: getRepositoryToken(FileEntity), useValue: fileRepo },
        { provide: getRepositoryToken(FileShare), useValue: shareRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get(SharesService);
  });

  it('compartilha arquivo com sucesso', async () => {
    fileRepo.findOne.mockResolvedValue(makeFile());
    userRepo.findOne.mockResolvedValue(makeUser());
    shareRepo.findOne.mockResolvedValue(null);

    await service.share('f1', { recipientId: 'u2' }, caller);
    expect(shareRepo.save).toHaveBeenCalled();
  });

  it('lança NotFoundException se arquivo não existe', async () => {
    fileRepo.findOne.mockResolvedValue(null);
    await expect(service.share('x', { recipientId: 'u2' }, caller)).rejects.toThrow(NotFoundException);
  });

  it('lança BadRequestException ao compartilhar consigo mesmo', async () => {
    fileRepo.findOne.mockResolvedValue(makeFile());
    await expect(service.share('f1', { recipientId: 'u1' }, caller)).rejects.toThrow(BadRequestException);
  });

  it('lança NotFoundException se destinatário não existe', async () => {
    fileRepo.findOne.mockResolvedValue(makeFile());
    userRepo.findOne.mockResolvedValue(null);
    await expect(service.share('f1', { recipientId: 'u99' }, caller)).rejects.toThrow(NotFoundException);
  });

  it('lança BadRequestException para destinatário de outra org', async () => {
    fileRepo.findOne.mockResolvedValue(makeFile());
    userRepo.findOne.mockResolvedValue(makeUser({ organizationId: 'org-2' }));
    await expect(service.share('f1', { recipientId: 'u2' }, caller)).rejects.toThrow(BadRequestException);
  });

  it('lança ConflictException para compartilhamento duplicado', async () => {
    fileRepo.findOne.mockResolvedValue(makeFile());
    userRepo.findOne.mockResolvedValue(makeUser());
    shareRepo.findOne.mockResolvedValue({ id: 'existing' });
    await expect(service.share('f1', { recipientId: 'u2' }, caller)).rejects.toThrow(ConflictException);
  });

  it('lança ForbiddenException ao compartilhar arquivo de outra org', async () => {
    fileRepo.findOne.mockResolvedValue(makeFile({ organizationId: 'org-2' }));
    await expect(service.share('f1', { recipientId: 'u2' }, caller)).rejects.toThrow(ForbiddenException);
  });
});
