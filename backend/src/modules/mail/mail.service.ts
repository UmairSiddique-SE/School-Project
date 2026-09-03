import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const host = configService.get<string>('SMTP_HOST');
    const port = Number(configService.get<string>('SMTP_PORT') || 587);
    const user = configService.get<string>('SMTP_USER');
    const pass = configService.get<string>('SMTP_PASS');
    this.from = configService.get<string>('SMTP_FROM') || user || 'noreply@localhost';
    if (!host || !user || !pass) throw new Error('SMTP_HOST, SMTP_USER and SMTP_PASS are required');
    this.transporter = nodemailer.createTransport({ host, port, secure: configService.get<string>('SMTP_SECURE') === 'true', auth: { user, pass } });
  }

  async sendPasswordReset(to: string, token: string) {
    const resetLink = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173'}/reset-password?token=${encodeURIComponent(token)}`;
    await this.send({ from: this.from, to, subject: 'Password Reset Request', text: `You requested a password reset. Reset your password here: ${resetLink}`, html: `<p>You requested a password reset.</p><p><a href="${resetLink}">Reset your password</a></p>` });
  }

  async sendEmailVerification(to: string, otp: string) {
    await this.send({ from: this.from, to, subject: 'Verify your Email Address', text: `Your email verification code is ${otp}. It expires shortly.`, html: `<p>Your email verification code is <strong>${otp}</strong>.</p>` });
  }

  async sendSchoolOnboarding(to: string, details: { schoolName: string; schoolSlug: string; adminName: string; temporaryPassword: string; plan: string }) {
    const appUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const loginUrl = `${appUrl}/${details.schoolSlug}/login`;
    return this.send({ from: this.from, to, subject: `Your ${details.schoolName} EduSphere account is ready`, text: `Hello ${details.adminName},\n\nYour school account has been approved.\nLogin URL: ${loginUrl}\nEmail: ${to}\nTemporary password: ${details.temporaryPassword}\nPlan: ${details.plan}\n\nPlease change your password after signing in.`, html: `<p>Hello ${details.adminName},</p><p>Your <strong>${details.schoolName}</strong> account has been approved.</p><p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a><br/><strong>Email:</strong> ${to}<br/><strong>Temporary password:</strong> ${details.temporaryPassword}<br/><strong>Plan:</strong> ${details.plan}</p><p>Please change your password after signing in.</p>` });
  }

  private async send(options: nodemailer.SendMailOptions) {
    try { const info = await this.transporter.sendMail(options); this.logger.log(`Email sent to ${options.to}. Message ID: ${info.messageId}`); return true; }
    catch (error: any) { this.logger.error(`Email delivery failed: ${error?.message || 'unknown error'}`); return false; }
  }
}
