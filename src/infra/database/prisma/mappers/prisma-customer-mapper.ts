import { Prisma, Customer as PrismaCustomer } from '@prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Customer } from '@/domain/customer/enterprise/entities/customer'

export class PrismaCustomerMapper {
  static toDomain(raw: PrismaCustomer): Customer {
    return Customer.create(
      {
        tenantId: new UniqueEntityID(raw.tenantId),
        name: raw.name,
        document: raw.document,
        email: raw.email,
        phone: raw.phone,
        phone2: raw.phone2,
        address: raw.address,
        addressNumber: raw.addressNumber,
        complement: raw.complement,
        neighborhood: raw.neighborhood,
        city: raw.city,
        state: raw.state,
        zipCode: raw.zipCode,
        notes: raw.notes,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(customer: Customer): Prisma.CustomerUncheckedCreateInput {
    return {
      id: customer.id.toString(),
      tenantId: customer.tenantId.toString(),
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
      updatedAt: customer.updatedAt,
    }
  }
}
