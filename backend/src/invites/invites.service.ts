import {
  BadRequestException,
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { IsNull, Repository } from 'typeorm';
import { InviteRole, Invite } from '../database/entities/invite.entity';
import { Organization } from '../database/entities/organization.entity';
import { User, UserRole } from '../database/entities/user.entity';
import { JwtPayload } from '../auth/auth.service';
import { ActivateInviteDto, CreateInviteDto } from './invites.dto';
import { MailService } from './mail.service';

@Injectable()
export class InvitesService {
  constructor(
    @InjectRepository(Invite) private readonly inviteRepo: Repository<Invite>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Organization) private readonly orgRepo: Repository<Organization>,
    private readonly mailService: MailService,
  ) {}

  async create(dto: CreateInviteDto, caller: JwtPayload): Promise<void> {
    const role = caller.role === UserRole.SUPER_ADMIN ? InviteRole.OWNER : InviteRole.USER;
    const organizationId = caller.role === UserRole.SUPER_ADMIN ? null : caller.organizationId;

    const pending = await this.inviteRepo.findOne({
      where: { email: dto.email, acceptedAt: IsNull() },
    });
    if (pending && pending.expiresAt > new Date()) {
      throw new ConflictException('Já existe um convite pendente para este email');
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await this.inviteRepo.save(
      this.inviteRepo.create({ email: dto.email, role, token, expiresAt, organizationId, createdBy: caller.sub }),
    );

    await this.mailService.sendInvite(dto.email, token, role);
  }

  async validate(token: string): Promise<{ email: string; role: InviteRole }> {
    const invite = await this.inviteRepo.findOne({ where: { token } });
    if (!invite) throw new NotFoundException('Convite não encontrado');
    if (invite.acceptedAt) throw new GoneException('Convite já utilizado');
    if (invite.expiresAt < new Date()) throw new GoneException('Convite expirado');
    return { email: invite.email, role: invite.role };
  }

  async activate(dto: ActivateInviteDto): Promise<void> {
    const invite = await this.inviteRepo.findOne({ where: { token: dto.token } });
    if (!invite) throw new NotFoundException('Convite não encontrado');
    if (invite.acceptedAt) throw new GoneException('Convite já utilizado');
    if (invite.expiresAt < new Date()) throw new GoneException('Convite expirado');

    if (await this.userRepo.findOne({ where: { email: invite.email } })) {
      throw new ConflictException('Email já cadastrado');
    }

    let organizationId = invite.organizationId;

    if (invite.role === InviteRole.OWNER) {
      if (!dto.orgName) throw new BadRequestException('orgName é obrigatório para convites de OWNER');
      const org = await this.orgRepo.save(this.orgRepo.create({ name: dto.orgName }));
      organizationId = org.id;
    }

    await this.userRepo.save(
      this.userRepo.create({
        name: dto.name,
        email: invite.email,
        passwordHash: await bcrypt.hash(dto.password, 12),
        role: invite.role === InviteRole.OWNER ? UserRole.OWNER : UserRole.USER,
        organizationId,
      }),
    );

    invite.acceptedAt = new Date();
    await this.inviteRepo.save(invite);
  }
}
