import { Injectable } from '@nestjs/common'
import { Either, right } from '@/core/either'
import { getDayInTimeZone, STORE_TIME_ZONE } from '@/core/time/time-zone'
import {
  ACTIVE_STATUSES,
  ORDER_STATUSES,
  OrderStatus,
} from '../../enterprise/entities/service-order'
import { ServiceOrdersRepository } from '../repositories/service-orders-repository'

interface GetOperationsMetricsUseCaseRequest {
  tenantId: string
  now?: Date
}

export interface OperationsMetrics {
  // Every status, the empty ones with zero
  byStatus: Record<OrderStatus, number>
  // Still being worked on (ACTIVE_STATUSES)
  active: number
  // Active and past the due day
  late: number
  readyForPickup: number
  needsCustomerNotice: number
}

type GetOperationsMetricsUseCaseResponse = Either<
  null,
  {
    metrics: OperationsMetrics
  }
>

// How the store's work stands right now, for every role
@Injectable()
export class GetOperationsMetricsUseCase {
  constructor(private serviceOrdersRepository: ServiceOrdersRepository) {}

  async execute({
    tenantId,
    now = new Date(),
  }: GetOperationsMetricsUseCaseRequest): Promise<GetOperationsMetricsUseCaseResponse> {
    // Due days are kept as midnight UTC, so today is written the same way
    const today = new Date(
      `${getDayInTimeZone(now, STORE_TIME_ZONE)}T00:00:00.000Z`,
    )

    const [counts, late, needsCustomerNotice] = await Promise.all([
      this.serviceOrdersRepository.countByStatus(tenantId),
      this.serviceOrdersRepository.countLate(tenantId, today),
      this.serviceOrdersRepository.count(tenantId, {
        needsCustomerNotice: true,
      }),
    ])

    const byStatus = Object.fromEntries(
      ORDER_STATUSES.map((status) => [status, counts[status] ?? 0]),
    ) as Record<OrderStatus, number>

    return right({
      metrics: {
        byStatus,
        active: ACTIVE_STATUSES.reduce(
          (sum, status) => sum + byStatus[status],
          0,
        ),
        late,
        readyForPickup: byStatus.COMPLETED,
        needsCustomerNotice,
      },
    })
  }
}
