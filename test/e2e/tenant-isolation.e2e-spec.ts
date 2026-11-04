import { INestApplication } from '@nestjs/common'
import { createApp } from './app'
import { addTeamMember, createServiceOrder, openStore } from './api'

// Stores are kept apart only by the application (no row-level security in
// the database), so every route that takes an id is tried here with another
// store's records. A new route that takes an id goes in this list
describe('Isolation between stores', () => {
  let app: INestApplication
  let storeA: Awaited<ReturnType<typeof openStore>>
  let storeB: Awaited<ReturnType<typeof openStore>>
  let records: {
    customerId: string
    deviceId: string
    serviceOrderId: string
    itemId: string
    technicianId: string
    ownServiceOrderId: string
  }

  beforeAll(async () => {
    app = await createApp()
    storeA = await openStore(app)
    storeB = await openStore(app)

    const { customer, device, serviceOrder } = await createServiceOrder(
      storeB.as,
    )
    const { item } = (
      await storeB.as
        .post(`/service-orders/${serviceOrder.id}/items`)
        .send({
          type: 'PART',
          description: 'Tela',
          quantity: 1,
          unitPrice: 300,
        })
        .expect(201)
    ).body
    const technician = await addTeamMember(app, storeB, 'TECHNICIAN')
    const own = await createServiceOrder(storeA.as)

    records = {
      customerId: customer.id,
      deviceId: device.id,
      serviceOrderId: serviceOrder.id,
      itemId: item.id,
      technicianId: technician.user.id,
      ownServiceOrderId: own.serviceOrder.id,
    }
  })

  afterAll(async () => {
    await app.close()
  })

  type Method = 'get' | 'post' | 'put' | 'patch' | 'delete'
  type Attempt = (ids: typeof records) => [Method, string, object?]

  // Store A, signed in as its owner, against store B's records
  const attempts: [string, Attempt][] = [
    ['read a customer', (r) => ['get', `/customers/${r.customerId}`]],
    [
      'edit a customer',
      (r) => [
        'put',
        `/customers/${r.customerId}`,
        { name: 'Outro nome', phone: '11900000000' },
      ],
    ],
    ['delete a customer', (r) => ['delete', `/customers/${r.customerId}`]],
    [
      'add a device to a customer',
      (r) => ['post', '/devices', { customerId: r.customerId, type: 'TABLET' }],
    ],
    ['read a device', (r) => ['get', `/devices/${r.deviceId}`]],
    [
      'edit a device',
      (r) => ['put', `/devices/${r.deviceId}`, { type: 'TABLET' }],
    ],
    ['delete a device', (r) => ['delete', `/devices/${r.deviceId}`]],
    [
      'open an order for a customer and device',
      (r) => [
        'post',
        '/service-orders',
        {
          customerId: r.customerId,
          deviceId: r.deviceId,
          problemDescription: 'Não liga de jeito nenhum',
        },
      ],
    ],
    ['read an order', (r) => ['get', `/service-orders/${r.serviceOrderId}`]],
    [
      'edit an order',
      (r) => [
        'put',
        `/service-orders/${r.serviceOrderId}`,
        { diagnosis: 'Outro diagnóstico' },
      ],
    ],
    [
      'change the status of an order',
      (r) => [
        'patch',
        `/service-orders/${r.serviceOrderId}/status`,
        { status: 'CANCELLED' },
      ],
    ],
    [
      'assign a technician to an order',
      (r) => [
        'patch',
        `/service-orders/${r.serviceOrderId}/technician`,
        { technicianId: storeA.user.id },
      ],
    ],
    [
      'assign its technician to an own order',
      (r) => [
        'patch',
        `/service-orders/${r.ownServiceOrderId}/technician`,
        { technicianId: r.technicianId },
      ],
    ],
    [
      'add an item to an order',
      (r) => [
        'post',
        `/service-orders/${r.serviceOrderId}/items`,
        {
          type: 'SERVICE',
          description: 'Mão de obra',
          quantity: 1,
          unitPrice: 50,
        },
      ],
    ],
    [
      'remove an item',
      (r) => [
        'delete',
        `/service-orders/${r.serviceOrderId}/items/${r.itemId}`,
      ],
    ],
    [
      'remove an item through an own order',
      (r) => [
        'delete',
        `/service-orders/${r.ownServiceOrderId}/items/${r.itemId}`,
      ],
    ],
    [
      'read the history of an order',
      (r) => ['get', `/service-orders/${r.serviceOrderId}/history`],
    ],
    [
      'register a customer notice',
      (r) => [
        'post',
        `/service-orders/${r.serviceOrderId}/notices`,
        { channel: 'PHONE' },
      ],
    ],
    [
      "change a teammate's role",
      (r) => [
        'patch',
        `/users/${r.technicianId}/role`,
        { role: 'RECEPTIONIST' },
      ],
    ],
    [
      'deactivate a teammate',
      (r) => ['patch', `/users/${r.technicianId}/active`, { isActive: false }],
    ],
  ]

  it.each(attempts)('should not let another store %s', async (_, attempt) => {
    const [method, path, body] = attempt(records)

    const response = await storeA.as[method](path).send(body)

    expect([403, 404]).toContain(response.status)
  })

  // A list answers as for a customer that does not exist: empty, without
  // saying whether the id belongs to someone
  it("should show none of another store's devices", async () => {
    const response = await storeA.as
      .get(`/customers/${records.customerId}/devices`)
      .expect(200)

    expect(response.body.devices).toEqual([])
    expect(response.body.meta.totalCount).toBe(0)
  })

  it("should leave the other store's records as they were", async () => {
    const { customer } = (
      await storeB.as.get(`/customers/${records.customerId}`).expect(200)
    ).body
    const { device } = (
      await storeB.as.get(`/devices/${records.deviceId}`).expect(200)
    ).body
    const { serviceOrder } = (
      await storeB.as
        .get(`/service-orders/${records.serviceOrderId}`)
        .expect(200)
    ).body
    const { devices } = (
      await storeB.as
        .get(`/customers/${records.customerId}/devices`)
        .expect(200)
    ).body
    const { history } = (
      await storeB.as
        .get(`/service-orders/${records.serviceOrderId}/history`)
        .expect(200)
    ).body
    const { users } = (await storeB.as.get('/users').expect(200)).body

    expect(customer.name).not.toBe('Outro nome')
    expect(
      users.find((u: { id: string }) => u.id === records.technicianId),
    ).toMatchObject({ role: 'TECHNICIAN', isActive: true })
    expect(device.type).toBe('SMARTPHONE')
    expect(devices).toHaveLength(1)
    expect(serviceOrder).toMatchObject({
      status: 'OPEN',
      diagnosis: null,
      technicianId: null,
      customerNotifiedAt: null,
    })
    expect(serviceOrder.items).toHaveLength(1)
    expect(history).toHaveLength(0)
  })

  it("should list only the store's own records", async () => {
    const { customers } = (await storeA.as.get('/customers').expect(200)).body
    const { serviceOrders } = (
      await storeA.as.get('/service-orders').expect(200)
    ).body
    const { users } = (await storeA.as.get('/users').expect(200)).body
    const { metrics } = (await storeA.as.get('/metrics/operations').expect(200))
      .body

    expect(customers.map((c: { id: string }) => c.id)).not.toContain(
      records.customerId,
    )
    expect(serviceOrders.map((s: { id: string }) => s.id)).toEqual([
      records.ownServiceOrderId,
    ])
    expect(users.map((u: { id: string }) => u.id)).toEqual([storeA.user.id])
    // Only its own open order
    expect(metrics.active).toBe(1)
  })
})
