import { ServiceOrderItem } from '../../enterprise/entities/service-order-item'

export abstract class ServiceOrderItemsRepository {
  abstract findById(id: string): Promise<ServiceOrderItem | null>
  abstract findManyByServiceOrderId(
    serviceOrderId: string,
  ): Promise<ServiceOrderItem[]>
  abstract create(item: ServiceOrderItem): Promise<void>
  abstract createMany(items: ServiceOrderItem[]): Promise<void>
  abstract save(item: ServiceOrderItem): Promise<void>
  abstract delete(item: ServiceOrderItem): Promise<void>
  abstract deleteMany(items: ServiceOrderItem[]): Promise<void>
  abstract deleteManyByServiceOrderId(serviceOrderId: string): Promise<void>
}
