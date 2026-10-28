import { Module } from '@nestjs/common'
import { ThrottlerModule } from '@nestjs/throttler'
import { DatabaseModule } from '../database/database.module'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { THROTTLER_OPTIONS } from './rate-limit'

// Account Controllers
import { CreateAccountController } from './controllers/create-account.controller'
import { AuthenticateController } from './controllers/authenticate.controller'
import { RefreshAccessTokenController } from './controllers/refresh-access-token.controller'
import { CreateUserController } from './controllers/create-user.controller'
import { GetUserController } from './controllers/get-user.controller'
import { FetchUsersController } from './controllers/fetch-users.controller'
import { GetTenantController } from './controllers/get-tenant.controller'

// Customer Controllers
import { CreateCustomerController } from './controllers/create-customer.controller'
import { EditCustomerController } from './controllers/edit-customer.controller'
import { DeleteCustomerController } from './controllers/delete-customer.controller'
import { GetCustomerController } from './controllers/get-customer.controller'
import { FetchCustomersController } from './controllers/fetch-customers.controller'

// Device Controllers
import { CreateDeviceController } from './controllers/create-device.controller'
import { EditDeviceController } from './controllers/edit-device.controller'
import { DeleteDeviceController } from './controllers/delete-device.controller'
import { GetDeviceController } from './controllers/get-device.controller'
import { FetchDevicesByCustomerController } from './controllers/fetch-devices-by-customer.controller'

// ServiceOrder Controllers
import { CreateServiceOrderController } from './controllers/create-service-order.controller'
import { GetServiceOrderController } from './controllers/get-service-order.controller'
import { FetchServiceOrdersController } from './controllers/fetch-service-orders.controller'
import { EditServiceOrderController } from './controllers/edit-service-order.controller'
import { ChangeServiceOrderStatusController } from './controllers/change-service-order-status.controller'
import { AssignTechnicianController } from './controllers/assign-technician.controller'
import { AddServiceOrderItemController } from './controllers/add-service-order-item.controller'
import { RemoveServiceOrderItemController } from './controllers/remove-service-order-item.controller'
import { FetchServiceOrderHistoryController } from './controllers/fetch-service-order-history.controller'

// Account Use Cases
import { RegisterTenantUseCase } from '@/domain/account/application/use-cases/register-tenant'
import { AuthenticateUserUseCase } from '@/domain/account/application/use-cases/authenticate-user'
import { RefreshAccessTokenUseCase } from '@/domain/account/application/use-cases/refresh-access-token'
import { CreateUserUseCase } from '@/domain/account/application/use-cases/create-user'
import { FetchUsersUseCase } from '@/domain/account/application/use-cases/fetch-users'
import { GetUserUseCase } from '@/domain/account/application/use-cases/get-user'
import { GetTenantUseCase } from '@/domain/account/application/use-cases/get-tenant'

// Customer Use Cases
import { CreateCustomerUseCase } from '@/domain/customer/application/use-cases/create-customer'
import { EditCustomerUseCase } from '@/domain/customer/application/use-cases/edit-customer'
import { DeleteCustomerUseCase } from '@/domain/customer/application/use-cases/delete-customer'
import { GetCustomerUseCase } from '@/domain/customer/application/use-cases/get-customer'
import { FetchCustomersUseCase } from '@/domain/customer/application/use-cases/fetch-customers'

// Device Use Cases
import { CreateDeviceUseCase } from '@/domain/device/application/use-cases/create-device'
import { EditDeviceUseCase } from '@/domain/device/application/use-cases/edit-device'
import { DeleteDeviceUseCase } from '@/domain/device/application/use-cases/delete-device'
import { GetDeviceUseCase } from '@/domain/device/application/use-cases/get-device'
import { FetchDevicesByCustomerUseCase } from '@/domain/device/application/use-cases/fetch-devices-by-customer'

// ServiceOrder Use Cases
import { CreateServiceOrderUseCase } from '@/domain/service-order/application/use-cases/create-service-order'
import { GetServiceOrderUseCase } from '@/domain/service-order/application/use-cases/get-service-order'
import { FetchServiceOrdersUseCase } from '@/domain/service-order/application/use-cases/fetch-service-orders'
import { EditServiceOrderUseCase } from '@/domain/service-order/application/use-cases/edit-service-order'
import { ChangeServiceOrderStatusUseCase } from '@/domain/service-order/application/use-cases/change-service-order-status'
import { AssignTechnicianUseCase } from '@/domain/service-order/application/use-cases/assign-technician'
import { AddServiceOrderItemUseCase } from '@/domain/service-order/application/use-cases/add-service-order-item'
import { RemoveServiceOrderItemUseCase } from '@/domain/service-order/application/use-cases/remove-service-order-item'
import { FetchServiceOrderHistoryUseCase } from '@/domain/service-order/application/use-cases/fetch-service-order-history'

@Module({
  imports: [
    DatabaseModule,
    CryptographyModule,
    ThrottlerModule.forRoot(THROTTLER_OPTIONS),
  ],
  controllers: [
    // Account
    CreateAccountController,
    AuthenticateController,
    RefreshAccessTokenController,
    CreateUserController,
    GetUserController,
    FetchUsersController,
    GetTenantController,
    // Customer
    CreateCustomerController,
    EditCustomerController,
    DeleteCustomerController,
    GetCustomerController,
    FetchCustomersController,
    // Device
    CreateDeviceController,
    EditDeviceController,
    DeleteDeviceController,
    GetDeviceController,
    FetchDevicesByCustomerController,
    // ServiceOrder
    CreateServiceOrderController,
    GetServiceOrderController,
    FetchServiceOrdersController,
    EditServiceOrderController,
    ChangeServiceOrderStatusController,
    AssignTechnicianController,
    AddServiceOrderItemController,
    RemoveServiceOrderItemController,
    FetchServiceOrderHistoryController,
  ],
  providers: [
    // Account Use Cases
    RegisterTenantUseCase,
    AuthenticateUserUseCase,
    RefreshAccessTokenUseCase,
    CreateUserUseCase,
    FetchUsersUseCase,
    GetUserUseCase,
    GetTenantUseCase,
    // Customer Use Cases
    CreateCustomerUseCase,
    EditCustomerUseCase,
    DeleteCustomerUseCase,
    GetCustomerUseCase,
    FetchCustomersUseCase,
    // Device Use Cases
    CreateDeviceUseCase,
    EditDeviceUseCase,
    DeleteDeviceUseCase,
    GetDeviceUseCase,
    FetchDevicesByCustomerUseCase,
    // ServiceOrder Use Cases
    CreateServiceOrderUseCase,
    GetServiceOrderUseCase,
    FetchServiceOrdersUseCase,
    EditServiceOrderUseCase,
    ChangeServiceOrderStatusUseCase,
    AssignTechnicianUseCase,
    AddServiceOrderItemUseCase,
    RemoveServiceOrderItemUseCase,
    FetchServiceOrderHistoryUseCase,
  ],
})
export class HttpModule {}
