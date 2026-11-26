import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { MailService } from '../mail/mail.service';
import { PendingSchoolRegistrationService } from './pending-school-registration.service';

describe('PendingSchoolRegistrationService', () => {
  const prisma = {
    platformPlan: { findUnique: jest.fn() },
    school: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
  };
  const mailService = { sendEmailVerification: jest.fn() };
  let service: PendingSchoolRegistrationService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.platformPlan.findUnique.mockResolvedValue({ isActive: true });
    prisma.school.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.$executeRaw.mockResolvedValue(1);
    prisma.$queryRaw.mockResolvedValue([{
      id: 'registration-1',
      schoolSlug: 'green-valley',
      adminEmail: 'owner@example.com',
    }]);
    mailService.sendEmailVerification.mockResolvedValue(true);

    service = new PendingSchoolRegistrationService(
      prisma as unknown as PrismaService,
      mailService as unknown as MailService,
      {} as JwtService,
      {} as ConfigService,
    );
  });

  it('replaces an older pending session for the same email when registration is retried', async () => {
    const result = await service.register({
      schoolName: 'Green Valley School',
      schoolSlug: 'green-valley',
      schoolType: 'SCHOOL',
      logoUrl: 'data:image/jpeg;base64,abc',
      schoolAddress: 'Main Road',
      schoolPhone: '03001234567',
      country: 'Pakistan',
      city: 'Lahore',
      adminName: 'School Owner',
      adminEmail: 'OWNER@example.com',
      adminPhone: '03001234567',
      adminPassword: 'a-secure-password',
      requestedPlan: 'PROFESSIONAL',
    });

    const deleteStatement = prisma.$executeRaw.mock.calls[0][0].join('');
    expect(deleteStatement).toContain('"schoolSlug"');
    expect(deleteStatement).toContain('"adminEmail"');
    expect(result).toMatchObject({
      verificationRequired: true,
      verificationUserId: 'registration-1',
      email: 'owner@example.com',
    });
    expect(mailService.sendEmailVerification).toHaveBeenCalledWith(
      'owner@example.com',
      expect.stringMatching(/^\d{6}$/),
    );
  });
});
