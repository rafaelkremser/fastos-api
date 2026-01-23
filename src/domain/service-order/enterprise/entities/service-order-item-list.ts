import { WatchedList } from '@/core/entities/watched-list'
import { ServiceOrderItem } from './service-order-item'

export class ServiceOrderItemList extends WatchedList<ServiceOrderItem> {
  compareItems(a: ServiceOrderItem, b: ServiceOrderItem): boolean {
    return a.id.equals(b.id)
  }
}
