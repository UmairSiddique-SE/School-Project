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

    // Never log credentials — only log non-sensitive config indicators
    this.logger.log(
      `SMTP configured: host=${smtpHost}, port=${smtpPort}, secure=${smtpSecure}, user_set=${!!smtpUser}, pass_set=${!!smtpPass}`,
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

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (char) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char
    ));
  }

  private getSender(): string {
    const configured =
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('SMTP_USER') ||
      'noreply@schoolos.app';
    // Accept both a plain address and Nodemailer "Display Name <address>" format.
    const address = configured.match(/<([^>]+)>/);
    return (address?.[1] || configured).trim();
  }

  private getSenderName(): string {
    return this.configService.get<string>('SMTP_FROM_NAME') || 'SchoolOS';
  }

  async sendMail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: { name: this.getSenderName(), address: this.getSender() },
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
        'SchoolOS — Verify Your Email',
        `
          <!doctype html>
          <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width,initial-scale=1">
              <meta name="color-scheme" content="light">
              <title>Verify your SchoolOS email</title>
            </head>
            <body style="margin:0;padding:0;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#172033">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f6fb;padding:32px 12px">
                <tr><td align="center">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #e6eaf0;border-radius:18px;overflow:hidden">
                    <tr><td style="padding:28px 32px;background:#142b52;text-align:left">
                      <div style="font-size:25px;line-height:32px;font-weight:700;letter-spacing:-.5px;color:#ffffff">School<span style="color:#72d6c2">OS</span></div>
                      <div style="margin-top:6px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#c5d2e5">School management platform</div>
                    </td></tr>
                    <tr><td style="padding:36px 32px 24px">
                      <div style="font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#168675">Email verification</div>
                      <h1 style="margin:12px 0 10px;font-size:25px;line-height:32px;color:#172033">Verify your email address</h1>
                      <p style="margin:0;font-size:15px;line-height:24px;color:#596579">Use the verification code below to continue setting up your school account.</p>
                      <div style="margin:28px 0 20px;padding:22px 12px;text-align:center;background:#f3f7fb;border:1px solid #e3eaf2;border-radius:14px">
                        <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#738197">Your verification code</div>
                        <div style="margin-top:10px;font-size:36px;line-height:44px;font-weight:700;letter-spacing:9px;color:#142b52">${this.escapeHtml(otp)}</div>
                      </div>
                      <p style="margin:0;font-size:14px;line-height:22px;color:#596579">This code expires in <strong style="color:#172033">30 minutes</strong>. For your security, do not share it with anyone.</p>
                      <p style="margin:24px 0 0;font-size:13px;line-height:21px;color:#8490a2">If you did not request this code, you can safely ignore this email.</p>
                    </td></tr>
                    <tr><td style="padding:20px 32px;border-top:1px solid #edf0f4;background:#fbfcfe">
                      <p style="margin:0;font-size:12px;line-height:19px;color:#8a94a5">© ${new Date().getFullYear()} SchoolOS. All rights reserved.</p>
                      <p style="margin:4px 0 0;font-size:12px;line-height:19px;color:#a0a9b7">This is an automated security message. Please do not reply.</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
          </html>
        `,
        `Your SchoolOS verification code is ${otp}. It expires in 30 minutes. Do not share this code with anyone.`,
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
      'Verify your SchoolOS email',
      `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
          <h2>Welcome to SchoolOS</h2>
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
    const safeSchoolName = this.escapeHtml(schoolName);
    const safeLoginUrl = this.escapeHtml(loginUrl);
    await this.sendMail(
      to,
      'Your SchoolOS school has been approved',
      `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
          <h2>School Approved</h2>

          <p>
            Your school
            <strong>${safeSchoolName}</strong>
            has been approved.
          </p>

          <p>
            <a href="${safeLoginUrl}">
              Open School Portal
            </a>
          </p>
        </div>
      `,
      `Your school ${schoolName} has been approved.\n\n${loginUrl}`,
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
        'SchoolOS — Password Reset',
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
        `Reset your SchoolOS password: ${resetUrl}`,
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
      'Reset your SchoolOS password',
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
      `Hello ${name}, reset your SchoolOS password: ${resetUrl}`,
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
    const safeSchoolName = this.escapeHtml(details.schoolName);
    const safeAdminName = this.escapeHtml(details.adminName);
    const safeLoginUrl = this.escapeHtml(loginUrl);

    try {
      await this.sendMail(
        to,
        `Your ${details.schoolName} SchoolOS account is ready`,
        `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
            <h2>School Approved</h2>

            <p>
              Hello ${safeAdminName},
            </p>

            <p>
              Your school
              <strong>${safeSchoolName}</strong>
              has been approved.
            </p>

            <p>
              <strong>Login:</strong>
              <a href="${safeLoginUrl}">
                ${safeLoginUrl}
              </a>
            </p>

            <p>
              <strong>Email:</strong>
              ${this.escapeHtml(to)}
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
