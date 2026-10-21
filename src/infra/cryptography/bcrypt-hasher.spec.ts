import { getRounds, hash } from 'bcrypt'
import { BcryptHasher } from './bcrypt-hasher'

async function duration(action: () => Promise<unknown>) {
  const start = performance.now()
  await action()
  return performance.now() - start
}

describe('BcryptHasher', () => {
  const hasher = new BcryptHasher()

  it('should hash with cost 12', async () => {
    const hashed = await hasher.hash('senha-123')

    expect(getRounds(hashed)).toBe(12)
    expect(hashed).not.toContain('senha-123')
  })

  it('should accept the right password and reject a wrong one', async () => {
    const hashed = await hasher.hash('senha-123')

    expect(await hasher.compare('senha-123', hashed)).toBe(true)
    expect(await hasher.compare('outra-senha', hashed)).toBe(false)
  })

  it('should still verify passwords hashed with the old cost 8', async () => {
    const oldHash = await hash('senha-123', 8)

    expect(await hasher.compare('senha-123', oldHash)).toBe(true)
  })

  it('should reject any password when there is no stored hash', async () => {
    expect(await hasher.compare('no-account', null)).toBe(false)
  })

  it('should take as long without a stored hash as with one', async () => {
    const hashed = await hasher.hash('senha-123')
    await hasher.compare('warm-up', null)

    const withHash = await duration(() => hasher.compare('errada', hashed))
    const withoutHash = await duration(() => hasher.compare('errada', null))

    expect(withoutHash).toBeGreaterThan(withHash / 2)
  })
})
