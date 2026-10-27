import { ServiceOrderItem } from '../../enterprise/entities/service-order-item'

// Items are read and written through the service order aggregate; only the
// service orders repository uses this, to persist the item list's changes
export abstract class ServiceOrderItemsRepository {
  abstract createMany(items: ServiceOrderItem[]): Promise<void>
  abstract deleteMany(items: ServiceOrderItem[]): Promise<void>
}
