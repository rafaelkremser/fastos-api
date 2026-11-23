import { INestApplication } from '@nestjs/common'
import { createApp } from './app'
import { authed, http, signIn, signUp } from './api'

// A file of its own: each one starts an API with fresh sign-in limits
describe("Changing one's own password", () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should take the new password and drop the old one', async () => {
    const store = await signUp(app)
    const { accessToken } = await signIn(app, store.slug, store.owner)
    const owner = authed(app, accessToken)

    // Proving the current one first
    await owner
      .patch('/user/password')
      .send({ currentPassword: 'chute-errado', newPassword: 'nova-senha-1' })
      .expect(403)
    await owner
      .patch('/user/password')
      .send({ currentPassword: store.owner.password, newPassword: '123' })
      .expect(400)
    await owner
      .patch('/user/password')
      .send({
        currentPassword: store.owner.password,
        newPassword: 'nova-senha-1',
      })
      .expect(204)

    await http(app)
      .post('/authenticate')
      .send({ tenantSlug: store.slug, ...store.owner })
      .expect(401)
    await signIn(app, store.slug, {
      email: store.owner.email,
      password: 'nova-senha-1',
    })
  })

  it('should ask for a session', async () => {
    await http(app)
      .patch('/user/password')
      .send({ currentPassword: 'a', newPassword: 'nova-senha-1' })
      .expect(401)
  })
})
