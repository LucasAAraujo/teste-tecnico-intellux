import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { FileEntity } from './file.entity';
import { User } from './user.entity';

@Entity('file_shares')
@Unique('uq_share', ['fileId', 'recipientId'])
@Index('idx_shares_recipient', ['recipientId'])
@Index('idx_shares_file', ['fileId'])
export class FileShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'file_id', type: 'char', length: 36 })
  fileId: string;

  @Column({ name: 'owner_id', type: 'char', length: 36 })
  ownerId: string;

  @Column({ name: 'recipient_id', type: 'char', length: 36 })
  recipientId: string;

  @CreateDateColumn({ name: 'shared_at' })
  sharedAt: Date;

  @ManyToOne(() => FileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'file_id' })
  file: FileEntity;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;
}
