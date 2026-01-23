import { ServiceOrderItem } from '@/domain/service-order/enterprise/entities/service-order-item'

export class ServiceOrderItemPresenter {
  static toHTTP(item: ServiceOrderItem) {
    return {
      id: item.id.toString(),
      type: item.type,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      createdAt: item.createdAt,
    }
  }
}
