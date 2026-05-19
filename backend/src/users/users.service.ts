import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly userRepo: Repository<User>) {}

  async findMe(id: string): Promise<Partial<User>> {
    const user = await this.userRepo.findOne({
      where: { id },
      select: { id: true, name: true, email: true, role: true, organizationId: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw new NotFoundException();
    return user;
  }
}
