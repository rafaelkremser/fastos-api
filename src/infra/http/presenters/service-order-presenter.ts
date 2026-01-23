import { ServiceOrder } from '@/domain/service-order/enterprise/entities/service-order'

export class ServiceOrderPresenter {
  static toHTTP(serviceOrder: ServiceOrder) {
    return {
      id: serviceOrder.id.toString(),
      number: serviceOrder.number,
      customerId: serviceOrder.customerId.toString(),
      deviceId: serviceOrder.deviceId.toString(),
      status: serviceOrder.status,
      priority: serviceOrder.priority,
      technicianId: serviceOrder.technicianId?.toString() ?? null,
      createdById: serviceOrder.createdById.toString(),
      problemDescription: serviceOrder.problemDescription,
      diagnosis: serviceOrder.diagnosis,
      solution: serviceOrder.solution,
      entryDate: serviceOrder.entryDate,
      estimatedDate: serviceOrder.estimatedDate,
      completedDate: serviceOrder.completedDate,
      deliveredDate: serviceOrder.deliveredDate,
      estimatedCost: serviceOrder.estimatedCost,
      finalCost: serviceOrder.finalCost,
      discount: serviceOrder.discount,
      totalWithDiscount: serviceOrder.totalWithDiscount,
      internalNotes: serviceOrder.internalNotes,
      customerNotes: serviceOrder.customerNotes,
      warrantyDays: serviceOrder.warrantyDays,
      warrantyUntil: serviceOrder.warrantyUntil,
      createdAt: serviceOrder.createdAt,
    }
  }
}
