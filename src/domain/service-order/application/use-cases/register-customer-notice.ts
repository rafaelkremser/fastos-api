import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { TransactionManager } from '@/core/transactions/transaction-manager'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ServiceOrdersRepository } from '../repositories/service-orders-repository'
import { ServiceOrderHistoryRepository } from '../repositories/service-order-history-repository'
import { ServiceOrderHistory } from '../../enterprise/entities/service-order-history'
import { ServiceOrder } from '../../enterprise/entities/service-order'

export const NOTICE_CHANNELS = [
  'WHATSAPP',
  'PHONE',
  'SMS',
  'EMAIL',
  'IN_PERSON',
] as const

export type NoticeChannel = (typeof NOTICE_CHANNELS)[number]

// For the history, which is written in Portuguese like the other entries
const CHANNEL_LABELS: Record<NoticeChannel, string> = {
  WHATSAPP: 'WhatsApp',
  PHONE: 'telefone',
  SMS: 'SMS',
  EMAIL: 'e-mail',
  IN_PERSON: 'pessoalmente',
}

interface RegisterCustomerNoticeUseCaseRequest {
  tenantId: string
  serviceOrderId: string
  userId: string
  channel: NoticeChannel
  notes?: string
}

type RegisterCustomerNoticeUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    serviceOrder: ServiceOrder
  }
>

// The store told the customer about the order (the quote, the device ready
// to pick up). Changing the status later clears it, so a new notice is due
@Injectable()
export class RegisterCustomerNoticeUseCase {
  constructor(
    private serviceOrdersRepository: ServiceOrdersRepository,
    private historyRepository: ServiceOrderHistoryRepository,
    private transactionManager: TransactionManager,
  ) {}

  async execute({
    tenantId,
    serviceOrderId,
    userId,
    channel,
    notes,
  }: RegisterCustomerNoticeUseCaseRequest): Promise<RegisterCustomerNoticeUseCaseResponse> {
    const serviceOrder =
      await this.serviceOrdersRepository.findById(serviceOrderId)

    if (!serviceOrder) {
      return left(new ResourceNotFoundError())
    }

    if (serviceOrder.tenantId.toString() !== tenantId) {
      return left(new NotAllowedError())
    }

    serviceOrder.registerCustomerNotice()

    const notice = `Cliente avisado por ${CHANNEL_LABELS[channel]}`

    const history = ServiceOrderHistory.create({
      serviceOrderId: serviceOrder.id,
      userId: new UniqueEntityID(userId),
      action: 'CUSTOMER_NOTIFIED',
      description: notes ? `${notice}: ${notes}` : notice,
      oldValue: null,
      newValue: channel,
    })

    await this.transactionManager.run(async () => {
      await this.serviceOrdersRepository.save(serviceOrder)
      await this.historyRepository.create(history)
    })

    return right({ serviceOrder })
  }
}
