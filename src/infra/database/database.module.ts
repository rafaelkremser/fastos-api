import { Module } from '@nestjs/common'
import { EnvModule } from '@/infra/env/env.module'
import { PrismaService } from './prisma/prisma.service'
import { TransactionManager } from '@/core/transactions/transaction-manager'
import { PrismaTransactionManager } from './prisma/prisma-transaction-manager'
import { TenantsRepository } from '@/domain/account/application/repositories/tenants-repository'
import { UsersRepository } from '@/domain/account/application/repositories/users-repository'
import { PrismaTenantsRepository } from './prisma/repositories/prisma-tenants-repository'
import { PrismaUsersRepository } from './prisma/repositories/prisma-users-repository'
import { CustomersRepository } from '@/domain/customer/application/repositories/customers-repository'
import { PrismaCustomersRepository } from './prisma/repositories/prisma-customers-repository'
import { DevicesRepository } from '@/domain/device/application/repositories/devices-repository'
import { PrismaDevicesRepository } from './prisma/repositories/prisma-devices-repository'
import { ServiceOrdersRepository } from '@/domain/service-order/application/repositories/service-orders-repository'
import { PrismaServiceOrdersRepository } from './prisma/repositories/prisma-service-orders-repository'
import { ServiceOrderItemsRepository } from '@/domain/service-order/application/repositories/service-order-items-repository'
import { PrismaServiceOrderItemsRepository } from './prisma/repositories/prisma-service-order-items-repository'
import { ServiceOrderHistoryRepository } from '@/domain/service-order/application/repositories/service-order-history-repository'
import { PrismaServiceOrderHistoryRepository } from './prisma/repositories/prisma-service-order-history-repository'

@Module({
  imports: [EnvModule],
  providers: [
    PrismaService,
    {
      provide: TransactionManager,
      useClass: PrismaTransactionManager,
    },
    {
      provide: TenantsRepository,
      useClass: PrismaTenantsRepository,
    },
    {
      provide: UsersRepository,
      useClass: PrismaUsersRepository,
    },
    {
      provide: CustomersRepository,
      useClass: PrismaCustomersRepository,
    },
    {
      provide: DevicesRepository,
      useClass: PrismaDevicesRepository,
    },
    {
      provide: ServiceOrdersRepository,
      useClass: PrismaServiceOrdersRepository,
    },
    {
      provide: ServiceOrderItemsRepository,
      useClass: PrismaServiceOrderItemsRepository,
    },
    {
      provide: ServiceOrderHistoryRepository,
      useClass: PrismaServiceOrderHistoryRepository,
    },
  ],
  exports: [
    PrismaService,
    TransactionManager,
    TenantsRepository,
    UsersRepository,
    CustomersRepository,
    DevicesRepository,
    ServiceOrdersRepository,
    ServiceOrderItemsRepository,
    ServiceOrderHistoryRepository,
  ],
})
export class DatabaseModule {}
