import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserRole } from '@/domain/account/enterprise/entities/user'
import { Public } from './public'
import { ALL_ROLES, Roles } from './roles.decorator'
import { RolesGuard } from './roles.guard'

class NoRolesController {
  handle() {}
}

@Public()
class PublicController {
  handle() {}
}

@Roles('OWNER', 'ADMIN')
class ManagersController {
  handle() {}
}

@Roles(...ALL_ROLES)
class EveryoneController {
  handle() {}
}

@Roles('OWNER')
class OverriddenController {
  @Roles('TECHNICIAN')
  handle() {}
}

function contextFor(
  controller: { prototype: { handle: () => void } },
  role?: UserRole,
) {
  const user = role
    ? { sub: 'user-id', tenantId: 'tenant-id', role }
    : undefined

  return {
    getHandler: () => controller.prototype.handle,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector())

  it('should let anyone reach a public route', () => {
    expect(guard.canActivate(contextFor(PublicController))).toBe(true)
  })

  it('should deny a protected route that declares no roles', () => {
    expect(guard.canActivate(contextFor(NoRolesController, 'OWNER'))).toBe(
      false,
    )
  })

  it.each<UserRole>(['OWNER', 'ADMIN'])(
    'should let %s reach a managers route',
    (role) => {
      expect(guard.canActivate(contextFor(ManagersController, role))).toBe(true)
    },
  )

  it.each<UserRole>(['TECHNICIAN', 'RECEPTIONIST'])(
    'should deny %s on a managers route',
    (role) => {
      expect(guard.canActivate(contextFor(ManagersController, role))).toBe(
        false,
      )
    },
  )

  it.each<UserRole>([...ALL_ROLES])(
    'should let %s reach a route open to every role',
    (role) => {
      expect(guard.canActivate(contextFor(EveryoneController, role))).toBe(true)
    },
  )

  it('should deny a request without an authenticated user', () => {
    expect(guard.canActivate(contextFor(EveryoneController))).toBe(false)
  })

  it('should prefer the roles on the method over the ones on the class', () => {
    expect(
      guard.canActivate(contextFor(OverriddenController, 'TECHNICIAN')),
    ).toBe(true)
    expect(guard.canActivate(contextFor(OverriddenController, 'OWNER'))).toBe(
      false,
    )
  })
})
