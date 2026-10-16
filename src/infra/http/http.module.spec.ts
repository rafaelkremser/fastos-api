import { Type } from '@nestjs/common'
import { METHOD_METADATA, MODULE_METADATA } from '@nestjs/common/constants'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '@/infra/auth/public'
import { ROLES_KEY } from '@/infra/auth/roles.decorator'
import { HttpModule } from './http.module'

// RolesGuard denies routes with no roles, so a forgotten @Roles would turn a
// new endpoint into a 403. This catches it before it ships.
describe('HTTP routes authorization', () => {
  const reflector = new Reflector()

  const controllers: Type[] = Reflect.getMetadata(
    MODULE_METADATA.CONTROLLERS,
    HttpModule,
  )

  const routes = controllers.flatMap((controller) =>
    Object.getOwnPropertyNames(controller.prototype)
      .map((key) => ({ key, handler: controller.prototype[key] }))
      .filter(
        ({ handler }) =>
          typeof handler === 'function' &&
          Reflect.getMetadata(METHOD_METADATA, handler) !== undefined,
      )
      .map(({ key, handler }) => ({
        name: `${controller.name}.${key}`,
        targets: [handler, controller],
      })),
  )

  it('should find the registered routes', () => {
    expect(routes.length).toBeGreaterThanOrEqual(24)
  })

  it('should mark every route as public or declare its roles', () => {
    const unmarked = routes
      .filter(({ targets }) => {
        const isPublic = reflector.getAllAndOverride(IS_PUBLIC_KEY, targets)
        const roles = reflector.getAllAndOverride(ROLES_KEY, targets)
        return !isPublic && !(roles?.length > 0)
      })
      .map(({ name }) => name)

    expect(unmarked).toEqual([])
  })
})
