import { BadRequestException } from '@nestjs/common';
import { PeopleService } from './people.service';

const originalCreateStudent = PeopleService.prototype.createStudent;
PeopleService.prototype.createStudent = async function (schoolId: string, data: any) {
  const name = String(data?.name ?? '').trim();
  const sectionId = String(data?.sectionId ?? '').trim();
  const admissionType = String(data?.admissionType ?? 'NEW').toUpperCase();

  if (!name) throw new BadRequestException('Student name is required');
  if (!sectionId) throw new BadRequestException('Class / Section is required for admission');
  if (admissionType !== 'NEW' && admissionType !== 'TRANSFER') {
    throw new BadRequestException('Invalid admission type');
  }
  if (admissionType === 'TRANSFER') {
    if (!String(data?.previousSchool ?? '').trim()) {
      throw new BadRequestException('Previous School is required for transfer students');
    }
    if (!String(data?.previousClass ?? '').trim()) {
      throw new BadRequestException('Previous Class is required for transfer students');
    }
  }

  const normalized = {
    ...data,
    name,
    sectionId,
    admissionType,
    religion: data?.religion ? String(data.religion).trim() : undefined,
    bFormNumber: data?.bFormNumber ? String(data.bFormNumber).trim() : undefined,
    email: data?.email ? String(data.email).trim().toLowerCase() : undefined,
    phone: data?.phone ? String(data.phone).trim() : undefined,
    studentMobile: data?.studentMobile ? String(data.studentMobile).trim() : undefined,
    previousSchool: data?.previousSchool ? String(data.previousSchool).trim() : undefined,
    previousClass: data?.previousClass ? String(data.previousClass).trim() : undefined,
    leavingCertificateUrl: data?.leavingCertificateUrl ? String(data.leavingCertificateUrl).trim() : undefined,
    previousAcademicRecord: data?.previousAcademicRecord ? String(data.previousAcademicRecord).trim() : undefined,
    avatarUrl: data?.avatarUrl ? String(data.avatarUrl) : undefined,
  };

  return originalCreateStudent.call(this, schoolId, normalized);
};

const originalUpdateStudent = PeopleService.prototype.updateStudent;
PeopleService.prototype.updateStudent = async function (id: string, schoolId: string, data: any) {
  const admissionType = String(data?.admissionType ?? '').toUpperCase();
  if (admissionType && admissionType !== 'NEW' && admissionType !== 'TRANSFER') {
    throw new BadRequestException('Invalid admission type');
  }
  if (admissionType === 'TRANSFER') {
    if (!String(data?.previousSchool ?? '').trim()) {
      throw new BadRequestException('Previous School is required for transfer students');
    }
    if (!String(data?.previousClass ?? '').trim()) {
      throw new BadRequestException('Previous Class is required for transfer students');
    }
  }

  const normalized = {
    ...data,
    name: data?.name !== undefined ? String(data.name).trim() : undefined,
    sectionId: data?.sectionId !== undefined ? String(data.sectionId).trim() : undefined,
    admissionType: data?.admissionType !== undefined ? admissionType : undefined,
    religion: data?.religion !== undefined ? String(data.religion).trim() : undefined,
    bFormNumber: data?.bFormNumber !== undefined ? String(data.bFormNumber).trim() : undefined,
    phone: data?.phone !== undefined ? String(data.phone).trim() : undefined,
    previousSchool: data?.previousSchool !== undefined ? String(data.previousSchool).trim() : undefined,
    previousClass: data?.previousClass !== undefined ? String(data.previousClass).trim() : undefined,
    leavingCertificateUrl: data?.leavingCertificateUrl !== undefined ? String(data.leavingCertificateUrl).trim() : undefined,
    previousAcademicRecord: data?.previousAcademicRecord !== undefined ? String(data.previousAcademicRecord).trim() : undefined,
    avatarUrl: data?.avatarUrl !== undefined ? String(data.avatarUrl) : undefined,
  };

  return originalUpdateStudent.call(this, id, schoolId, normalized);
};
