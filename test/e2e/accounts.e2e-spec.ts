import { INestApplication } from '@nestjs/common'
import { createApp } from './app'
import { authed, http, signIn, signUp } from './api'

describe('Sign-up and sign-in', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should open a store and sign its owner in', async () => {
    const store = await signUp(app)

    expect(store.tenant).toMatchObject({ slug: store.slug, isActive: true })
    expect(store.user).toMatchObject({
      email: store.owner.email,
      role: 'OWNER',
    })

    const { accessToken, refreshToken } = await signIn(
      app,
      store.slug,
      store.owner,
    )
    const owner = authed(app, accessToken)

    expect((await owner.get('/user').expect(200)).body.user.email).toBe(
      store.owner.email,
    )
    expect((await owner.get('/tenant').expect(200)).body.tenant.slug).toBe(
      store.slug,
    )

    // After a reload, the frontend gets a new access token with the refresh one
    const refreshed = await http(app)
      .post('/refresh')
      .send({ refreshToken })
      .expect(200)
    await authed(app, refreshed.body.access_token).get('/user').expect(200)
  })

  it('should refuse a wrong password, an unknown store and an address in use', async () => {
    const store = await signUp(app)

    await http(app)
      .post('/authenticate')
      .send({
        tenantSlug: store.slug,
        email: store.owner.email,
        password: 'senha-errada',
      })
      .expect(401)
    await http(app)
      .post('/authenticate')
      .send({ tenantSlug: 'loja-que-nao-existe', ...store.owner })
      .expect(401)
    await http(app)
      .post('/accounts')
      .send({
        tenantName: 'Outra loja',
        tenantSlug: store.slug,
        tenantEmail: `outra-${store.slug}@consertiva.test`,
        ownerName: 'Outra pessoa',
        ownerEmail: `outra-${store.slug}@consertiva.test`,
        ownerPassword: 'senha-forte',
      })
      .expect(409)
  })

  it('should keep each account in its own store', async () => {
    const storeA = await signUp(app)
    // The same person owns a second store, with another password
    const storeB = await signUp(app, {
      ownerEmail: storeA.owner.email,
      ownerPassword: 'outra-senha',
    })

    const inA = await signIn(app, storeA.slug, storeA.owner)
    const inB = await signIn(app, storeB.slug, storeB.owner)

    expect(
      (await authed(app, inA.accessToken).get('/tenant')).body.tenant.slug,
    ).toBe(storeA.slug)
    expect(
      (await authed(app, inB.accessToken).get('/tenant')).body.tenant.slug,
    ).toBe(storeB.slug)

    // Store A's password does not open store B
    await http(app)
      .post('/authenticate')
      .send({ tenantSlug: storeB.slug, ...storeA.owner })
      .expect(401)
  })
})
