import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/auth.decorators';
import type { JwtPayload } from '../auth/auth.service';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.usersService.findMe(user.sub);
  }
}
