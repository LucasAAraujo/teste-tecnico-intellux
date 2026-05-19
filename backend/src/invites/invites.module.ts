import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invite } from '../database/entities/invite.entity';
import { Organization } from '../database/entities/organization.entity';
import { User } from '../database/entities/user.entity';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';
import { MailService } from './mail.service';

@Module({
  imports: [TypeOrmModule.forFeature([Invite, User, Organization])],
  controllers: [InvitesController],
  providers: [InvitesService, MailService],
})
export class InvitesModule {}
