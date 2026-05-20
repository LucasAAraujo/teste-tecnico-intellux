import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { JwtPayload } from '../auth/auth.service';
import { Organization } from '../database/entities/organization.entity';
import { User, UserRole } from '../database/entities/user.entity';

export type OrgPage = {
  items: Organization[];
  total: number;
  page: number;
  totalPages: number;
};

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization) private readonly orgRepo: Repository<Organization>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async findAll(caller: JwtPayload, page = 1, limit = 10): Promise<OrgPage> {
    if (caller.role === UserRole.SUPER_ADMIN) {
      const [items, total] = await this.orgRepo.findAndCount({
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return { items, total, page, totalPages: Math.ceil(total / limit) };
    }
    const items = await this.orgRepo.find({ where: { id: caller.organizationId! } });
    return { items, total: items.length, page: 1, totalPages: 1 };
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
