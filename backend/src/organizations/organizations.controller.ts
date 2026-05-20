import { Controller, Get, Param, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/auth.decorators';
import type { JwtPayload } from '../auth/auth.service';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.organizationsService.findAll(user, +page, +limit);
  }

  @Get(':organizationId/members')
  findMembers(@Param('organizationId') orgId: string, @CurrentUser() user: JwtPayload) {
    return this.organizationsService.findMembers(orgId, user);
  }
}
