import { ServiceOrderItemsRepository } from '@/domain/service-order/application/repositories/service-order-items-repository'
import { ServiceOrderItem } from '@/domain/service-order/enterprise/entities/service-order-item'

export class InMemoryServiceOrderItemsRepository implements ServiceOrderItemsRepository {
  public items: ServiceOrderItem[] = []

  async createMany(items: ServiceOrderItem[]) {
    this.items.push(...items)
  }

  async deleteMany(items: ServiceOrderItem[]) {
    this.items = this.items.filter(
      (item) => !items.some((removed) => removed.id.equals(item.id)),
    )
  }
}
