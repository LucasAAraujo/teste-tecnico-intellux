import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtPayload } from '../auth/auth.service';
import { Organization } from '../database/entities/organization.entity';
import { User, UserRole } from '../database/entities/user.entity';
import { OrganizationsService } from './organizations.service';

const adminCaller: JwtPayload = { sub: 'a', name: 'Admin', email: 'a@a.com', role: UserRole.SUPER_ADMIN, organizationId: null };
const ownerCaller: JwtPayload = { sub: 'b', name: 'Owner', email: 'b@b.com', role: UserRole.OWNER, organizationId: 'org-1' };

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let orgRepo: { find: jest.Mock };
  let userRepo: { find: jest.Mock };

  beforeEach(async () => {
    orgRepo = { find: jest.fn() };
    userRepo = { find: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: getRepositoryToken(Organization), useValue: orgRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get(OrganizationsService);
  });

  describe('findAll', () => {
    it('SUPER_ADMIN recebe todas as organizações sem filtro', async () => {
      orgRepo.find.mockResolvedValue([]);
      await service.findAll(adminCaller);
      expect(orgRepo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
    });

    it('OWNER recebe apenas sua própria organização', async () => {
      orgRepo.find.mockResolvedValue([]);
      await service.findAll(ownerCaller);
      expect(orgRepo.find).toHaveBeenCalledWith({ where: { id: 'org-1' } });
    });
  });

  describe('findMembers', () => {
    it('retorna membros da organização', async () => {
      userRepo.find.mockResolvedValue([{ id: 'u1', name: 'Alice' }]);
      const result = await service.findMembers('org-1', ownerCaller);
      expect(result).toHaveLength(1);
    });

    it('lança ForbiddenException ao acessar organização alheia', async () => {
      await expect(service.findMembers('org-2', ownerCaller)).rejects.toThrow(ForbiddenException);
    });

    it('SUPER_ADMIN acessa membros de qualquer organização', async () => {
      userRepo.find.mockResolvedValue([]);
      await service.findMembers('qualquer-org', adminCaller);
      expect(userRepo.find).toHaveBeenCalled();
    });
  });
});
