import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../database/entities/user.entity';
import { IS_PUBLIC_KEY } from '../decorators/auth.decorators';

@Injectable()
export class TenancyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const { user } = request;
    if (!user) return false;
    if (user.role === UserRole.SUPER_ADMIN) return true;

    const paramOrgId: string | undefined = request.params?.organizationId;
    if (paramOrgId && paramOrgId !== user.organizationId) {
      throw new ForbiddenException('Acesso negado a esta organização');
    }
    return true;
  }
}
