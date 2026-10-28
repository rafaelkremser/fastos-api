import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { makeUser } from 'test/factories/make-user'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { FetchUsersUseCase } from './fetch-users'

let usersRepository: InMemoryUsersRepository
let sut: FetchUsersUseCase

describe('Fetch Users', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    sut = new FetchUsersUseCase(usersRepository)
  })

  it("should list the tenant's users by name", async () => {
    const tenantId = new UniqueEntityID()
    usersRepository.items.push(
      makeUser({ tenantId, name: 'Carlos' }),
      makeUser({ tenantId, name: 'Ana' }),
      makeUser({ name: 'Bruno de outra loja' }),
    )

    const result = await sut.execute({ tenantId: tenantId.toString() })

    expect(result.value?.users.map((user) => user.name)).toEqual([
      'Ana',
      'Carlos',
    ])
  })

  it('should list only the users with a role', async () => {
    const tenantId = new UniqueEntityID()
    usersRepository.items.push(
      makeUser({ tenantId, name: 'Rafaela', role: 'OWNER' }),
      makeUser({ tenantId, name: 'Carlos', role: 'TECHNICIAN' }),
      makeUser({ tenantId, name: 'Ana', role: 'RECEPTIONIST' }),
    )

    const result = await sut.execute({
      tenantId: tenantId.toString(),
      role: 'TECHNICIAN',
    })

    expect(result.value?.users.map((user) => user.name)).toEqual(['Carlos'])
  })
})
