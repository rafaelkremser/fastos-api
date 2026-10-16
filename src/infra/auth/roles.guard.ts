import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserRole } from '@/domain/account/enterprise/entities/user'
import { IS_PUBLIC_KEY } from './public'
import { ROLES_KEY } from './roles.decorator'
import { UserPayload } from './jwt.strategy'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const targets = [context.getHandler(), context.getClass()]

    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      targets,
    )

    if (isPublic) {
      return true
    }

    const roles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      targets,
    )

    // Deny by default: a protected route without @Roles stays closed
    if (!roles || roles.length === 0) {
      return false
    }

    const user: UserPayload | undefined = context
      .switchToHttp()
      .getRequest().user

    return !!user && roles.includes(user.role)
  }
}
