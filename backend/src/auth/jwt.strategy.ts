import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback_super_secret_key',
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
      company_id: payload.company_id,
      companyId: payload.company_id, // Keep both for backward compatibility
    };
  }
}
