import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { Customer } from '../../enterprise/entities/customer'
import { CustomersRepository } from '../repositories/customers-repository'

interface EditCustomerUseCaseRequest {
  tenantId: string
  customerId: string
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

type EditCustomerUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    customer: Customer
  }
>

@Injectable()
export class EditCustomerUseCase {
  constructor(private customersRepository: CustomersRepository) {}

  async execute({
    tenantId,
    customerId,
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
  }: EditCustomerUseCaseRequest): Promise<EditCustomerUseCaseResponse> {
    const customer = await this.customersRepository.findById(customerId)

    if (!customer) {
      return left(new ResourceNotFoundError())
    }

    if (customer.tenantId.toString() !== tenantId) {
      return left(new NotAllowedError())
    }

    customer.name = name
    customer.phone = phone
    customer.document = document ?? null
    customer.email = email ?? null
    customer.phone2 = phone2 ?? null
    customer.address = address ?? null
    customer.addressNumber = addressNumber ?? null
    customer.complement = complement ?? null
    customer.neighborhood = neighborhood ?? null
    customer.city = city ?? null
    customer.state = state ?? null
    customer.zipCode = zipCode ?? null
    customer.notes = notes ?? null

    await this.customersRepository.save(customer)

    return right({
      customer,
    })
  }
}
