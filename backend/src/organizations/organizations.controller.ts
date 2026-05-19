import { Controller, Get, Param } from '@nestjs/common';
import { CurrentUser } from '../auth/auth.decorators';
import type { JwtPayload } from '../auth/auth.service';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.organizationsService.findAll(user);
  }

  @Get(':organizationId/members')
  findMembers(@Param('organizationId') orgId: string, @CurrentUser() user: JwtPayload) {
    return this.organizationsService.findMembers(orgId, user);
  }
}
