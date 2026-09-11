import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;

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
      },
    });
  }

  private getSender(): string {
    const sender =
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('SMTP_USER') ||
      'noreply@edusphere.app';
    const senderName =
      this.configService.get<string>('SMTP_FROM_NAME') || 'EduSphere';

    return `"${senderName}" <${sender}>`;
  }

  async sendMail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.getSender(),
        to,
        subject,
        text,
        html,
      });
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown mail error';
      this.logger.error(`Failed to send email to ${to}: ${message}`);
      throw error;
    }
  }

  async sendEmailVerification(to: string, otp: string): Promise<boolean> {
    await this.sendMail(
      to,
      'EduSphere — Verify Your Email',
      `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>EduSphere</h2><p>Use this OTP to verify your email:</p><div style="font-size:30px;font-weight:700;letter-spacing:8px;margin:24px 0">${otp}</div><p>This code expires in 15 minutes.</p></div>`,
      `Your EduSphere verification OTP is: ${otp}. This code expires in 15 minutes.`,
    );
    return true;
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    verificationUrl: string,
  ): Promise<void> {
    await this.sendMail(
      to,
      'Verify your EduSphere email',
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h2>Welcome to EduSphere</h2><p>Hello ${name},</p><p>Please verify your email address:</p><p><a href="${verificationUrl}">Verify Email</a></p></div>`,
      `Hello ${name},\n\nPlease verify your EduSphere email using this link:\n${verificationUrl}`,
    );
  }

  async sendPasswordReset(to: string, token: string): Promise<boolean> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await this.sendMail(
      to,
      'EduSphere — Password Reset Request',
      `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>EduSphere</h2><p>You requested a password reset.</p><p><a href="${resetLink}">Reset Password</a></p><p>If you did not request this, ignore this email.</p></div>`,
      `You requested a password reset. Reset your password here: ${resetLink}`,
    );
    return true;
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetUrl: string,
  ): Promise<void> {
    await this.sendMail(
      to,
      'Reset your EduSphere password',
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h2>Password Reset</h2><p>Hello ${name},</p><p><a href="${resetUrl}">Reset Password</a></p></div>`,
      `Hello ${name},\n\nReset your EduSphere password using this link:\n${resetUrl}`,
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
    const appUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const loginUrl = `${appUrl}/${details.schoolSlug}/login`;

    try {
      await this.sendMail(
        to,
        `Your ${details.schoolName} EduSphere account is ready`,
        `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h2>EduSphere — School Approved</h2><p>Hello ${details.adminName},</p><p>Your <strong>${details.schoolName}</strong> account has been approved.</p><p><strong>Plan:</strong> ${details.plan}</p><p><strong>Email:</strong> ${to}</p><p><strong>Temporary password:</strong> ${details.temporaryPassword}</p><p><a href="${loginUrl}">Open School Portal</a></p><p>Please change your password after signing in.</p></div>`,
        `Hello ${details.adminName},\n\nYour ${details.schoolName} account has been approved.\n\nLogin URL: ${loginUrl}\nEmail: ${to}\nTemporary password: ${details.temporaryPassword}\nPlan: ${details.plan}\n\nPlease change your password after signing in.`,
      );
      return true;
    } catch {
      return false;
    }
  }

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

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown SMTP error';
      this.logger.error(`SMTP connection failed: ${message}`);
      return false;
    }
  }
}
