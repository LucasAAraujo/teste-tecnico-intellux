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
import { FileFilterDto, UpdateFileDto } from './dto/files.dto';

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
    const qb = this.fileRepo
      .createQueryBuilder('file')
      .leftJoin('file.uploader', 'uploader')
      .addSelect(['uploader.id', 'uploader.name']);

    if (caller.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('SUPER_ADMIN não pode acessar arquivos de organizações');
    } else if (caller.role === UserRole.OWNER) {
      qb.where('file.organizationId = :orgId', { orgId: caller.organizationId });
    } else {
      qb.where('file.organizationId = :orgId', { orgId: caller.organizationId });
    }

    if (query.type) qb.andWhere('file.type = :type', { type: query.type });
    if (query.search) qb.andWhere('file.name LIKE :search', { search: `%${query.search}%` });
    if (query.from) qb.andWhere('file.uploadedAt >= :from', { from: new Date(query.from) });
    if (query.to) qb.andWhere('file.uploadedAt <= :to', { to: new Date(query.to) });
    if (query.userId && caller.role === UserRole.OWNER) {
      qb.andWhere('file.createdBy = :userId', { userId: query.userId });
    }

    return qb.orderBy('file.uploadedAt', 'DESC').getMany();
  }

  async findOne(id: string, caller: JwtPayload): Promise<FileEntity> {
    const file = await this.fileRepo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('Arquivo não encontrado');
    if (file.organizationId !== caller.organizationId) {
      throw new ForbiddenException();
    }
    return file;
  }

  async update(id: string, dto: UpdateFileDto, caller: JwtPayload): Promise<FileEntity> {
    const file = await this.findOne(id, caller);

    if (caller.role === UserRole.USER && file.createdBy !== caller.sub) {
      throw new ForbiddenException('Você só pode editar arquivos próprios');
    }

    if (dto.name !== undefined) file.name = dto.name;

    return this.fileRepo.save(file);
  }

  async remove(id: string, caller: JwtPayload): Promise<void> {
    const file = await this.findOne(id, caller);
    const canDelete =
      caller.role === UserRole.OWNER && file.organizationId === caller.organizationId;
    if (!canDelete) throw new ForbiddenException('Sem permissão para excluir este arquivo');

    await this.fileRepo.remove(file);
    try { unlinkSync(file.storagePath); } catch { /* arquivo já removido do disco */ }
  }
}
