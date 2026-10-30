import { Injectable } from '@nestjs/common'
import { Either, right } from '@/core/either'
import {
  getDayInTimeZone,
  startOfDayInTimeZone,
  startOfMonth,
  STORE_TIME_ZONE,
} from '@/core/time/time-zone'
import { UsersRepository } from '@/domain/account/application/repositories/users-repository'
import {
  ServiceOrdersRepository,
  TechnicianTotals,
} from '../repositories/service-orders-repository'

interface GetTechnicianMetricsUseCaseRequest {
  tenantId: string
  now?: Date
}

export type TechnicianNumbers = Omit<TechnicianTotals, 'technicianId'>

export interface TechnicianMetrics extends TechnicianNumbers {
  technicianId: string
  name: string
}

type GetTechnicianMetricsUseCaseResponse = Either<
  null,
  {
    metrics: {
      // Sorted by name
      technicians: TechnicianMetrics[]
      // The orders nobody was assigned to
      unassigned: TechnicianNumbers
    }
  }
>

const NO_ORDERS: TechnicianNumbers = {
  active: 0,
  late: 0,
  completed: 0,
  delivered: 0,
  revenue: 0,
}

function withoutId({ technicianId: _, ...numbers }: TechnicianTotals) {
  // Sums with decimals drift a little (0.1 + 0.2); money is in cents
  return { ...numbers, revenue: Math.round(numbers.revenue * 100) / 100 }
}

// Each technician's orders: in progress and late right now, completed,
// delivered and revenue this month (in Brazil's time). For the owner and
// admins only
@Injectable()
export class GetTechnicianMetricsUseCase {
  constructor(
    private serviceOrdersRepository: ServiceOrdersRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    tenantId,
    now = new Date(),
  }: GetTechnicianMetricsUseCaseRequest): Promise<GetTechnicianMetricsUseCaseResponse> {
    const timeZone = STORE_TIME_ZONE
    const today = getDayInTimeZone(now, timeZone)

    const [rows, users] = await Promise.all([
      this.serviceOrdersRepository.sumByTechnician(tenantId, {
        // Due days are kept as midnight UTC, so today is written the same way
        today: new Date(`${today}T00:00:00.000Z`),
        start: startOfDayInTimeZone(startOfMonth(today), timeZone),
        end: now,
      }),
      this.usersRepository.findManyByTenantId(tenantId),
    ])

    const byTechnician = new Map(rows.map((row) => [row.technicianId, row]))

    // Who can take orders (active, not a receptionist) shows up even with
    // none; anyone else only if orders are assigned to them
    const technicians = users
      .filter(
        (user) =>
          byTechnician.has(user.id.toString()) ||
          (user.isActive && user.role !== 'RECEPTIONIST'),
      )
      .map((user) => {
        const row = byTechnician.get(user.id.toString())

        return {
          technicianId: user.id.toString(),
          name: user.name,
          ...(row ? withoutId(row) : NO_ORDERS),
        }
      })

    const unassigned = byTechnician.get(null)

    return right({
      metrics: {
        technicians,
        unassigned: unassigned ? withoutId(unassigned) : NO_ORDERS,
      },
    })
  }
}
