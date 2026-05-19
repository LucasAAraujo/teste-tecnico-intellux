import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { unlinkSync } from 'fs';
import { Repository } from 'typeorm';
import type { JwtPayload } from '../auth/auth.service';
import { FileEntity, FileType } from '../database/entities/file.entity';
import { UserRole } from '../database/entities/user.entity';
import { FileFilterDto } from './dto/files.dto';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity) private readonly fileRepo: Repository<FileEntity>,
  ) {}

  async upload(file: Express.Multer.File, caller: JwtPayload): Promise<FileEntity> {
    if (!caller.organizationId) {
      throw new ForbiddenException('SUPER_ADMIN não pode fazer upload de arquivos');
    }
    const type = file.mimetype.startsWith('image/') ? FileType.IMAGE : FileType.TEXT;
    return this.fileRepo.save(
      this.fileRepo.create({
        organizationId: caller.organizationId,
        createdBy: caller.sub,
        name: file.originalname,
        type,
        mimeType: file.mimetype,
        storagePath: file.path,
        sizeBytes: file.size,
      }),
    );
  }

  findAll(query: FileFilterDto, caller: JwtPayload): Promise<FileEntity[]> {
    const qb = this.fileRepo.createQueryBuilder('file');

    if (caller.role === UserRole.SUPER_ADMIN) {
      // sem filtro de org — acesso irrestrito
    } else if (caller.role === UserRole.OWNER) {
      qb.where('file.organizationId = :orgId', { orgId: caller.organizationId });
    } else {
      qb.where('file.organizationId = :orgId', { orgId: caller.organizationId })
        .andWhere(
          '(file.createdBy = :uid OR EXISTS ' +
            '(SELECT 1 FROM file_shares fs WHERE fs.file_id = file.id AND fs.recipient_id = :uid))',
          { uid: caller.sub },
        );
    }

    if (query.type) qb.andWhere('file.type = :type', { type: query.type });
    if (query.search) qb.andWhere('file.name LIKE :search', { search: `%${query.search}%` });
    if (query.from) qb.andWhere('file.uploadedAt >= :from', { from: new Date(query.from) });
    if (query.to) qb.andWhere('file.uploadedAt <= :to', { to: new Date(query.to) });
    if (query.userId) qb.andWhere('file.createdBy = :userId', { userId: query.userId });

    return qb.orderBy('file.uploadedAt', 'DESC').getMany();
  }

  async findOne(id: string, caller: JwtPayload): Promise<FileEntity> {
    const file = await this.fileRepo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('Arquivo não encontrado');
    if (caller.role !== UserRole.SUPER_ADMIN && file.organizationId !== caller.organizationId) {
      throw new ForbiddenException();
    }
    return file;
  }

  async remove(id: string, caller: JwtPayload): Promise<void> {
    const file = await this.findOne(id, caller);
    const canDelete =
      caller.role === UserRole.SUPER_ADMIN ||
      (caller.role === UserRole.OWNER && file.organizationId === caller.organizationId) ||
      file.createdBy === caller.sub;
    if (!canDelete) throw new ForbiddenException('Sem permissão para excluir este arquivo');

    await this.fileRepo.remove(file);
    try { unlinkSync(file.storagePath); } catch { /* arquivo já removido do disco */ }
  }
}
