import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {

    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    const smtpPort = Number(
      this.configService.get<string>('SMTP_PORT') || '587',
    );
    const smtpSecure =
      (this.configService.get<string>('SMTP_SECURE') || 'false').toLowerCase() ===
      'true';

    this.logger.log(`SMTP_HOST=${this.configService.get<string>('SMTP_HOST')}`);
    this.logger.log(`SMTP_PORT=${smtpPort}`);
    this.logger.log(`SMTP_SECURE=${smtpSecure}`);
    this.logger.log(`SMTP_USER=${smtpUser}`);
    this.logger.log(
      `SMTP_PASS loaded=${!!smtpPass}, length=${smtpPass?.length ?? 0}`,
    );

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp-relay.brevo.com',
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,

    const port = Number(this.configService.get<string>('SMTP_PORT') || '587');
    const secure = (this.configService.get<string>('SMTP_SECURE') || 'false').toLowerCase() === 'true';
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port,
      secure,
      auth: {
        user: this.configService.get<string>('SMTP_USER') || undefined,
        pass: this.configService.get<string>('SMTP_PASS') || undefined,

      },
    });
  }

  private getSender(): string {
    return this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER') || 'noreply@edusphere.app';
  }

  async sendMail(to: string, subject: string, html: string, text?: string): Promise<void> {
    await this.transporter.sendMail({ from: this.getSender(), to, subject, html, text });
    this.logger.log(`Email sent to ${to}`);
  }

  async sendEmailVerification(to: string, otp: string): Promise<boolean> {
    try {
      await this.sendMail(to, 'EduSphere — Verify Your Email', `<h2>EduSphere</h2><p>Your verification code is:</p><h1>${otp}</h1><p>This code expires in 15 minutes.</p>`, `Your EduSphere verification code is ${otp}. It expires in 15 minutes.`);
      return true;
    } catch (error: unknown) {
      this.logger.error(error instanceof Error ? error.message : 'Verification email failed');
      return false;
    }
  }

