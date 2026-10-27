import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Customer,
  CustomerProps,
} from '@/domain/customer/enterprise/entities/customer'

export function makeCustomer(
  override: Partial<CustomerProps> = {},
  id?: UniqueEntityID,
) {
  return Customer.create(
    {
      tenantId: new UniqueEntityID(),
      name: 'Maria Souza',
      phone: '11999990000',
      document: null,
      email: null,
      phone2: null,
      address: null,
      addressNumber: null,
      complement: null,
      neighborhood: null,
      city: null,
      state: null,
      zipCode: null,
      notes: null,
      ...override,
    },
    id,
  )
}
