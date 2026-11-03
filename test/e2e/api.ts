import { randomUUID } from 'node:crypto'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'

// Requests the way the frontend makes them, through the routes. Each test
// opens stores of its own, so the tests never see each other's records

export function uniqueId() {
  return randomUUID().slice(0, 8)
}

// A store takes each customer's phone only once
export function uniquePhone() {
  return `119${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`
}

export interface Credentials {
  email: string
  password: string
}

export function http(app: INestApplication) {
  return request(app.getHttpServer())
}

// Every request with the access token, like the frontend's axios
export function authed(app: INestApplication, accessToken: string) {
  const server = app.getHttpServer()
  const authorization = `Bearer ${accessToken}`

  return {
    get: (path: string) =>
      request(server).get(path).set('Authorization', authorization),
    post: (path: string) =>
      request(server).post(path).set('Authorization', authorization),
    put: (path: string) =>
      request(server).put(path).set('Authorization', authorization),
    patch: (path: string) =>
      request(server).patch(path).set('Authorization', authorization),
    delete: (path: string) =>
      request(server).delete(path).set('Authorization', authorization),
  }
}

export type Client = ReturnType<typeof authed>

export async function signUp(
  app: INestApplication,
  overrides: Record<string, unknown> = {},
) {
  const id = uniqueId()
  const body = {
    tenantName: `Loja ${id}`,
    tenantSlug: `loja-${id}`,
    tenantEmail: `loja-${id}@consertiva.test`,
    ownerName: 'Dona da Loja',
    ownerEmail: `dona-${id}@consertiva.test`,
    ownerPassword: `senha-${id}`,
    ...overrides,
  }

  const response = await http(app).post('/accounts').send(body).expect(201)

  return {
    slug: body.tenantSlug as string,
    owner: {
      email: body.ownerEmail as string,
      password: body.ownerPassword as string,
    },
    tenant: response.body.tenant,
    user: response.body.user,
  }
}

export async function signIn(
  app: INestApplication,
  slug: string,
  { email, password }: Credentials,
) {
  const response = await http(app)
    .post('/authenticate')
    .send({ tenantSlug: slug, email, password })
    .expect(200)

  return {
    accessToken: response.body.access_token as string,
    refreshToken: response.body.refresh_token as string,
  }
}

// A new store with its owner signed in
export async function openStore(app: INestApplication) {
  const store = await signUp(app)
  const { accessToken } = await signIn(app, store.slug, store.owner)

  return { ...store, as: authed(app, accessToken) }
}

export async function addTeamMember(
  app: INestApplication,
  store: Awaited<ReturnType<typeof openStore>>,
  role: 'ADMIN' | 'TECHNICIAN' | 'RECEPTIONIST',
) {
  const id = uniqueId()
  const credentials = {
    email: `${id}@consertiva.test`,
    password: `senha-${id}`,
  }

  const response = await store.as
    .post('/users')
    .send({ name: `Pessoa ${id}`, ...credentials, role })
    .expect(201)
  const { accessToken } = await signIn(app, store.slug, credentials)

  return { user: response.body.user, as: authed(app, accessToken) }
}

// A customer with a device and an open order
export async function createServiceOrder(client: Client) {
  const { customer } = (
    await client
      .post('/customers')
      .send({ name: `Cliente ${uniqueId()}`, phone: uniquePhone() })
      .expect(201)
  ).body
  const { device } = (
    await client
      .post('/devices')
      .send({ customerId: customer.id, type: 'SMARTPHONE', brand: 'Samsung' })
      .expect(201)
  ).body
  const { serviceOrder } = (
    await client
      .post('/service-orders')
      .send({
        customerId: customer.id,
        deviceId: device.id,
        problemDescription: 'Tela trincada e não liga',
      })
      .expect(201)
  ).body

  return { customer, device, serviceOrder }
}
