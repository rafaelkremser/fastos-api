import { Customer } from '@/domain/customer/enterprise/entities/customer'

export class CustomerPresenter {
  static toHTTP(customer: Customer) {
    return {
      id: customer.id.toString(),
      name: customer.name,
      document: customer.document,
      email: customer.email,
      phone: customer.phone,
      phone2: customer.phone2,
      address: customer.address,
      addressNumber: customer.addressNumber,
      complement: customer.complement,
      neighborhood: customer.neighborhood,
      city: customer.city,
      state: customer.state,
      zipCode: customer.zipCode,
      notes: customer.notes,
      createdAt: customer.createdAt,
    }
  }
}
