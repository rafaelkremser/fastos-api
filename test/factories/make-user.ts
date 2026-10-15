import { randomUUID } from 'node:crypto'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { User, UserProps } from '@/domain/account/enterprise/entities/user'

export function makeUser(
  override: Partial<UserProps> = {},
  id?: UniqueEntityID,
) {
  const suffix = randomUUID().slice(0, 8)

  return User.create(
    {
      tenantId: new UniqueEntityID(),
      name: `User ${suffix}`,
      email: `user-${suffix}@example.com`,
      password: 'password-hashed',
      ...override,
    },
    id,
  )
}
