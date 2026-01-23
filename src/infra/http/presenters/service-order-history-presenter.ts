import { ServiceOrderHistory } from '@/domain/service-order/enterprise/entities/service-order-history'

export class ServiceOrderHistoryPresenter {
  static toHTTP(history: ServiceOrderHistory) {
    return {
      id: history.id.toString(),
      userId: history.userId?.toString() ?? null,
      action: history.action,
      description: history.description,
      oldValue: history.oldValue,
      newValue: history.newValue,
      createdAt: history.createdAt,
    }
  }
}
