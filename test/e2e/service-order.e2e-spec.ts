import { INestApplication } from '@nestjs/common'
import { createApp } from './app'
import { addTeamMember, createServiceOrder, openStore } from './api'

describe('A service order from check-in to delivery', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should number orders per store', async () => {
    const store = await openStore(app)
    const otherStore = await openStore(app)

    const first = await createServiceOrder(store.as)
    const second = await createServiceOrder(store.as)
    const otherFirst = await createServiceOrder(otherStore.as)

    expect(first.serviceOrder.number).toBe(1)
    expect(second.serviceOrder.number).toBe(2)
    expect(otherFirst.serviceOrder.number).toBe(1)
  })

  it('should go through items, technician, notices and delivery', async () => {
    const store = await openStore(app)
    const technician = await addTeamMember(app, store, 'TECHNICIAN')
    const { serviceOrder } = await createServiceOrder(store.as)
    const path = `/service-orders/${serviceOrder.id}`

    // Items: 150 + 2 × 100, one removed and added again, minus 50 off
    await store.as
      .post(`${path}/items`)
      .send({
        type: 'SERVICE',
        description: 'Troca de tela',
        quantity: 1,
        unitPrice: 150,
      })
      .expect(201)
    const { item } = (
      await store.as
        .post(`${path}/items`)
        .send({
          type: 'PART',
          description: 'Tela',
          quantity: 2,
          unitPrice: 100,
        })
        .expect(201)
    ).body
    await store.as.delete(`${path}/items/${item.id}`).expect(204)
    await store.as
      .post(`${path}/items`)
      .send({ type: 'PART', description: 'Tela', quantity: 2, unitPrice: 100 })
      .expect(201)
    await store.as.put(path).send({ discount: 50 }).expect(200)

    await store.as
      .patch(`${path}/technician`)
      .send({ technicianId: technician.user.id })
      .expect(200)
    // The technician edits the order assigned to them
    await technician.as
      .put(path)
      .send({ diagnosis: 'Tela quebrada' })
      .expect(200)

    // The quote is ready: the customer has to be told
    await store.as
      .patch(`${path}/status`)
      .send({ status: 'WAITING_APPROVAL' })
      .expect(200)
    let order = (await store.as.get(path).expect(200)).body.serviceOrder
    expect(order.needsCustomerNotice).toBe(true)

    await store.as
      .post(`${path}/notices`)
      .send({ channel: 'WHATSAPP' })
      .expect(201)
    order = (await store.as.get(path).expect(200)).body.serviceOrder
    expect(order.needsCustomerNotice).toBe(false)

    // A new status asks for a new notice
    await store.as
      .patch(`${path}/status`)
      .send({ status: 'COMPLETED' })
      .expect(200)
    const waiting = (
      await store.as.get('/service-orders?needsCustomerNotice=true').expect(200)
    ).body.serviceOrders
    expect(waiting.map((s: { id: string }) => s.id)).toEqual([serviceOrder.id])

    await store.as
      .post(`${path}/notices`)
      .send({ channel: 'PHONE', notes: 'Vem buscar amanhã' })
      .expect(201)
    await store.as
      .patch(`${path}/status`)
      .send({ status: 'DELIVERED' })
      .expect(200)

    order = (await store.as.get(path).expect(200)).body.serviceOrder
    expect(order).toMatchObject({
      status: 'DELIVERED',
      technicianId: technician.user.id,
      diagnosis: 'Tela quebrada',
      totalItemsCost: 350,
      totalWithDiscount: 300,
    })
    expect(order.items).toHaveLength(2)
    expect(order.completedDate).not.toBeNull()
    expect(order.deliveredDate).not.toBeNull()

    // Newest first
    const { history } = (await store.as.get(`${path}/history`).expect(200)).body
    expect(history.map((entry: { action: string }) => entry.action)).toEqual([
      'STATUS_CHANGED',
      'CUSTOMER_NOTIFIED',
      'STATUS_CHANGED',
      'CUSTOMER_NOTIFIED',
      'STATUS_CHANGED',
      'TECHNICIAN_ASSIGNED',
    ])

    // Delivered this month, so it counts in the dashboard
    const revenue = (await store.as.get('/metrics/revenue').expect(200)).body
      .metrics
    expect(revenue.currentMonth).toEqual({ delivered: 1, revenue: 300 })

    const { technicians } = (
      await store.as.get('/metrics/technicians').expect(200)
    ).body.metrics
    expect(
      technicians.find(
        (row: { technicianId: string }) =>
          row.technicianId === technician.user.id,
      ),
    ).toMatchObject({
      active: 0,
      late: 0,
      completed: 1,
      delivered: 1,
      revenue: 300,
    })
  })
})
