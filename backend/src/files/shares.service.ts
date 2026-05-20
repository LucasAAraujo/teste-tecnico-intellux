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

  async getShares(fileId: string, caller: JwtPayload): Promise<{ recipientId: string }[]> {
    const file = await this.fileRepo.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException('Arquivo não encontrado');
    if (file.organizationId !== caller.organizationId) {
      throw new ForbiddenException();
    }
    const shares = await this.shareRepo.find({ where: { fileId } });
    return shares.map((s) => ({ recipientId: s.recipientId }));
  }

  async share(fileId: string, dto: ShareFileDto, caller: JwtPayload): Promise<void> {
    const file = await this.fileRepo.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException('Arquivo não encontrado');

    if (file.organizationId !== caller.organizationId) {
      throw new ForbiddenException();
    }

    if (caller.role === UserRole.USER && file.createdBy !== caller.sub) {
      throw new ForbiddenException('Você só pode compartilhar arquivos próprios');
    }

    for (const recipientId of dto.recipientIds) {
      if (recipientId === caller.sub) {
        throw new BadRequestException('Não é possível compartilhar com você mesmo');
      }

      const recipient = await this.userRepo.findOne({ where: { id: recipientId } });
      if (!recipient) throw new NotFoundException(`Destinatário ${recipientId} não encontrado`);
      if (recipient.organizationId !== file.organizationId) {
        throw new BadRequestException('Todos os destinatários devem pertencer à mesma organização');
      }

      const existing = await this.shareRepo.findOne({ where: { fileId, recipientId } });
      if (existing) throw new ConflictException(`Arquivo já compartilhado com o usuário ${recipientId}`);

      await this.shareRepo.save(
        this.shareRepo.create({ fileId, ownerId: caller.sub, recipientId }),
      );
    }
  }
}
