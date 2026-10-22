import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { z } from 'zod'
import { EnvService } from '@/infra/env/env.service'
import { USER_ROLES } from '@/domain/account/enterprise/entities/user'

const tokenPayloadSchema = z.object({
  sub: z.string().uuid(),
  tenantId: z.string().uuid(),
  role: z.enum(USER_ROLES),
  type: z.literal('access'),
})

export type UserPayload = z.infer<typeof tokenPayloadSchema>

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(env: EnvService) {
    const publicKey = env.get('JWT_PUBLIC_KEY')

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: Buffer.from(publicKey, 'base64'),
      algorithms: ['RS256'],
    })
  }

  // A refresh token or a malformed payload is a 401, not a server error
  async validate(payload: unknown): Promise<UserPayload> {
    const result = tokenPayloadSchema.safeParse(payload)

    if (!result.success) {
      throw new UnauthorizedException()
    }

    return result.data
  }
}
