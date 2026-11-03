import { INestApplication } from '@nestjs/common'
import { createApp } from './app'
import {
  addTeamMember,
  Client,
  createServiceOrder,
  http,
  openStore,
  uniqueId,
} from './api'

// The role matrix in docs/roadmap.md, route by route
describe('Roles', () => {
  let app: INestApplication
  let clients: Record<'owner' | 'admin' | 'technician' | 'receptionist', Client>
  let records: {
    customerId: string
    serviceOrderId: string
    technicianId: string
  }

  beforeAll(async () => {
    app = await createApp()
    const store = await openStore(app)
    const admin = await addTeamMember(app, store, 'ADMIN')
    const technician = await addTeamMember(app, store, 'TECHNICIAN')
    const receptionist = await addTeamMember(app, store, 'RECEPTIONIST')
    const { customer, serviceOrder } = await createServiceOrder(store.as)

    clients = {
      owner: store.as,
      admin: admin.as,
      technician: technician.as,
      receptionist: receptionist.as,
    }
    records = {
      customerId: customer.id,
      serviceOrderId: serviceOrder.id,
      technicianId: technician.user.id,
    }
  })

  afterAll(async () => {
    await app.close()
  })

  function newUser(role: string) {
    const id = uniqueId()
    return {
      name: `Pessoa ${id}`,
      email: `${id}@consertiva.test`,
      password: `senha-${id}`,
      role,
    }
  }

  type Role = keyof typeof clients
  type Method = 'get' | 'post' | 'put' | 'patch' | 'delete'
  type Request = (ids: typeof records, role: Role) => [Method, string, object?]

  // Each role moves the order to a status of its own, so no one repeats the
  // status it already has
  const nextStatus: Record<Role, string> = {
    owner: 'IN_ANALYSIS',
    admin: 'WAITING_APPROVAL',
    technician: 'APPROVED',
    receptionist: 'IN_PROGRESS',
  }

  // Who is refused (403) by each route; everyone else gets through
  const rules: [string, Role[], Request][] = [
    [
      'add someone to the team',
      ['technician', 'receptionist'],
      () => ['post', '/users', newUser('TECHNICIAN')],
    ],
    [
      'add an admin',
      ['admin', 'technician', 'receptionist'],
      () => ['post', '/users', newUser('ADMIN')],
    ],
    [
      'see the revenue',
      ['technician', 'receptionist'],
      () => ['get', '/metrics/revenue'],
    ],
    [
      "see each technician's numbers",
      ['technician', 'receptionist'],
      () => ['get', '/metrics/technicians'],
    ],
    [
      'see the time in each stage',
      ['technician', 'receptionist'],
      () => ['get', '/metrics/stage-times'],
    ],
    [
      'assign the technician',
      ['technician', 'receptionist'],
      (r) => [
        'patch',
        `/service-orders/${r.serviceOrderId}/technician`,
        { technicianId: r.technicianId },
      ],
    ],
    [
      'edit an order',
      ['receptionist'],
      (r) => [
        'put',
        `/service-orders/${r.serviceOrderId}`,
        { diagnosis: 'Conferido' },
      ],
    ],
    [
      'add an item',
      ['receptionist'],
      (r) => [
        'post',
        `/service-orders/${r.serviceOrderId}/items`,
        { type: 'SERVICE', description: 'Limpeza', quantity: 1, unitPrice: 30 },
      ],
    ],
    [
      'change the status',
      [],
      (r, role) => [
        'patch',
        `/service-orders/${r.serviceOrderId}/status`,
        { status: nextStatus[role] },
      ],
    ],
    [
      'register a customer notice',
      [],
      (r) => [
        'post',
        `/service-orders/${r.serviceOrderId}/notices`,
        { channel: 'PHONE' },
      ],
    ],
    ['see the operation', [], () => ['get', '/metrics/operations']],
  ]

  const cases = rules.flatMap(([action, refused, request]) =>
    (['owner', 'admin', 'technician', 'receptionist'] as Role[]).map(
      (role) => ({
        role,
        action,
        request,
        verdict: refused.includes(role) ? 'refuse' : 'allow',
      }),
    ),
  )

  it.each(cases)(
    'should $verdict the $role to $action',
    async ({ role, verdict, request }) => {
      const [method, path, body] = request(records, role)

      const response = await clients[role][method](path).send(body)

      if (verdict === 'refuse') {
        expect(response.status).toBe(403)
      } else {
        expect(response.status).toBeLessThan(300)
      }
    },
  )

  it('should keep the customers from technicians and receptionists when deleting', async () => {
    for (const role of ['technician', 'receptionist'] as const) {
      await clients[role].delete(`/customers/${records.customerId}`).expect(403)
    }
  })

  it('should ask for a session on every route but sign-up, sign-in and refresh', async () => {
    await http(app).get('/user').expect(401)
    await http(app).get('/service-orders').expect(401)
    await http(app)
      .get('/user')
      .set('Authorization', 'Bearer not-a-token')
      .expect(401)
  })
})
