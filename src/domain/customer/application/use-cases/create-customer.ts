import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Customer } from '../../enterprise/entities/customer'
import { CustomersRepository } from '../repositories/customers-repository'
import { CustomerAlreadyExistsError } from './errors/customer-already-exists-error'

interface CreateCustomerUseCaseRequest {
  tenantId: string
  name: string
  phone: string
  document?: string | null
  email?: string | null
  phone2?: string | null
  address?: string | null
  addressNumber?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  notes?: string | null
}

type CreateCustomerUseCaseResponse = Either<
  CustomerAlreadyExistsError,
  {
    customer: Customer
  }
>

@Injectable()
export class CreateCustomerUseCase {
  constructor(private customersRepository: CustomersRepository) {}

  async execute({
    tenantId,
    name,
    phone,
    document,
    email,
    phone2,
    address,
    addressNumber,
    complement,
    neighborhood,
    city,
    state,
    zipCode,
    notes,
  }: CreateCustomerUseCaseRequest): Promise<CreateCustomerUseCaseResponse> {
    const customerWithSamePhone = await this.customersRepository.findByPhone(
      tenantId,
      phone,
    )

    if (customerWithSamePhone) {
      return left(new CustomerAlreadyExistsError(phone))
    }

    const customer = Customer.create({
      tenantId: new UniqueEntityID(tenantId),
      name,
      phone,
      document: document ?? null,
      email: email ?? null,
      phone2: phone2 ?? null,
      address: address ?? null,
      addressNumber: addressNumber ?? null,
      complement: complement ?? null,
      neighborhood: neighborhood ?? null,
      city: city ?? null,
      state: state ?? null,
      zipCode: zipCode ?? null,
      notes: notes ?? null,
    })

    await this.customersRepository.create(customer)

    return right({
      customer,
    })
  }
}
