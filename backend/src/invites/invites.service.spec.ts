import {
  BadRequestException,
  ConflictException,
  GoneException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InviteRole, Invite } from '../database/entities/invite.entity';
import { Organization } from '../database/entities/organization.entity';
import { User, UserRole } from '../database/entities/user.entity';
import { JwtPayload } from '../auth/auth.service';
import { InvitesService } from './invites.service';
import { MailService } from './mail.service';

const future = new Date(Date.now() + 48 * 60 * 60 * 1000);
const past = new Date(Date.now() - 1000);

const makeInvite = (overrides: Partial<Invite> = {}): Invite =>
  ({
    id: 'inv-1',
    email: 'user@example.com',
    role: InviteRole.USER,
    token: 'token-abc',
    expiresAt: future,
    acceptedAt: null,
    organizationId: 'org-1',
    createdBy: 'admin-id',
    createdAt: new Date(),
    organization: null,
    creator: {} as User,
    ...overrides,
  }) as Invite;

const ownerCaller: JwtPayload = { sub: 'owner-id', name: 'Owner', email: 'owner@x.com', role: UserRole.OWNER, organizationId: 'org-1' };
const adminCaller: JwtPayload = { sub: 'admin-id', name: 'Admin', email: 'admin@x.com', role: UserRole.SUPER_ADMIN, organizationId: null };

describe('InvitesService', () => {
  let service: InvitesService;
  let inviteRepo: Record<string, jest.Mock>;
  let userRepo: Record<string, jest.Mock>;
  let orgRepo: Record<string, jest.Mock>;
  let mailService: { sendInvite: jest.Mock };

  beforeEach(async () => {
    inviteRepo = { findOne: jest.fn(), save: jest.fn(), create: jest.fn((v) => v) };
    userRepo = { findOne: jest.fn(), save: jest.fn(), create: jest.fn((v) => v) };
    orgRepo = { save: jest.fn(), create: jest.fn((v) => v) };
    mailService = { sendInvite: jest.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        InvitesService,
        { provide: getRepositoryToken(Invite), useValue: inviteRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Organization), useValue: orgRepo },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get(InvitesService);
  });

  describe('create', () => {
    it('cria convite e envia email', async () => {
      inviteRepo.findOne.mockResolvedValue(null);
      inviteRepo.save.mockResolvedValue({});

      await service.create({ email: 'user@example.com' }, ownerCaller);

      expect(inviteRepo.save).toHaveBeenCalled();
      expect(mailService.sendInvite).toHaveBeenCalledWith('user@example.com', expect.any(String), InviteRole.USER);
    });

    it('SUPER_ADMIN cria convite com role OWNER e sem org', async () => {
      inviteRepo.findOne.mockResolvedValue(null);
      inviteRepo.save.mockResolvedValue({});

      await service.create({ email: 'novo@owner.com' }, adminCaller);

      const saved = inviteRepo.save.mock.calls[0][0];
      expect(saved.role).toBe(InviteRole.OWNER);
      expect(saved.organizationId).toBeNull();
    });

    it('lança ConflictException se já existe convite pendente', async () => {
      inviteRepo.findOne.mockResolvedValue(makeInvite());

      await expect(service.create({ email: 'user@example.com' }, ownerCaller)).rejects.toThrow(ConflictException);
    });
  });

  describe('validate', () => {
    it('retorna email e role para token válido', async () => {
      inviteRepo.findOne.mockResolvedValue(makeInvite());

      const result = await service.validate('token-abc');

      expect(result).toEqual({ email: 'user@example.com', role: InviteRole.USER });
    });

    it('lança NotFoundException para token inexistente', async () => {
      inviteRepo.findOne.mockResolvedValue(null);
      await expect(service.validate('invalid')).rejects.toThrow(NotFoundException);
    });

    it('lança GoneException para convite expirado', async () => {
      inviteRepo.findOne.mockResolvedValue(makeInvite({ expiresAt: past }));
      await expect(service.validate('token-abc')).rejects.toThrow(GoneException);
    });

    it('lança GoneException para convite já utilizado', async () => {
      inviteRepo.findOne.mockResolvedValue(makeInvite({ acceptedAt: new Date() }));
      await expect(service.validate('token-abc')).rejects.toThrow(GoneException);
    });
  });

  describe('activate', () => {
    it('cria usuário USER com convite válido', async () => {
      inviteRepo.findOne.mockResolvedValue(makeInvite());
      userRepo.findOne.mockResolvedValue(null);
      userRepo.save.mockResolvedValue({});
      inviteRepo.save.mockResolvedValue({});

      await service.activate({ token: 'token-abc', name: 'João', password: 'pass123' });

      const user = userRepo.save.mock.calls[0][0];
      expect(user.role).toBe(UserRole.USER);
      expect(user.organizationId).toBe('org-1');
    });

    it('cria organização e usuário OWNER quando role é OWNER', async () => {
      inviteRepo.findOne.mockResolvedValue(makeInvite({ role: InviteRole.OWNER, organizationId: null }));
      userRepo.findOne.mockResolvedValue(null);
      orgRepo.save.mockResolvedValue({ id: 'new-org-id' });
      userRepo.save.mockResolvedValue({});
      inviteRepo.save.mockResolvedValue({});

      await service.activate({ token: 'token-abc', name: 'Maria', password: 'pass123', orgName: 'Minha Org' });

      expect(orgRepo.save).toHaveBeenCalled();
      const user = userRepo.save.mock.calls[0][0];
      expect(user.role).toBe(UserRole.OWNER);
      expect(user.organizationId).toBe('new-org-id');
    });

    it('lança BadRequestException se orgName ausente para OWNER', async () => {
      inviteRepo.findOne.mockResolvedValue(makeInvite({ role: InviteRole.OWNER, organizationId: null }));
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.activate({ token: 'token-abc', name: 'Maria', password: 'pass123' })).rejects.toThrow(BadRequestException);
    });

    it('lança NotFoundException para token inválido', async () => {
      inviteRepo.findOne.mockResolvedValue(null);
      await expect(service.activate({ token: 'bad', name: 'x', password: 'pass123' })).rejects.toThrow(NotFoundException);
    });

    it('lança ConflictException se email já está cadastrado', async () => {
      inviteRepo.findOne.mockResolvedValue(makeInvite());
      userRepo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(service.activate({ token: 'token-abc', name: 'x', password: 'pass123' })).rejects.toThrow(ConflictException);
    });
  });
});
