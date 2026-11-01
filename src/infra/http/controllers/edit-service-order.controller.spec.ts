import { randomUUID } from 'node:crypto'
import { NestExpressApplication } from '@nestjs/platform-express'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { makeServiceOrder } from 'test/factories/make-service-order'
import { right } from '@/core/either'
import { EditServiceOrderUseCase } from '@/domain/service-order/application/use-cases/edit-service-order'
import { EditServiceOrderController } from './edit-service-order.controller'

describe('Edit service order (HTTP)', () => {
  let app: NestExpressApplication

  afterEach(async () => {
    await app.close()
  })

  it('should drop a technician sent along with the edit', async () => {
    const tenantId = randomUUID()
    const serviceOrder = makeServiceOrder()
    const editServiceOrder = {
      execute: jest.fn().mockResolvedValue(right({ serviceOrder })),
    }

    const moduleRef = await Test.createTestingModule({
      controllers: [EditServiceOrderController],
      providers: [
        { provide: EditServiceOrderUseCase, useValue: editServiceOrder },
      ],
    }).compile()

    app = moduleRef.createNestApplication<NestExpressApplication>()
    // What the JWT guard leaves on the request; the guards are not under test
    app.use((req, _res, next) => {
      req.user = { sub: randomUUID(), tenantId, role: 'TECHNICIAN' }
      next()
    })
    await app.init()

    const response = await request(app.getHttpServer())
      .put(`/service-orders/${serviceOrder.id.toString()}`)
      .send({ diagnosis: 'Tela trincada', technicianId: randomUUID() })

    expect(response.status).toBe(200)
    expect(editServiceOrder.execute).toHaveBeenCalledWith({
      tenantId,
      serviceOrderId: serviceOrder.id.toString(),
      diagnosis: 'Tela trincada',
    })
  })
})
