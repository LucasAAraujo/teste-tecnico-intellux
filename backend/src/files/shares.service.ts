import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { JwtPayload } from '../auth/auth.service';
import { FileEntity } from '../database/entities/file.entity';
import { FileShare } from '../database/entities/file-share.entity';
import { User, UserRole } from '../database/entities/user.entity';
import { ShareFileDto } from './dto/files.dto';

@Injectable()
export class SharesService {
  constructor(
    @InjectRepository(FileEntity) private readonly fileRepo: Repository<FileEntity>,
    @InjectRepository(FileShare) private readonly shareRepo: Repository<FileShare>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async share(fileId: string, dto: ShareFileDto, caller: JwtPayload): Promise<void> {
    const file = await this.fileRepo.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException('Arquivo não encontrado');

    if (caller.role !== UserRole.SUPER_ADMIN && file.organizationId !== caller.organizationId) {
      throw new ForbiddenException();
    }

    if (dto.recipientId === caller.sub) {
      throw new BadRequestException('Não é possível compartilhar com você mesmo');
    }

    const recipient = await this.userRepo.findOne({ where: { id: dto.recipientId } });
    if (!recipient) throw new NotFoundException('Destinatário não encontrado');
    if (recipient.organizationId !== file.organizationId) {
      throw new BadRequestException('O destinatário deve pertencer à mesma organização');
    }

    const existing = await this.shareRepo.findOne({ where: { fileId, recipientId: dto.recipientId } });
    if (existing) throw new ConflictException('Arquivo já compartilhado com este usuário');

    await this.shareRepo.save(
      this.shareRepo.create({ fileId, ownerId: caller.sub, recipientId: dto.recipientId }),
    );
  }
}
