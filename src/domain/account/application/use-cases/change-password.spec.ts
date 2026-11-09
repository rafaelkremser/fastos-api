import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { makeUser } from 'test/factories/make-user'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ChangePasswordUseCase } from './change-password'
import { WrongCredentialsError } from './errors/wrong-credentials-error'

let usersRepository: InMemoryUsersRepository
let sut: ChangePasswordUseCase

describe('Change Password', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    sut = new ChangePasswordUseCase(usersRepository, new FakeHasher())
  })

  it('should change the password of someone who knows the current one', async () => {
    const user = makeUser({ password: 'antiga-hashed' })
    usersRepository.items.push(user)

    const result = await sut.execute({
      userId: user.id.toString(),
      currentPassword: 'antiga',
      newPassword: 'nova-senha',
    })

    expect(result.isRight()).toBe(true)
    expect(user.password).toBe('nova-senha-hashed')
  })

  it('should keep the password when the current one is wrong', async () => {
    const user = makeUser({ password: 'antiga-hashed' })
    usersRepository.items.push(user)

    const result = await sut.execute({
      userId: user.id.toString(),
      currentPassword: 'chute',
      newPassword: 'nova-senha',
    })

    expect(result.value).toBeInstanceOf(WrongCredentialsError)
    expect(user.password).toBe('antiga-hashed')
  })

  it('should not let someone deactivated change it', async () => {
    const user = makeUser({ password: 'antiga-hashed', isActive: false })
    usersRepository.items.push(user)

    const result = await sut.execute({
      userId: user.id.toString(),
      currentPassword: 'antiga',
      newPassword: 'nova-senha',
    })

    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(user.password).toBe('antiga-hashed')
  })
})
