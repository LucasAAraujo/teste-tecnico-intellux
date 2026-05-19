import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { JwtPayload } from '../auth/auth.service';
import { Organization } from '../database/entities/organization.entity';
import { User, UserRole } from '../database/entities/user.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization) private readonly orgRepo: Repository<Organization>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  findAll(caller: JwtPayload): Promise<Organization[]> {
    if (caller.role === UserRole.SUPER_ADMIN) {
      return this.orgRepo.find({ order: { createdAt: 'DESC' } });
    }
    return this.orgRepo.find({ where: { id: caller.organizationId! } });
  }

  async findMembers(orgId: string, caller: JwtPayload): Promise<Partial<User>[]> {
    if (caller.role !== UserRole.SUPER_ADMIN && caller.organizationId !== orgId) {
      throw new ForbiddenException();
    }
    return this.userRepo.find({
      where: { organizationId: orgId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      order: { createdAt: 'ASC' },
    });
  }
}
