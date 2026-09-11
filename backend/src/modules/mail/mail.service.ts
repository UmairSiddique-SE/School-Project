import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    const smtpPort = Number(
      this.configService.get<string>('SMTP_PORT') || '587',
    );

    const smtpSecure =
      (
        this.configService.get<string>('SMTP_SECURE') || 'false'
      ).toLowerCase() === 'true';

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendMail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    const from =
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('SMTP_USER');

    if (!from) {
      throw new Error('SMTP_FROM or SMTP_USER is not configured');
    }

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        text: text || undefined,
        html,
      });

      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown mail error';

      this.logger.error(`Failed to send email to ${to}: ${message}`);

      throw error;
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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2>Welcome to EduSphere</h2>

          <p>Hello ${name},</p>

          <p>
            Please verify your email address by clicking the button below.
          </p>

          <p>
            <a
              href="${verificationUrl}"
              style="
                display:inline-block;
                padding:12px 20px;
                background:#2563eb;
                color:#ffffff;
                text-decoration:none;
                border-radius:6px;
              "
            >
              Verify Email
            </a>
          </p>

          <p>
            If you did not create this account, you can safely ignore this email.
          </p>

          <p>Regards,<br />EduSphere Team</p>
        </div>
      `,
      `Hello ${name},

Please verify your EduSphere email using this link:

${verificationUrl}

If you did not create this account, you can ignore this email.

EduSphere Team`,
    );
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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2>Password Reset</h2>

          <p>Hello ${name},</p>

          <p>
            We received a request to reset your EduSphere password.
          </p>

          <p>
            <a
              href="${resetUrl}"
              style="
                display:inline-block;
                padding:12px 20px;
                background:#2563eb;
                color:#ffffff;
                text-decoration:none;
                border-radius:6px;
              "
            >
              Reset Password
            </a>
          </p>

          <p>
            If you did not request a password reset, you can ignore this email.
          </p>

          <p>Regards,<br />EduSphere Team</p>
        </div>
      `,
      `Hello ${name},

Reset your EduSphere password using this link:

${resetUrl}

If you did not request this, you can ignore this email.

EduSphere Team`,
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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2>School Approved 🎉</h2>

          <p>Hello,</p>

          <p>
            Your school <strong>${schoolName}</strong> has been approved by
            the EduSphere administration.
          </p>

          <p>
            You can now access your school portal using the button below.
          </p>

          <p>
            <a
              href="${loginUrl}"
              style="
                display:inline-block;
                padding:12px 20px;
                background:#2563eb;
                color:#ffffff;
                text-decoration:none;
                border-radius:6px;
              "
            >
              Open School Portal
            </a>
          </p>

          <p>Regards,<br />EduSphere Team</p>
        </div>
      `,
      `Your school ${schoolName} has been approved.

You can access your school portal here:

${loginUrl}

EduSphere Team`,
    );
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();

      this.logger.log('SMTP connection verified successfully');

      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown SMTP error';

      this.logger.error(`SMTP connection failed: ${message}`);

      return false;
    }
  }
}