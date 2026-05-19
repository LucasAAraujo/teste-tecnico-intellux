import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CurrentUser, Public, Roles } from '../common/decorators/auth.decorators';
import type { JwtPayload } from '../auth/auth.service';
import { UserRole } from '../database/entities/user.entity';
import { ActivateInviteDto, CreateInviteDto } from './dto/invites.dto';
import { InvitesService } from './invites.service';

@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER)
  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.invitesService.findAll(user);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateInviteDto, @CurrentUser() user: JwtPayload) {
    return this.invitesService.create(dto, user);
  }

  @Public()
  @Get('validate/:token')
  validate(@Param('token') token: string) {
    return this.invitesService.validate(token);
  }

  @Public()
  @Post('activate')
  @HttpCode(HttpStatus.CREATED)
  activate(@Body() dto: ActivateInviteDto) {
    return this.invitesService.activate(dto);
  }
}
