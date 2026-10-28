// Fills the development database with a demo store, for testing by hand.
// It talks to the API the way the frontend does, so everything goes through
// the same rules (validation, numbering, roles).
//
//   1. Start the API (npm run dev), pointing at the dev database
//   2. npm run seed:dev     (API_URL changes the address)
//
// The store is created through the public sign-up, so on an API that holds
// new stores for approval it waits like any other: activate it with
// `npm run tenants:activate -- oficina-demo` and run this script again.
// Running it on a store that already has customers changes nothing.

const API_URL = process.env.API_URL ?? 'http://localhost:3333'

// Demo logins. They only exist where this script was run
const DEMO_STORE = {
  slug: 'oficina-demo',
  name: 'Oficina Demo',
  email: 'contato@oficina-demo.test',
  phone: '11940000000',
}

const DEMO_USERS = {
  owner: {
    name: 'Rafaela Dona',
    email: 'dono@oficina-demo.test',
    password: 'fastos-demo-123',
  },
  technician: {
    name: 'Carlos Técnico',
    email: 'tecnico@oficina-demo.test',
    password: 'fastos-demo-123',
    role: 'TECHNICIAN',
  },
  receptionist: {
    name: 'Ana Atendente',
    email: 'atendente@oficina-demo.test',
    password: 'fastos-demo-123',
    role: 'RECEPTIONIST',
  },
}

const CUSTOMERS = [
  ['Maria Souza', 'Campinas', 'SP'],
  ['João da Silva', 'Campinas', 'SP'],
  ['Conceição Ribeiro', 'Valinhos', 'SP'],
  ['Pedro Henrique Alves', 'Campinas', 'SP'],
  ['Ana Beatriz Lima', 'Sumaré', 'SP'],
  ['Lucas Ferreira', 'Campinas', 'SP'],
  ['Juliana Costa', 'Hortolândia', 'SP'],
  ['Gabriel Rocha', 'Campinas', 'SP'],
  ['Fernanda Gonçalves', 'Paulínia', 'SP'],
  ['Rafael Martins', 'Campinas', 'SP'],
  ['Camila Araújo', 'Vinhedo', 'SP'],
  ['Thiago Moreira', 'Campinas', 'SP'],
  ['Larissa Mendes', 'Campinas', 'SP'],
  ['Bruno Cardoso', 'Indaiatuba', 'SP'],
  ['Patrícia Nogueira', 'Campinas', 'SP'],
  ['Diego Barbosa', 'Americana', 'SP'],
  ['Aline Teixeira', 'Campinas', 'SP'],
  ['Marcelo Duarte', 'Campinas', 'SP'],
  ['Vanessa Pires', 'Jundiaí', 'SP'],
  ['Rodrigo Campos', 'Campinas', 'SP'],
  ['Letícia Freitas', 'Campinas', 'SP'],
  ['André Monteiro', 'Itatiba', 'SP'],
  ['Bianca Carvalho', 'Campinas', 'SP'],
  ['Felipe Andrade', 'Campinas', 'SP'],
]

const DEVICES = [
  { type: 'SMARTPHONE', brand: 'Samsung', model: 'Galaxy A54', color: 'Preto' },
  { type: 'SMARTPHONE', brand: 'Apple', model: 'iPhone 13', color: 'Azul' },
  {
    type: 'SMARTPHONE',
    brand: 'Motorola',
    model: 'Moto G84',
    color: 'Grafite',
  },
  { type: 'NOTEBOOK', brand: 'Dell', model: 'Inspiron 15', color: 'Prata' },
  { type: 'TABLET', brand: 'Samsung', model: 'Galaxy Tab A9', color: 'Cinza' },
  {
    type: 'SMARTPHONE',
    brand: 'Xiaomi',
    model: 'Redmi Note 13',
    color: 'Verde',
  },
  { type: 'CONSOLE', brand: 'Sony', model: 'PlayStation 5', color: 'Branco' },
  { type: 'SMARTWATCH', brand: 'Apple', model: 'Watch SE', color: 'Preto' },
]

// Problem, the status the order ends in, and the items already added
const ORDERS = [
  ['Tela trincada depois de uma queda', 'OPEN', []],
  ['Não liga, mesmo no carregador', 'IN_ANALYSIS', []],
  [
    'Bateria descarrega em poucas horas',
    'WAITING_APPROVAL',
    [
      ['PART', 'Bateria original', 1, 189.9],
      ['SERVICE', 'Troca de bateria', 1, 80],
    ],
  ],
  [
    'Conector de carga com mau contato',
    'APPROVED',
    [
      ['PART', 'Conector de carga', 1, 45],
      ['SERVICE', 'Troca do conector', 1, 70],
    ],
  ],
  [
    'Teclado com teclas falhando',
    'IN_PROGRESS',
    [
      ['PART', 'Teclado ABNT2', 1, 220],
      ['SERVICE', 'Troca do teclado', 1, 120],
    ],
  ],
  [
    'Câmera traseira embaçada',
    'WAITING_PARTS',
    [['PART', 'Módulo da câmera traseira', 1, 310]],
  ],
  [
    'Molhou e parou de funcionar',
    'COMPLETED',
    [['SERVICE', 'Limpeza química da placa', 1, 150]],
  ],
  [
    'Troca de tela',
    'DELIVERED',
    [
      ['PART', 'Tela com moldura', 1, 420],
      ['SERVICE', 'Troca de tela', 1, 100],
    ],
  ],
  [
    'Superaquecendo e desligando sozinho',
    'IN_PROGRESS',
    [['SERVICE', 'Limpeza e troca da pasta térmica', 1, 130]],
  ],
  ['Botão de volume travado', 'OPEN', []],
  ['Sem som no alto-falante', 'CANCELLED', []],
  ['Wi-Fi não conecta', 'IN_ANALYSIS', []],
]

