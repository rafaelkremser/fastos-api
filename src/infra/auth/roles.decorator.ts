import { SetMetadata } from '@nestjs/common'
import { USER_ROLES, UserRole } from '@/domain/account/enterprise/entities/user'

export const ROLES_KEY = 'roles'

export const ALL_ROLES: readonly UserRole[] = USER_ROLES

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles)
