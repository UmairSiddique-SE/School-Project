import { BadRequestException, Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('people/students')
export class StudentRecordController {
  constructor(private readonly prisma: PrismaService) {}

  @Patch(':id/avatar')
  @Roles('SCHOOL_ADMIN')
  async updateAvatar(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    if (!user?.schoolId) throw new BadRequestException('School association is missing');
    const avatarUrl = body?.avatarUrl ? String(body.avatarUrl) : null;
    if (avatarUrl && avatarUrl.length > 250000) throw new BadRequestException('Student photo is too large');
    const student = await this.prisma.student.findFirst({ where: { id, schoolId: user.schoolId, deletedAt: null } });
    if (!student) throw new BadRequestException('Student not found');
    return this.prisma.student.update({ where: { id }, data: { avatarUrl }, include: { section: { include: { class: true } } } });
  }

  @Patch(':id/full')
  @Roles('SCHOOL_ADMIN')
  async updateFull(@CurrentUser() user: any, @Param('id') id: string, @Body() data: any) {
    if (!user?.schoolId) throw new BadRequestException('School association is missing');
    const existing = await this.prisma.student.findFirst({ where: { id, schoolId: user.schoolId, deletedAt: null } });
    if (!existing) throw new BadRequestException('Student not found');

    if (data.sectionId) {
      const section = await this.prisma.section.findFirst({ where: { id: String(data.sectionId), class: { schoolId: user.schoolId } } });
      if (!section) throw new BadRequestException('Selected section does not belong to this school');
    }

    const student = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.student.update({
        where: { id },
        data: {
          name: data.name ?? undefined,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : data.dateOfBirth === null ? null : undefined,
          gender: data.gender ?? undefined,
          bloodGroup: data.bloodGroup ?? undefined,
          religion: data.religion ?? undefined,
          nationality: data.nationality ?? undefined,
          phone: data.studentMobile ?? data.phone ?? undefined,
          address: data.address ?? data.currentAddress ?? undefined,
          avatarUrl: data.avatarUrl ?? undefined,
          sectionId: data.sectionId ?? undefined,
          status: data.status ?? undefined,
          session: data.session ?? undefined,
          bFormNumber: data.bFormNumber ?? undefined,
          currentAddress: data.currentAddress ?? undefined,
          permanentAddress: data.permanentAddress ?? undefined,
          emergencyContact: data.emergencyContact ?? undefined,
          previousSchool: data.previousSchool ?? undefined,
          previousClass: data.previousClass ?? undefined,
          leavingCertificateUrl: data.leavingCertificateUrl ?? undefined,
          admissionType: data.admissionType ?? undefined,
          previousAcademicRecord: data.previousAcademicRecord ?? undefined,
          medicalNotes: data.medicalNotes ?? undefined,
          specialRequirements: data.specialRequirements ?? undefined,
          transportRequired: data.transportRequired !== undefined ? Boolean(data.transportRequired) : undefined,
          hostelRequired: data.hostelRequired !== undefined ? Boolean(data.hostelRequired) : undefined,
          remarks: data.remarks ?? undefined,
        },
        include: { section: { include: { class: true } } },
      });

      const link = await tx.studentParent.findFirst({ where: { studentId: id, isPrimary: true, parent: { schoolId: user.schoolId } }, select: { parentId: true } });
      if (link) {
        await tx.parent.update({
          where: { id: link.parentId },
          data: {
            fatherName: data.fatherName ?? undefined,
            fatherMobile1: data.fatherMobile1 ?? undefined,
            fatherMobile2: data.fatherMobile2 ?? undefined,
            fatherWhatsapp: data.fatherWhatsapp ?? undefined,
            fatherCnic: data.fatherCnic ?? undefined,
            fatherOccupation: data.fatherOccupation ?? undefined,
            motherName: data.motherName ?? undefined,
            motherMobile: data.motherMobile ?? undefined,
            motherCnic: data.motherCnic ?? undefined,
            motherOccupation: data.motherOccupation ?? undefined,
            guardianName: data.guardianName ?? undefined,
            guardianRelation: data.guardianRelation ?? undefined,
            guardianMobile: data.guardianMobile ?? undefined,
            addressCountry: data.country ?? undefined,
            addressProvince: data.province ?? undefined,
            addressCity: data.city ?? data.district ?? undefined,
            addressLine: data.currentAddress ?? data.address ?? undefined,
          },
        });
      }
      return updated;
    });

    return student;
  }
}
