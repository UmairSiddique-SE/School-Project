import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.ethereal.email',
      port: this.configService.get<number>('SMTP_PORT') || 587,
      secure: this.configService.get<boolean>('SMTP_SECURE') || false,
      auth: {
        user: this.configService.get<string>('SMTP_USER') || 'demo@ethereal.email',
        pass: this.configService.get<string>('SMTP_PASS') || 'demo123',
      },
    });
  }

  async sendPasswordReset(to: string, token: string) {
    const resetLink = `${this.configService.get('FRONTEND_URL') || 'http://localhost:5173'}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: '"EduSphere" <noreply@edusphere.com>',
      to,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the following link to reset your password: ${resetLink}`,
      html: `<p>You requested a password reset.</p><p>Click the following link to reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${to}. Message ID: ${info.messageId}`);
    } catch (error: any) {
      this.logger.error(`Failed to send password reset email to ${to}: ${error.message}`);
    }
  }

  async sendEmailVerification(to: string, otp: string) {
    const mailOptions = {
      from: '"EduSphere" <noreply@edusphere.com>',
      to,
      subject: 'Verify your Email Address',
      text: `Your OTP for email verification is: ${otp}`,
      html: `<p>Your OTP for email verification is: <strong>${otp}</strong></p>`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${to}. Message ID: ${info.messageId}`);
    } catch (error: any) {
      this.logger.error(`Failed to send verification email to ${to}: ${error.message}`);
    }
  }

  async sendSchoolOnboarding(to: string, details: { schoolName: string; schoolSlug: string; adminName: string; temporaryPassword: string; plan: string }) {
    const appUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const loginUrl = `${appUrl}/${details.schoolSlug}/login`;
    const mailOptions = {
      from: '"EduSphere" <noreply@edusphere.com>',
      to,
      subject: `Your ${details.schoolName} EduSphere account is ready`,
      text: `Hello ${details.adminName},\n\nYour school account has been approved.\n\nLogin URL: ${loginUrl}\nEmail: ${to}\nTemporary password: ${details.temporaryPassword}\nPlan: ${details.plan}\n\nPlease change your password after signing in.`,
      html: `<p>Hello ${details.adminName},</p><p>Your <strong>${details.schoolName}</strong> account has been approved.</p><p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a><br/><strong>Email:</strong> ${to}<br/><strong>Temporary password:</strong> ${details.temporaryPassword}<br/><strong>Plan:</strong> ${details.plan}</p><p>Please change your password after signing in.</p>`,
    };
    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`School onboarding email sent to ${to}. Message ID: ${info.messageId}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send school onboarding email to ${to}: ${error.message}`);
      return false;
    }
  }
}
