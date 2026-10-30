import { Injectable } from '@nestjs/common'
import { Either, right } from '@/core/either'
import {
  addDays,
  getDayInTimeZone,
  startOfDayInTimeZone,
  startOfMonth,
  STORE_TIME_ZONE,
} from '@/core/time/time-zone'
import {
  DailyDeliveredTotals,
  DeliveredTotals,
  ServiceOrdersRepository,
} from '../repositories/service-orders-repository'

// How many days the daily series covers, today included
export const DAILY_REVENUE_DAYS = 30

interface GetRevenueMetricsUseCaseRequest {
  tenantId: string
  now?: Date
}

export interface RevenueMetrics {
  // From the first day of this month until now
  currentMonth: DeliveredTotals
  // The same stretch of the month before, so a month that has just begun is
  // not measured against a whole one
  previousMonth: DeliveredTotals
  // Every one of the last days, the ones without deliveries with zero
  daily: DailyDeliveredTotals[]
}

type GetRevenueMetricsUseCaseResponse = Either<
  null,
  {
    metrics: RevenueMetrics
  }
>

// Sums with decimals drift a little (0.1 + 0.2); money is in cents
function roundCents<T extends DeliveredTotals>(totals: T): T {
  return { ...totals, revenue: Math.round(totals.revenue * 100) / 100 }
}

// What the store took in. An order counts when it is delivered, on the day it
// was delivered, with its total (ServiceOrder.totalWithDiscount)
@Injectable()
export class GetRevenueMetricsUseCase {
  constructor(private serviceOrdersRepository: ServiceOrdersRepository) {}

  async execute({
    tenantId,
    now = new Date(),
  }: GetRevenueMetricsUseCaseRequest): Promise<GetRevenueMetricsUseCaseResponse> {
    const timeZone = STORE_TIME_ZONE
    const today = getDayInTimeZone(now, timeZone)

    const monthStart = startOfDayInTimeZone(startOfMonth(today), timeZone)
    const previousMonthStart = startOfDayInTimeZone(
      startOfMonth(today, -1),
      timeZone,
    )
    // As far into the previous month as now is into this one, and no further
    // than its end (March 30 is compared with the whole of February)
    const previousMonthEnd = new Date(
      Math.min(
        previousMonthStart.getTime() + (now.getTime() - monthStart.getTime()),
        monthStart.getTime(),
      ),
    )

    const firstDay = addDays(today, -(DAILY_REVENUE_DAYS - 1))

    const [currentMonth, previousMonth, days] = await Promise.all([
      this.serviceOrdersRepository.sumDelivered(tenantId, monthStart, now),
      this.serviceOrdersRepository.sumDelivered(
        tenantId,
        previousMonthStart,
        previousMonthEnd,
      ),
      this.serviceOrdersRepository.sumDeliveredByDay(
        tenantId,
        startOfDayInTimeZone(firstDay, timeZone),
        now,
        timeZone,
      ),
    ])

    const daily = Array.from({ length: DAILY_REVENUE_DAYS }, (_, index) => {
      const day = addDays(firstDay, index)

      return (
        days.find((totals) => totals.day === day) ?? {
          day,
          delivered: 0,
          revenue: 0,
        }
      )
    })

    return right({
      metrics: {
        currentMonth: roundCents(currentMonth),
        previousMonth: roundCents(previousMonth),
        daily: daily.map(roundCents),
      },
    })
  }
}
