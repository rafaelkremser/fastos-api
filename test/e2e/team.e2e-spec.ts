import { INestApplication } from '@nestjs/common'
import { createApp } from './app'
import {
  addTeamMember,
  authed,
  createServiceOrder,
  http,
  openStore,
  signIn,
  uniqueId,
} from './api'

describe('Managing the team', () => {
  let app: INestApplication
  let store: Awaited<ReturnType<typeof openStore>>

  beforeAll(async () => {
    app = await createApp()
    store = await openStore(app)
  })

  afterAll(async () => {
    await app.close()
  })

  // A teammate signed in as the frontend does, with the refresh token kept
  async function newTeammate(role: 'ADMIN' | 'TECHNICIAN' | 'RECEPTIONIST') {
    const id = uniqueId()
    const credentials = {
      email: `${id}@consertiva.test`,
      password: `senha-${id}`,
    }
    const { user } = (
      await store.as
        .post('/users')
        .send({ name: `Pessoa ${id}`, ...credentials, role })
        .expect(201)
    ).body
    const tokens = await signIn(app, store.slug, credentials)

    return { user, credentials, ...tokens }
  }

  it('should shut someone out and let them back in', async () => {
    const technician = await newTeammate('TECHNICIAN')
    const { serviceOrder } = await createServiceOrder(store.as)

    const { user } = (
      await store.as
        .patch(`/users/${technician.user.id}/active`)
        .send({ isActive: false })
        .expect(200)
    ).body
    expect(user.isActive).toBe(false)

    // No new sign-in, no new token, and no new orders
    await http(app)
      .post('/authenticate')
      .send({ tenantSlug: store.slug, ...technician.credentials })
      .expect(401)
    await http(app)
      .post('/refresh')
      .send({ refreshToken: technician.refreshToken })
      .expect(401)
    await store.as
      .patch(`/service-orders/${serviceOrder.id}/technician`)
      .send({ technicianId: technician.user.id })
      .expect(404)

    await store.as
      .patch(`/users/${technician.user.id}/active`)
      .send({ isActive: true })
      .expect(200)
    await signIn(app, store.slug, technician.credentials)
  })

  it('should give the new role on the next token refresh', async () => {
    const technician = await newTeammate('TECHNICIAN')
    const { serviceOrder } = await createServiceOrder(store.as)
    const edit = (accessToken: string) =>
      authed(app, accessToken)
        .put(`/service-orders/${serviceOrder.id}`)
        .send({ diagnosis: 'Conferido' })

    await edit(technician.accessToken).expect(200)

    const { user } = (
      await store.as
        .patch(`/users/${technician.user.id}/role`)
        .send({ role: 'RECEPTIONIST' })
        .expect(200)
    ).body
    expect(user.role).toBe('RECEPTIONIST')

    // A receptionist does not edit orders
    const refreshed = await http(app)
      .post('/refresh')
      .send({ refreshToken: technician.refreshToken })
      .expect(200)
    await edit(refreshed.body.access_token).expect(403)
  })

  it('should keep the owner, other admins and oneself out of reach', async () => {
    const admin = await addTeamMember(app, store, 'ADMIN')
    const otherAdmin = await newTeammate('ADMIN')
    const technician = await newTeammate('TECHNICIAN')

    // An admin manages technicians and receptionists only, and makes no admins
    await admin.as
      .patch(`/users/${otherAdmin.user.id}/active`)
      .send({ isActive: false })
      .expect(403)
    await admin.as
      .patch(`/users/${store.user.id}/role`)
      .send({ role: 'TECHNICIAN' })
      .expect(403)
    await admin.as
      .patch(`/users/${admin.user.id}/role`)
      .send({ role: 'TECHNICIAN' })
      .expect(403)
    await admin.as
      .patch(`/users/${technician.user.id}/role`)
      .send({ role: 'ADMIN' })
      .expect(403)
    await admin.as
      .patch(`/users/${technician.user.id}/role`)
      .send({ role: 'RECEPTIONIST' })
      .expect(200)

    // The owner cannot shut themselves out either
    await store.as
      .patch(`/users/${store.user.id}/active`)
      .send({ isActive: false })
      .expect(403)

    // Technicians and receptionists manage no one
    await authed(app, technician.accessToken)
      .patch(`/users/${otherAdmin.user.id}/active`)
      .send({ isActive: false })
      .expect(403)
  })
})
