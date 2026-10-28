import { ServiceOrderSummary } from '@/domain/service-order/enterprise/entities/value-objects/service-order-summary'

export class ServiceOrderSummaryPresenter {
  static toHTTP(summary: ServiceOrderSummary) {
    return {
      id: summary.serviceOrderId.toString(),
      number: summary.number,
      status: summary.status,
      priority: summary.priority,
      customer: {
        id: summary.customerId.toString(),
        name: summary.customerName,
        phone: summary.customerPhone,
      },
      device: {
        id: summary.deviceId.toString(),
        type: summary.deviceType,
        brand: summary.deviceBrand,
        model: summary.deviceModel,
      },
      technician: summary.technicianId
        ? {
            id: summary.technicianId.toString(),
            name: summary.technicianName,
          }
        : null,
      entryDate: summary.entryDate,
      estimatedDate: summary.estimatedDate,
      customerNotifiedAt: summary.customerNotifiedAt,
      needsCustomerNotice: summary.needsCustomerNotice,
      createdAt: summary.createdAt,
    }
  }
}
