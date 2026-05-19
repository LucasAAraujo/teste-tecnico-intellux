import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../database/entities/user.entity';
import { AuthService } from './auth.service';

const makeUser = async (): Promise<User> =>
  ({
    id: 'uuid-1',
    name: 'Test',
    email: 'test@example.com',
    passwordHash: await bcrypt.hash('pass123', 10),
    role: UserRole.OWNER,
    organizationId: 'org-1',
  }) as User;

describe('AuthService', () => {
  let service: AuthService;
  let findOne: jest.Mock;

  beforeEach(async () => {
    findOne = jest.fn();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: { findOne } },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('token') } },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('retorna accessToken em login válido', async () => {
    findOne.mockResolvedValue(await makeUser());
    const result = await service.login({ email: 'test@example.com', password: 'pass123' });
    expect(result.accessToken).toBe('token');
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('lança UnauthorizedException se usuário não existe', async () => {
    findOne.mockResolvedValue(null);
    await expect(service.login({ email: 'x@x.com', password: 'pass123' })).rejects.toThrow(UnauthorizedException);
  });

  it('lança UnauthorizedException se senha incorreta', async () => {
    findOne.mockResolvedValue(await makeUser());
    await expect(service.login({ email: 'test@example.com', password: 'errada' })).rejects.toThrow(UnauthorizedException);
  });
});