async function request(method, path, { token, body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
  })

  const text = await response.text()

  return { status: response.status, data: text ? JSON.parse(text) : null }
}

async function call(method, path, token, body) {
  const { status, data } = await request(method, path, { token, body })

  if (status >= 400) {
    throw new Error(
      `${method} ${path} respondeu ${status}: ${JSON.stringify(data)}`,
    )
  }

  return data
}

function signIn() {
  return request('POST', '/authenticate', {
    body: {
      tenantSlug: DEMO_STORE.slug,
      email: DEMO_USERS.owner.email,
      password: DEMO_USERS.owner.password,
    },
  })
}

async function main() {
  let login = await signIn()

  if (login.status === 401) {
    await call('POST', '/accounts', null, {
      tenantName: DEMO_STORE.name,
      tenantSlug: DEMO_STORE.slug,
      tenantEmail: DEMO_STORE.email,
      tenantPhone: DEMO_STORE.phone,
      ownerName: DEMO_USERS.owner.name,
      ownerEmail: DEMO_USERS.owner.email,
      ownerPassword: DEMO_USERS.owner.password,
    })
    console.log(`Loja "${DEMO_STORE.slug}" cadastrada.`)
    login = await signIn()
  }

  if (login.status === 403) {
    console.log(
      `A loja está aguardando aprovação. Libere com:\n  npm run tenants:activate -- ${DEMO_STORE.slug}\ne rode este script de novo.`,
    )
    return
  }

  if (login.status !== 200) {
    throw new Error(
      `Login respondeu ${login.status}: ${JSON.stringify(login.data)}`,
    )
  }

  const token = login.data.access_token

  const existing = await call('GET', '/customers', token)
  if (existing.meta.totalCount > 0) {
    console.log('A loja demo já tem dados; nada foi alterado.')
    return
  }

  const technician = await call('POST', '/users', token, DEMO_USERS.technician)
  await call('POST', '/users', token, DEMO_USERS.receptionist)

  const customers = []
  for (const [index, [name, city, state]] of CUSTOMERS.entries()) {
    const { customer } = await call('POST', '/customers', token, {
      name,
      phone: `1198100${String(index).padStart(4, '0')}`,
      email: index % 3 === 0 ? `cliente${index}@example.com` : null,
      city,
      state,
    })
    customers.push(customer)
  }

  // The first customers bring devices; the rest are only registered
  const devices = []
  for (const [index, customer] of customers.slice(0, 14).entries()) {
    const { device } = await call('POST', '/devices', token, {
      customerId: customer.id,
      ...DEVICES[index % DEVICES.length],
      condition: index % 2 === 0 ? 'Riscos leves na traseira' : null,
      accessories: index % 3 === 0 ? 'Carregador' : null,
    })
    devices.push(device)
  }

  for (const [index, [problem, status, items]] of ORDERS.entries()) {
    const device = devices[index]
    const { serviceOrder } = await call('POST', '/service-orders', token, {
      customerId: device.customerId,
      deviceId: device.id,
      problemDescription: problem,
      priority: index % 4 === 0 ? 'HIGH' : 'NORMAL',
    })

    if (status !== 'OPEN') {
      await call(
        'PATCH',
        `/service-orders/${serviceOrder.id}/technician`,
        token,
        {
          technicianId: technician.user.id,
        },
      )
    }

    for (const [type, description, quantity, unitPrice] of items) {
      await call('POST', `/service-orders/${serviceOrder.id}/items`, token, {
        type,
        description,
        quantity,
        unitPrice,
      })
    }

    if (status !== 'OPEN') {
      await call('PATCH', `/service-orders/${serviceOrder.id}/status`, token, {
        status,
      })
    }
  }

  console.log(
    `Pronto: ${customers.length} clientes, ${devices.length} aparelhos e ${ORDERS.length} ordens de serviço na loja "${DEMO_STORE.slug}".`,
  )
  console.log('Os logins estão no começo de scripts/seed-dev.mjs.')
}

main().catch((error) => {
  console.error(
    error.cause?.code === 'ECONNREFUSED'
      ? `A API não respondeu em ${API_URL}. Suba a API com npm run dev e rode de novo.`
      : error.message,
  )
  process.exitCode = 1
})
