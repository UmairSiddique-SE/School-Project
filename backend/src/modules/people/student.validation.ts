import { BadRequestException } from '@nestjs/common';

const STUDENT_STATUSES = new Set(['ACTIVE', 'INACTIVE', 'LEFT', 'GRADUATED']);
const ADMISSION_TYPES = new Set(['NEW', 'TRANSFER']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CNIC_RE = /^\d{5}-\d{7}-\d$/;
const PHONE_RE = /^(?:\+92|0)\d{10}$/;
const SESSION_RE = /^\d{4}-\d{4}$/;

function optionalString(value: unknown, field: string, maxLength = 255) {
  if (value === undefined || value === null || value === '') return;
  if (typeof value !== 'string') throw new BadRequestException(`${field} must be text`);
  if (value.trim().length > maxLength) throw new BadRequestException(`${field} is too long`);
}

function optionalDate(value: unknown, field: string) {
  if (value === undefined || value === null || value === '') return;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new BadRequestException(`${field} must be a valid date`);
}

function optionalBoolean(value: unknown, field: string) {
  if (value === undefined || value === null || value === '') return;
  if (value !== true && value !== false && value !== 'true' && value !== 'false') {
    throw new BadRequestException(`${field} must be true or false`);
  }
}

export function validateStudentCreate(data: any) {
  if (!data || typeof data !== 'object') throw new BadRequestException('Student data is required');
  if (typeof data.name !== 'string' || data.name.trim().length < 2) {
    throw new BadRequestException('Student name is required and must contain at least 2 characters');
  }
  if (data.name.trim().length > 150) throw new BadRequestException('Student name is too long');

  optionalString(data.sectionId, 'Section ID', 100);
  optionalString(data.admissionNo, 'Admission No', 50);
  optionalString(data.rollNo, 'Roll No', 20);
  optionalString(data.phone ?? data.studentMobile, 'Phone', 30);
  optionalString(data.email, 'Email', 254);
  optionalString(data.bFormNumber, 'B-Form / ID', 20);
  optionalString(data.gender, 'Gender', 20);
  optionalString(data.bloodGroup, 'Blood Group', 10);
  optionalString(data.religion, 'Religion', 80);
  optionalString(data.session, 'Session', 20);
  optionalString(data.admissionType, 'Admission Type', 20);
  optionalDate(data.dateOfBirth, 'Date of Birth');
  optionalDate(data.admissionDate, 'Admission Date');
  optionalBoolean(data.transportRequired, 'Transport Required');
  optionalBoolean(data.hostelRequired, 'Hostel Required');

  if (data.email && !EMAIL_RE.test(String(data.email).trim())) throw new BadRequestException('Please provide a valid student email');
  const phone = data.phone ?? data.studentMobile;
  if (phone && !PHONE_RE.test(String(phone).replace(/[\s-]/g, ''))) throw new BadRequestException('Please provide a valid Pakistani phone number');
  if (data.bFormNumber && !CNIC_RE.test(String(data.bFormNumber))) throw new BadRequestException('B-Form / ID must use XXXXX-XXXXXXX-X format');
  if (data.session && !SESSION_RE.test(String(data.session))) throw new BadRequestException('Session must use YYYY-YYYY format');
  if (data.status && !STUDENT_STATUSES.has(String(data.status))) throw new BadRequestException('Invalid student status');
  if (data.admissionType && !ADMISSION_TYPES.has(String(data.admissionType))) throw new BadRequestException('Invalid admission type');
  if (data.admissionNo && !/^ADM-\d{4}-\d{4,}$/.test(String(data.admissionNo))) throw new BadRequestException('Admission No must use ADM-YYYY-NNNN format');
  if (data.rollNo && (!/^\d+$/.test(String(data.rollNo)) || Number(data.rollNo) < 1)) throw new BadRequestException('Roll No must be a positive number');
}

export function validateStudentUpdate(data: any) {
  if (!data || typeof data !== 'object') throw new BadRequestException('Student update data is required');
  for (const immutableField of ['id', 'schoolId', 'admissionNo', 'email']) {
    if (data[immutableField] !== undefined) throw new BadRequestException(`${immutableField} cannot be changed after admission`);
  }
  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim().length < 2 || data.name.trim().length > 150)) {
    throw new BadRequestException('Student name must contain 2-150 characters');
  }
  optionalString(data.sectionId, 'Section ID', 100);
  optionalString(data.rollNo, 'Roll No', 20);
  optionalString(data.phone, 'Phone', 30);
  optionalString(data.bFormNumber, 'B-Form / ID', 20);
  optionalString(data.gender, 'Gender', 20);
  optionalString(data.bloodGroup, 'Blood Group', 10);
  optionalString(data.religion, 'Religion', 80);
  optionalString(data.session, 'Session', 20);
  optionalString(data.admissionType, 'Admission Type', 20);
  optionalDate(data.dateOfBirth, 'Date of Birth');
  optionalBoolean(data.transportRequired, 'Transport Required');
  optionalBoolean(data.hostelRequired, 'Hostel Required');

  if (data.phone && !PHONE_RE.test(String(data.phone).replace(/[\s-]/g, ''))) throw new BadRequestException('Please provide a valid Pakistani phone number');
  if (data.bFormNumber && !CNIC_RE.test(String(data.bFormNumber))) throw new BadRequestException('B-Form / ID must use XXXXX-XXXXXXX-X format');
  if (data.session && !SESSION_RE.test(String(data.session))) throw new BadRequestException('Session must use YYYY-YYYY format');
  if (data.status && !STUDENT_STATUSES.has(String(data.status))) throw new BadRequestException('Invalid student status');
  if (data.admissionType && !ADMISSION_TYPES.has(String(data.admissionType))) throw new BadRequestException('Invalid admission type');
  if (data.rollNo && (!/^\d+$/.test(String(data.rollNo)) || Number(data.rollNo) < 1)) throw new BadRequestException('Roll No must be a positive number');
}

export function validateStudentId(id: string) {
  if (!id || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id)) throw new BadRequestException('Invalid student ID');
}