<<<<<<< HEAD
  async sendSchoolApprovalEmail(
    to: string,
    schoolName: string,
    loginUrl: string,
  ): Promise<void> {
    await this.sendMail(
      to,
      'Your EduSphere school has been approved',
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h2>School Approved</h2><p>Your school <strong>${schoolName}</strong> has been approved.</p><p><a href="${loginUrl}">Open School Portal</a></p></div>`,
      `Your school ${schoolName} has been approved.\n\n${loginUrl}`,
    );
  }
  async sendVerificationEmail(to: string, name: string, verificationUrl: string): Promise<void> {
    await this.sendMail(to, 'Verify your EduSphere email', `<h2>Welcome to EduSphere</h2><p>Hello ${name},</p><p><a href="${verificationUrl}">Verify Email</a></p>`, `Hello ${name}, verify your email: ${verificationUrl}`);
  }

  async sendPasswordReset(to: string, token: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await this.sendMail(to, 'EduSphere — Password Reset', `<h2>Password Reset</h2><p><a href="${resetUrl}">Reset Password</a></p>`, `Reset your password: ${resetUrl}`);
    return true;
  }

  async sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<void> {
    await this.sendMail(to, 'Reset your EduSphere password', `<h2>Password Reset</h2><p>Hello ${name},</p><p><a href="${resetUrl}">Reset Password</a></p>`, `Hello ${name}, reset your password: ${resetUrl}`);
  }

  async sendSchoolOnboarding(to: string, details: { schoolName: string; schoolSlug: string; adminName: string; temporaryPassword: string; plan: string }): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const loginUrl = `${frontendUrl}/${details.schoolSlug}/login`;
    try {
      await this.sendMail(to, `Your ${details.schoolName} EduSphere account is ready`, `<h2>School Approved</h2><p>Hello ${details.adminName},</p><p>Your school <strong>${details.schoolName}</strong> has been approved.</p><p>Login: <a href="${loginUrl}">${loginUrl}</a></p><p>Email: ${to}</p><p>Temporary password: ${details.temporaryPassword}</p><p>Plan: ${details.plan}</p><p>Please change the temporary password after signing in.</p>`, `Your school was approved. Login: ${loginUrl}. Email: ${to}. Temporary password: ${details.temporaryPassword}. Plan: ${details.plan}.`);
      return true;
    } catch (error: unknown) {
      this.logger.error(error instanceof Error ? error.message : 'Onboarding email failed');
      return false;
    }
  }

  async sendSchoolApprovalEmail(to: string, schoolName: string, loginUrl: string): Promise<void> {
    await this.sendMail(to, 'Your EduSphere school has been approved', `<h2>School Approved</h2><p>Your school <strong>${schoolName}</strong> has been approved.</p><p><a href="${loginUrl}">Open School Portal</a></p>`, `Your school ${schoolName} was approved. ${loginUrl}`);

  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();

      this.logger.log('SMTP connection verified successfully');
      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown SMTP error';
      this.logger.error(`SMTP connection failed: ${message}`);

      return true;
    } catch (error: unknown) {
      this.logger.error(error instanceof Error ? error.message : 'SMTP verification failed');

      return false;
    }
  }
}
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const smtpUser =
      this.configService.get<string>('SMTP_USER') || undefined;

    const smtpPass =
      this.configService.get<string>('SMTP_PASS') || undefined;

    const smtpHost =
      this.configService.get<string>('SMTP_HOST') ||
      'smtp-relay.brevo.com';

    const smtpPort = Number(
      this.configService.get<string>('SMTP_PORT') || '587',
    );

    const smtpSecure =
      (
        this.configService.get<string>('SMTP_SECURE') || 'false'
      ).toLowerCase() === 'true';

    this.logger.log(`SMTP_HOST=${smtpHost}`);
    this.logger.log(`SMTP_PORT=${smtpPort}`);
    this.logger.log(`SMTP_SECURE=${smtpSecure}`);
    this.logger.log(`SMTP_USER=${smtpUser}`);
    this.logger.log(
      `SMTP_PASS loaded=${!!smtpPass}, length=${smtpPass?.length ?? 0}`,
    );

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  private getSender(): string {
    return (
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('SMTP_USER') ||
      'noreply@edusphere.app'
    );
  }

  async sendMail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: this.getSender(),
      to,
      subject,
      html,
      text,
    });

    this.logger.log(`Email sent to ${to}`);
  }

  async sendEmailVerification(
    to: string,
    otp: string,
  ): Promise<boolean> {
    try {
      await this.sendMail(
        to,
        'EduSphere — Verify Your Email',
        `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
            <h2>EduSphere</h2>
            <p>Your verification code is:</p>
            <h1>${otp}</h1>
            <p>This code expires in 15 minutes.</p>
          </div>
        `,
        `Your EduSphere verification code is ${otp}. It expires in 15 minutes.`,
      );

      return true;
    } catch (error: unknown) {
      this.logger.error(
        error instanceof Error
          ? error.message
          : 'Verification email failed',
      );

      return false;
    }
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    verificationUrl: string,
  ): Promise<void> {
    await this.sendMail(
      to,
      'Verify your EduSphere email',
      `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
          <h2>Welcome to EduSphere</h2>
          <p>Hello ${name},</p>
          <p>
            <a href="${verificationUrl}">
              Verify Email
            </a>
          </p>
        </div>
      `,
      `Hello ${name}, verify your email: ${verificationUrl}`,
    );
  }

  async sendSchoolApprovalEmail(
    to: string,
    schoolName: string,
    loginUrl: string,
  ): Promise<void> {
    await this.sendMail(
      to,
      'Your EduSphere school has been approved',
      `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
          <h2>School Approved</h2>

          <p>
            Your school
            <strong>${schoolName}</strong>
            has been approved.
          </p>

          <p>
            <a href="${loginUrl}">
              Open School Portal
            </a>
          </p>
        </div>
      `,
      `Your school ${schoolName} has been approved.

${loginUrl}`,
    );
  }

  async sendPasswordReset(
    to: string,
    token: string,
  ): Promise<boolean> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:5173';

    const resetUrl =
      `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

    try {
      await this.sendMail(
        to,
        'EduSphere — Password Reset',
        `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
            <h2>Password Reset</h2>

            <p>
              <a href="${resetUrl}">
                Reset Password
              </a>
            </p>
          </div>
        `,
        `Reset your EduSphere password: ${resetUrl}`,
      );

      return true;
    } catch (error: unknown) {
      this.logger.error(
        error instanceof Error
          ? error.message
          : 'Password reset email failed',
      );

      return false;
    }
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetUrl: string,
  ): Promise<void> {
    await this.sendMail(
      to,
      'Reset your EduSphere password',
      `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
          <h2>Password Reset</h2>

          <p>Hello ${name},</p>

          <p>
            <a href="${resetUrl}">
              Reset Password
            </a>
          </p>
        </div>
      `,
      `Hello ${name}, reset your EduSphere password: ${resetUrl}`,
    );
  }

  async sendSchoolOnboarding(
    to: string,
    details: {
      schoolName: string;
      schoolSlug: string;
      adminName: string;
      temporaryPassword: string;
      plan: string;
    },
  ): Promise<boolean> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:5173';

    const loginUrl =
      `${frontendUrl}/${details.schoolSlug}/login`;

    try {
      await this.sendMail(
        to,
        `Your ${details.schoolName} EduSphere account is ready`,
        `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
            <h2>School Approved</h2>

            <p>
              Hello ${details.adminName},
            </p>

            <p>
              Your school
              <strong>${details.schoolName}</strong>
              has been approved.
            </p>

            <p>
              <strong>Login:</strong>
              <a href="${loginUrl}">
                ${loginUrl}
              </a>
            </p>

            <p>
              <strong>Email:</strong>
              ${to}
            </p>

            <p>
              <strong>Temporary Password:</strong>
              ${details.temporaryPassword}
            </p>

            <p>
              <strong>Plan:</strong>
              ${details.plan}
            </p>

            <p>
              Please change the temporary password after signing in.
            </p>
          </div>
        `,
        `
Your school was approved.

Login: ${loginUrl}
Email: ${to}
Temporary password: ${details.temporaryPassword}
Plan: ${details.plan}
        `,
      );

      return true;
    } catch (error: unknown) {
      this.logger.error(
        error instanceof Error
          ? error.message
          : 'Onboarding email failed',
      );

      return false;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();

      this.logger.log(
        'SMTP connection verified successfully',
      );

      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown SMTP error';

      this.logger.error(
        `SMTP connection failed: ${message}`,
      );

      return false;
    }
  }
}
```
