import { Injectable } from '@nestjs/common'
import { Either, right } from '@/core/either'
import {
  ACTIVE_STATUSES,
  OrderStatus,
} from '../../enterprise/entities/service-order'
import { ServiceOrderHistoryRepository } from '../repositories/service-order-history-repository'

// How far back the stays are taken: long enough for a small store to have a
// few in each stage
export const STAGE_TIMES_DAYS = 90

// Being worked on, and ready while the customer does not come
export const MEASURED_STAGES: OrderStatus[] = [...ACTIVE_STATUSES, 'COMPLETED']

const HOUR = 60 * 60 * 1000

interface GetStageTimesUseCaseRequest {
  tenantId: string
  now?: Date
}

export interface StageTime {
  status: OrderStatus
  // How many stays ended in the period
  stays: number
  // Null without stays
  medianHours: number | null
}

type GetStageTimesUseCaseResponse = Either<
  null,
  {
    stages: StageTime[]
  }
>

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}

// How long orders stay in each stage, for the whole store and never per
// person: it shows where work gets stuck. The median, so one odd order does
// not move it. A stay counts when it ends, and from when it began, even if
// that was before the period. For the owner and admins only
@Injectable()
export class GetStageTimesUseCase {
  constructor(private historyRepository: ServiceOrderHistoryRepository) {}

  async execute({
    tenantId,
    now = new Date(),
  }: GetStageTimesUseCaseRequest): Promise<GetStageTimesUseCaseResponse> {
    const since = new Date(now.getTime() - STAGE_TIMES_DAYS * 24 * HOUR)
    const changes = await this.historyRepository.findStatusChanges(
      tenantId,
      since,
    )

    const durations = new Map<string, number[]>()
    let previous: (typeof changes)[number] | null = null

    for (const change of changes) {
      // Each change ends a stay in its old status, begun at the order's
      // previous change or, for the first one, when the order came in
      const startedAt =
        previous?.serviceOrderId === change.serviceOrderId
          ? previous.changedAt
          : change.orderEntryDate
      previous = change

      const duration = change.changedAt.getTime() - startedAt.getTime()

      if (!change.from || change.changedAt < since || duration < 0) continue

      durations.set(change.from, [
        ...(durations.get(change.from) ?? []),
        duration,
      ])
    }

    return right({
      stages: MEASURED_STAGES.map((status) => {
        const stays = durations.get(status) ?? []

        return {
          status,
          stays: stays.length,
          medianHours: stays.length
            ? Math.round((median(stays) / HOUR) * 10) / 10
            : null,
        }
      }),
    })
  }
}
