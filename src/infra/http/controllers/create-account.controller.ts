import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { Public } from '@/infra/auth/public'
import { RegisterTenantUseCase } from '@/domain/account/application/use-cases/register-tenant'
import { TenantAlreadyExistsError } from '@/domain/account/application/use-cases/errors/tenant-already-exists-error'
import { UserAlreadyExistsError } from '@/domain/account/application/use-cases/errors/user-already-exists-error'
import { TenantPresenter } from '../presenters/tenant-presenter'
import { UserPresenter } from '../presenters/user-presenter'

const createAccountBodySchema = z.object({
  tenantName: z.string().min(2),
  tenantEmail: z.string().email(),
  tenantDocument: z.string().optional().nullable(),
  tenantPhone: z.string().optional().nullable(),
  ownerName: z.string().min(2),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(6),
})

const bodyValidationPipe = new ZodValidationPipe(createAccountBodySchema)

type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>

@ApiTags('Account')
@Controller('/accounts')
@Public()
export class CreateAccountController {
  constructor(private registerTenant: RegisterTenantUseCase) {}

  @Post()
  @HttpCode(201)
  async handle(@Body(bodyValidationPipe) body: CreateAccountBodySchema) {
    const {
      tenantName,
      tenantEmail,
      tenantDocument,
      tenantPhone,
      ownerName,
      ownerEmail,
      ownerPassword,
    } = body

    const result = await this.registerTenant.execute({
      tenantName,
      tenantEmail,
      tenantDocument,
      tenantPhone,
      ownerName,
      ownerEmail,
      ownerPassword,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case TenantAlreadyExistsError:
        case UserAlreadyExistsError:
          throw new ConflictException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    return {
      tenant: TenantPresenter.toHTTP(result.value.tenant),
      user: UserPresenter.toHTTP(result.value.user),
    }
  }
}
