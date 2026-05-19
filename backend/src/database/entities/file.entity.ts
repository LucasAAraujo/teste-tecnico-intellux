import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

export enum FileType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
}

@Entity('files')
@Index('idx_files_org', ['organizationId'])
@Index('idx_files_created_by', ['createdBy'])
@Index('idx_files_uploaded_at', ['uploadedAt'])
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'char', length: 36 })
  organizationId: string;

  @Column({ name: 'created_by', type: 'char', length: 36 })
  createdBy: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: FileType })
  type: FileType;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ name: 'storage_path', type: 'varchar', length: 1024 })
  storagePath: string;

  @Column({ name: 'size_bytes', type: 'bigint' })
  sizeBytes: number;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  uploader: User;
}
