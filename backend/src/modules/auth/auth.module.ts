import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OnboardingStatusController } from './onboarding-status.controller';
import { OnboardingStatusService } from './onboarding-status.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PendingSchoolRegistrationService } from './pending-school-registration.service';
import { SchoolRegistrationService } from './school-registration.service';
import { MailModule } from '../mail/mail.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret && config.get<string>('NODE_ENV') === 'production') {
          throw new Error('JWT_SECRET is required in production.');
        }
        return { secret: secret || 'development-only-secret', signOptions: { expiresIn: (config.get<string>('JWT_EXPIRATION') || '15m') as any } };
      },
    }),
    MailModule,
    MediaModule,
  ],
  controllers: [AuthController, OnboardingStatusController],
  providers: [AuthService, OnboardingStatusService, JwtStrategy, PendingSchoolRegistrationService, SchoolRegistrationService],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
