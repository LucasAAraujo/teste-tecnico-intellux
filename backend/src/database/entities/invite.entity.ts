import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

export enum InviteRole {
  OWNER = 'OWNER',
  USER = 'USER',
}

@Entity('invites')
@Index('idx_invites_token', ['token'])
@Index('idx_invites_org', ['organizationId'])
export class Invite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'char', length: 36, nullable: true })
  organizationId: string | null;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'enum', enum: InviteRole })
  role: InviteRole;

  @Column({ type: 'char', length: 36, unique: true })
  token: string;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date;

  @Column({ name: 'accepted_at', type: 'datetime', nullable: true })
  acceptedAt: Date | null;

  @Column({ name: 'created_by', type: 'char', length: 36 })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;
}
