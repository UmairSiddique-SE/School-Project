import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
<<<<<<< HEAD
=======
  private readonly transporter: nodemailer.Transporter;
>>>>>>> 921669f09616a421944b541bc2c30b49a8702eb5
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    this.logger.log(`SMTP_HOST=${this.configService.get<string>('SMTP_HOST')}`);
    this.logger.log(`SMTP_PORT=${this.configService.get<string>('SMTP_PORT')}`);
    this.logger.log(
      `SMTP_SECURE=${this.configService.get<string>('SMTP_SECURE')}`,
    );
    this.logger.log(`SMTP_USER=${smtpUser}`);
    this.logger.log(
      `SMTP_PASS loaded=${!!smtpPass}, length=${smtpPass?.length ?? 0}`,
    );

    const smtpPort = Number(
      this.configService.get<string>('SMTP_PORT') || '587',
    );
    const smtpSecure =
      (
        this.configService.get<string>('SMTP_SECURE') || 'false'
      ).toLowerCase() === 'true';

<<<<<<< HEAD
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
=======
  constructor(private readonly configService: ConfigService) {
    const smtpPort = Number(
      this.configService.get<string>('SMTP_PORT') || '587',
    );

    const smtpSecure =
      (this.configService.get<string>('SMTP_SECURE') || 'false').toLowerCase() ===
      'true';

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.ethereal.email',
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user:
          this.configService.get<string>('SMTP_USER') ||
          'demo@ethereal.email',
        pass: this.configService.get<string>('SMTP_PASS') || 'demo123',
>>>>>>> 921669f09616a421944b541bc2c30b49a8702eb5
      },
    });
  }

  private getSender(): string {
<<<<<<< HEAD
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
=======
    const sender =
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('SMTP_USER') ||
      'noreply@edusphere.com';

    return `"EduSphere" <${sender}>`;
  }

  async sendPasswordReset(to: string, token: string): Promise<boolean> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

    const mailOptions = {
      from: this.getSender(),
      to,
      subject: 'EduSphere — Password Reset Request',
      text: `You requested a password reset. Click the following link to reset your password: ${resetLink}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
          <h2>EduSphere</h2>
          <p>You requested a password reset.</p>
          <p>
            <a href="${resetLink}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">
              Reset Password
            </a>
          </p>
          <p>This link expires according to your password-reset policy.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Password reset email sent to ${to}. Message ID: ${info.messageId}`,
      );
      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown email error';
      this.logger.error(
        `Failed to send password reset email to ${to}: ${message}`,
      );
      throw new ServiceUnavailableException(
        'Email service is currently unavailable. Please try again later.',
      );
>>>>>>> 921669f09616a421944b541bc2c30b49a8702eb5
    }
  }

  async sendEmailVerification(to: string, otp: string): Promise<boolean> {
<<<<<<< HEAD
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

=======
    const mailOptions = {
      from: this.getSender(),
      to,
      subject: 'EduSphere — Verify Your Email',
      text: `Your EduSphere verification OTP is: ${otp}. This code expires in 15 minutes.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
          <h2>EduSphere</h2>
          <p>Use the following OTP to verify your email address:</p>
          <div style="font-size:30px;font-weight:700;letter-spacing:8px;margin:24px 0">
            ${otp}
          </div>
          <p>This code expires in 15 minutes.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `EduSphere verification email sent to ${to}. Message ID: ${info.messageId}`,
      );
      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown email error';
      this.logger.error(
        `Failed to send EduSphere verification email to ${to}: ${message}`,
      );
      throw new ServiceUnavailableException(
        'Unable to send verification email. Please try again later.',
      );
    }
  }

>>>>>>> 921669f09616a421944b541bc2c30b49a8702eb5
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
<<<<<<< HEAD
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const loginUrl = `${appUrl}/${details.schoolSlug}/login`;
    await this.sendMail(
      to,
      `Your ${details.schoolName} EduSphere account is ready`,
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h2>EduSphere — School Approved</h2><p>Hello ${details.adminName},</p><p>Your <strong>${details.schoolName}</strong> account has been approved.</p><p><strong>Plan:</strong> ${details.plan}</p><p><strong>Email:</strong> ${to}</p><p><strong>Temporary password:</strong> ${details.temporaryPassword}</p><p><a href="${loginUrl}">Open School Portal</a></p><p>Please change your password after signing in.</p></div>`,
      `Hello ${details.adminName},\n\nYour ${details.schoolName} account has been approved.\n\nLogin URL: ${loginUrl}\nEmail: ${to}\nTemporary password: ${details.temporaryPassword}\nPlan: ${details.plan}\n\nPlease change your password after signing in.`,
    );
    return true;
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
=======
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:5173';
    const loginUrl = `${appUrl}/${details.schoolSlug}/login`;

    const mailOptions = {
      from: this.getSender(),
      to,
      subject: `Your ${details.schoolName} EduSphere account is ready`,
      text: `Hello ${details.adminName},\n\nYour school account has been approved.\n\nLogin URL: ${loginUrl}\nEmail: ${to}\nTemporary password: ${details.temporaryPassword}\nPlan: ${details.plan}\n\nPlease change your password after signing in.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
          <h2>EduSphere — School Approved</h2>
          <p>Hello ${details.adminName},</p>
          <p>Your <strong>${details.schoolName}</strong> account has been approved.</p>
          <p><strong>Plan:</strong> ${details.plan}</p>
          <p><strong>Email:</strong> ${to}</p>
          <p><strong>Temporary password:</strong> ${details.temporaryPassword}</p>
          <p>
            <a href="${loginUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">
              Open School Portal
            </a>
          </p>
          <p>Please change your password after signing in.</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `School onboarding email sent to ${to}. Message ID: ${info.messageId}`,
      );
      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown email error';
      this.logger.error(
        `Failed to send school onboarding email to ${to}: ${message}`,
      );
      return false;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
      return true;
    } catch (error: unknown) {
      const message =
>>>>>>> 921669f09616a421944b541bc2c30b49a8702eb5
        error instanceof Error ? error.message : 'Unknown SMTP error';
      this.logger.error(`SMTP connection failed: ${message}`);
      return false;
    }
  }
}
