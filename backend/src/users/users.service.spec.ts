import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../database/entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let findOne: jest.Mock;

  beforeEach(async () => {
    findOne = jest.fn();
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: { findOne } },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  it('retorna o perfil do usuário sem passwordHash', async () => {
    const user = { id: 'u1', name: 'Alice', email: 'a@a.com', role: UserRole.OWNER, organizationId: 'org-1' };
    findOne.mockResolvedValue(user);

    const result = await service.findMe('u1');

    expect(result).toEqual(user);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('lança NotFoundException se usuário não existe', async () => {
    findOne.mockResolvedValue(null);
    await expect(service.findMe('inexistente')).rejects.toThrow(NotFoundException);
  });
});
