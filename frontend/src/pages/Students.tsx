import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Camera, GraduationCap, Loader2, Pencil, Plus, Printer, RefreshCw, Search, Trash2,
  UserRound, Users, X, MapPin, User,
  Eye, EyeOff, Check, HeartPulse, FileText, Key, Clock, Sparkles, Layout, Smartphone,
  CheckCircle2, AlertTriangle, CheckSquare, ShieldCheck, Copy, Share2, Bus, Home, Building2, Calendar, Phone, Mail, Award, CheckCircle, ScrollText
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

type Student = any;
type Teacher = { id: string; name: string; email?: string };
type Section = { id: string; name: string; capacity?: number; teacher?: Teacher | null; className: string; classId: string };

type FormState = {
  rollNo: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  religion: string;
  nationality: string;
  bFormNumber: string;
  email: string;
  phone: string;
  emergencyContact: string;
  password: string;
  admissionType: 'NEW' | 'TRANSFER';
  admissionNo: string;
  admissionDate: string;
  sectionId: string;
  classId: string;
  session: string;
  previousSchool: string;
  previousClass: string;
  previousAcademicRecord: string;
  currentAddress: string;
  permanentAddress: string;
  city: string;
  province: string;
  transportRequired: boolean;
  transportStop: string;
  hostelRequired: boolean;
  medicalNotes: string;
  specialRequirements: string;
  remarks: string;
  avatarUrl: string;

  // Father Details
  fatherName: string;
  fatherMobile1: string;
  fatherMobile2: string;
  fatherWhatsapp: string;
  fatherCnic: string;
  fatherOccupation: string;
  fatherStatus: 'ALIVE' | 'DECEASED';

  // Guardian Details (Required if father is deceased)
  guardianName: string;
  guardianRelation: string;
  guardianMobile: string;
  guardianCnic: string;
  guardianOccupation: string;

  // Mother Details
  motherName: string;
  motherMobile: string;
  motherCnic: string;
  motherOccupation: string;
  motherStatus: 'ALIVE' | 'DECEASED';
};

const inputClass = 'w-full rounded-2xl border border-slate-200 dark:border-border/80 bg-white dark:bg-background/90 px-4 py-3 text-sm text-foreground outline-none shadow-sm transition placeholder:text-muted-foreground/60 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 font-medium';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-3.5 py-2 text-sm font-semibold transition hover:bg-accent';
const primaryBtnClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-600/20 hover:brightness-110 transition disabled:opacity-60';
const currentSession = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
const religions = ['Muslim', 'Christian', 'Hindu', 'Sikh', 'Buddhist', 'Other'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const guardianRelations = [
  { value: 'UNCLE', label: 'Uncle (Chacha / Mamoo)' },
  { value: 'GRANDPARENT', label: 'Grandfather / Grandmother (Dada / Nana)' },
  { value: 'SIBLING', label: 'Older Brother / Sister (Bhai / Baji)' },
  { value: 'AUNT', label: 'Aunt (Khala / Phopho)' },
  { value: 'MOTHER', label: 'Mother as Legal Guardian' },
  { value: 'OTHER', label: 'Other Relative / Legal Guardian' },
];

const fatherOccupations = [
  'Business / Businessman',
  'Government Officer / Employee',
  'Private Job / Corporate Sector',
  'Doctor / Healthcare Specialist',
  'Engineer / Technical Specialist',
  'Teacher / Lecturer / Professor',
  'Banker / Finance Professional',
  'Lawyer / Advocate / Legal Advisor',
  'Armed Forces / Police Officer',
  'Shopkeeper / Retailer / Trader',
  'Farmer / Landlord / Agriculture',
  'Overseas / Expatriate Worker',
  'Driver / Transport Operator',
  'Skilled Craftsman / Labor',
  'Retired',
  'Other',
];

const motherOccupations = [
  'Housewife',
  'Government Officer / Employee',
  'Private Job / Corporate Sector',
  'Teacher / Lecturer / Professor',
  'Doctor / Healthcare Specialist',
  'Business / Entrepreneur',
  'Lawyer / Legal Advisor',
  'Banker / Finance Professional',
  'IT Professional / Freelancer',
  'Self-Employed',
  'Other',
];

function generate8CharPassword() {
  const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';
  let pass = '';
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

function calculateAge(dobString: string): string {
  if (!dobString) return '';
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return '';
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < dob.getDate())) {
    years--;
    months += 12;
  }
  if (years < 0) return '';
  return `${years} Years, ${months} Months`;
}

const emptyForm = (): FormState => ({
  rollNo: '',
  name: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  religion: '',
  nationality: 'Pakistani',
  bFormNumber: '',
  email: '',
  phone: '',
  emergencyContact: '',
  password: generate8CharPassword(),
  admissionType: 'NEW',
  admissionNo: '',
  admissionDate: new Date().toISOString().slice(0, 10),
  classId: '',
  sectionId: '',
  session: currentSession,
  previousSchool: '',
  previousClass: '',
  previousAcademicRecord: '',
  currentAddress: '',
  permanentAddress: '',
  city: '',
  province: 'Punjab',
  transportRequired: false,
  transportStop: '',
  hostelRequired: false,
  medicalNotes: '',
  specialRequirements: '',
  remarks: '',
  avatarUrl: '',

  fatherName: '',
  fatherMobile1: '',
  fatherMobile2: '',
  fatherWhatsapp: '',
  fatherCnic: '',
  fatherOccupation: '',
  fatherStatus: 'ALIVE',

  guardianName: '',
  guardianRelation: 'UNCLE',
  guardianMobile: '',
  guardianCnic: '',
  guardianOccupation: '',

  motherName: '',
  motherMobile: '',
  motherCnic: '',
  motherOccupation: '',
  motherStatus: 'ALIVE',
});

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  return digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
}

function formatCnic(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

function phoneValid(value: string) { return !value || /^\d{4}-\d{7}$/.test(value); }
function cnicValid(value: string) { return !value || /^\d{5}-\d{7}-\d$/.test(value); }

async function compressPhoto(file: File) {
  if (!file.type.startsWith('image/')) throw new Error('Please select an image file');
  const source = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Unable to read image')); };
    image.src = url;
  });
  const maxSide = 320;
  const width = source.naturalWidth || source.width;
  const height = source.naturalHeight || source.height;
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to process image');
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}

export default function Students() {
  const { user } = useAuth();
  const canManage = user?.role === 'SCHOOL_ADMIN';

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Navigation views: 'list' | 'add'
  const [view, setView] = useState<'list' | 'add'>('list');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [editing, setEditing] = useState<Student | null>(null);
  const [profile, setProfile] = useState<Student | null>(null);
  const [profileTab, setProfileTab] = useState<'overview' | 'academics' | 'attendance' | 'fees' | 'reports' | 'timetable' | 'credentials'>('overview');
  
  // ID Card Viewer Modal State
  const [idCardStudent, setIdCardStudent] = useState<Student | null>(null);
  const [idCardOrientation, setIdCardOrientation] = useState<'portrait' | 'landscape'>('portrait');
  
  // Password Management Modal State
  const [passwordModalStudent, setPasswordModalStudent] = useState<Student | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Facilities availability from school records
  const [facilities, setFacilities] = useState<{ transport: boolean; hostel: boolean }>({ transport: false, hostel: false });

  // Document collection admission checklist
  const [checklist, setChecklist] = useState({
    bForm: false,
    fatherCnic: false,
    motherOrGuardianCnic: false,
    photos: false,
    leavingCertificate: false,
    academicRecord: false,
    admissionFormSigned: false,
  });

  // Success Banner after admission & Modal Dialog
  const [lastAdmitted, setLastAdmitted] = useState<{ student: Student; creds: { loginId: string; password: string; fullEmail?: string } } | null>(null);
  const [admittedModal, setAdmittedModal] = useState<{ student: Student; creds: { loginId: string; password: string; fullEmail?: string } } | null>(null);

  // Move / Transfer state
  const [moveMode, setMoveMode] = useState<'promote' | 'transfer' | null>(null);
  const [targetSection, setTargetSection] = useState('');

  const [form, setForm] = useState<FormState>(emptyForm());

  const calculateNextRollNo = (targetSectionId: string, currentStudents: Student[]) => {
    if (!targetSectionId) return '1';
    const inSection = currentStudents.filter((s) => s.sectionId === targetSectionId && !s.deletedAt);
    let maxRoll = 0;
    for (const s of inSection) {
      const num = parseInt(String(s.rollNo || '').replace(/\D/g, ''), 10);
      if (!isNaN(num) && num > maxRoll) maxRoll = num;
    }
    return String(maxRoll + 1);
  };

  const validateStep = (stepNumber: number): { valid: boolean; error?: string } => {
    if (stepNumber === 1) {
      if (!form.name.trim()) return { valid: false, error: 'Student full name is required' };
      if (form.name.trim().length < 2) return { valid: false, error: 'Student name must have at least 2 characters' };
      if (!form.gender) return { valid: false, error: 'Student gender is required' };
      if (form.bFormNumber && (!cnicValid(form.bFormNumber) || form.bFormNumber.replace(/\D/g, '').length !== 13)) {
        return { valid: false, error: 'B-Form / CNIC must contain exactly 13 digits (35201-xxxxxxx-x)' };
      }
      if (form.phone && (!phoneValid(form.phone) || form.phone.replace(/\D/g, '').length !== 11)) {
        return { valid: false, error: 'Student mobile must contain 11 digits (0300-1234567)' };
      }
      if (form.emergencyContact && (!phoneValid(form.emergencyContact) || form.emergencyContact.replace(/\D/g, '').length !== 11)) {
        return { valid: false, error: 'Emergency contact must contain 11 digits (0300-1234567)' };
      }
      return { valid: true };
    }
    if (stepNumber === 2) {
      if (!form.classId) return { valid: false, error: 'Please select a Class Level' };
      if (!form.sectionId) return { valid: false, error: 'Please assign a classroom Section' };
      if (form.admissionType === 'TRANSFER') {
        if (!form.previousSchool.trim()) return { valid: false, error: 'Previous school name is required for transfer students' };
        if (!form.previousClass.trim()) return { valid: false, error: 'Previous class passed is required for transfer students' };
      }
      if (form.session && !/^\d{4}-\d{4}$/.test(form.session)) {
        return { valid: false, error: 'Session must use YYYY-YYYY format (e.g. 2026-2027)' };
      }
      return { valid: true };
    }
    if (stepNumber === 3) {
      if (form.fatherStatus === 'DECEASED') {
        if (!form.guardianName.trim()) return { valid: false, error: 'Father is deceased. Guardian full name is required' };
        if (!form.guardianMobile.trim() || !phoneValid(form.guardianMobile) || form.guardianMobile.replace(/\D/g, '').length !== 11) {
          return { valid: false, error: 'Father is deceased. Valid 11-digit Guardian mobile is required (0300-1234567)' };
        }
        if (form.guardianCnic && (!cnicValid(form.guardianCnic) || form.guardianCnic.replace(/\D/g, '').length !== 13)) {
          return { valid: false, error: 'Guardian CNIC must contain 13 digits (35201-xxxxxxx-x)' };
        }
      } else {
        if (!form.fatherName.trim()) return { valid: false, error: 'Father full name is required' };
        if (form.fatherMobile1 && (!phoneValid(form.fatherMobile1) || form.fatherMobile1.replace(/\D/g, '').length !== 11)) {
          return { valid: false, error: 'Father primary mobile must contain 11 digits (0300-1234567)' };
        }
        if (form.fatherCnic && (!cnicValid(form.fatherCnic) || form.fatherCnic.replace(/\D/g, '').length !== 13)) {
          return { valid: false, error: 'Father CNIC must contain 13 digits (35201-xxxxxxx-x)' };
        }
      }
      if (form.motherMobile && (!phoneValid(form.motherMobile) || form.motherMobile.replace(/\D/g, '').length !== 11)) {
        return { valid: false, error: 'Mother mobile must contain 11 digits (0300-1234567)' };
      }
      if (form.motherCnic && (!cnicValid(form.motherCnic) || form.motherCnic.replace(/\D/g, '').length !== 13)) {
        return { valid: false, error: 'Mother CNIC must contain 13 digits (35201-xxxxxxx-x)' };
      }
      return { valid: true };
    }
    if (stepNumber === 4) {
      if (!form.currentAddress.trim()) {
        return { valid: false, error: 'Current residential address is required' };
      }
      return { valid: true };
    }
    if (stepNumber === 5) {
      if (!editing && (!form.password || form.password.trim().length < 6)) {
        return { valid: false, error: 'Password must be at least 6 characters (8 characters recommended)' };
      }
      return { valid: true };
    }
    return { valid: true };
  };

  const load = async () => {
    setLoading(true);
    try {
      const [studentRes, classRes, sectionRes, facilitiesRes] = await Promise.all([
        apiClient.get('/people/students'),
        apiClient.get('/classes').catch(() => ({ data: [] })),
        apiClient.get('/classes/sections').catch(() => ({ data: [] })),
        apiClient.get('/people/student-facilities').catch(() => ({ data: { transport: false, hostel: false } })),
      ]);
      setStudents(Array.isArray(studentRes.data) ? studentRes.data : []);
      setClasses(Array.isArray(classRes.data) ? classRes.data : []);
      setSections(Array.isArray(sectionRes.data) ? sectionRes.data : []);
      setFacilities({
        transport: Boolean(facilitiesRes.data?.transport),
        hostel: Boolean(facilitiesRes.data?.hostel),
      });
      setSelectedIds([]);
    } catch (error: any) {
      setStudents([]);
      setClasses([]);
      setSections([]);
      toast.error(error?.response?.data?.message || 'Unable to load student database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const availableFilterSections = useMemo(() => {
    if (!classFilter) return sections;
    return sections.filter((s) => s.classId === classFilter);
  }, [sections, classFilter]);

  const availableFormSections = useMemo(() => {
    if (!form.classId) return sections;
    return sections.filter((s) => s.classId === form.classId);
  }, [sections, form.classId]);

  const filtered = useMemo(() => {
    let result = students;
    if (classFilter) {
      result = result.filter((s) => s.section?.classId === classFilter || s.section?.class?.id === classFilter);
    }
    if (sectionFilter) {
      result = result.filter((s) => s.sectionId === sectionFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((student) =>
        [
          student.name,
          student.admissionNo,
          student.rollNo,
          student.section?.name,
          student.section?.class?.name,
          student.phone,
          student.emergencyContact,
          student.bFormNumber,
          student.email,
        ].some((value) => String(value ?? '').toLowerCase().includes(q))
      );
    }
    return result;
  }, [students, search, classFilter, sectionFilter]);

  const boysCount = useMemo(() => students.filter((s) => s.gender === 'MALE').length, [students]);
  const girlsCount = useMemo(() => students.filter((s) => s.gender === 'FEMALE').length, [students]);
  const sectionCount = useMemo(() => new Set(students.map((s) => s.sectionId).filter(Boolean)).size, [students]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openCreate = () => {
    setEditing(null);
    setCurrentStep(1);
    setChecklist({ bForm: false, fatherCnic: false, motherOrGuardianCnic: false, photos: false, leavingCertificate: false, academicRecord: false, admissionFormSigned: false });
    const initialPass = generate8CharPassword();
    const initialForm = emptyForm();
    initialForm.password = initialPass;

    if (classes.length > 0) {
      const firstClass = classes[0];
      const classSecs = sections.filter((s) => s.classId === firstClass.id);
      if (classSecs.length > 0) {
        initialForm.classId = firstClass.id;
        initialForm.sectionId = classSecs[0].id;
        initialForm.rollNo = calculateNextRollNo(classSecs[0].id, students);
      }
    }

    setForm(initialForm);
    setView('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (student: Student) => {
    setEditing(student);
    setCurrentStep(1);
    setChecklist({ bForm: false, fatherCnic: false, motherOrGuardianCnic: false, photos: false, leavingCertificate: false, academicRecord: false, admissionFormSigned: false });
    const matchedSection = sections.find((s) => s.id === student.sectionId);
    const primaryParent = student.parents?.[0]?.parent;

    setForm({
      ...emptyForm(),
      name: student.name || '',
      rollNo: student.rollNo || '',
      gender: student.gender || '',
      bloodGroup: student.bloodGroup || '',
      religion: student.religion || '',
      nationality: student.nationality || 'Pakistani',
      classId: matchedSection?.classId || student.section?.classId || '',
      sectionId: student.sectionId || '',
      currentAddress: student.currentAddress || student.address || '',
      permanentAddress: student.permanentAddress || '',
      city: primaryParent?.addressCity || '',
      province: primaryParent?.addressProvince || 'Punjab',
      phone: formatPhone(student.phone || ''),
      emergencyContact: formatPhone(student.emergencyContact || ''),
      bFormNumber: formatCnic(student.bFormNumber || ''),
      avatarUrl: student.avatarUrl || '',
      email: student.email || '',
      password: '',
      session: student.session || currentSession,
      admissionType: student.admissionType === 'TRANSFER' ? 'TRANSFER' : 'NEW',
      admissionNo: student.admissionNo || '',
      admissionDate: student.admissionDate ? String(student.admissionDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
      previousSchool: student.previousSchool || '',
      previousClass: student.previousClass || '',
      previousAcademicRecord: student.previousAcademicRecord || '',
      medicalNotes: student.medicalNotes || '',
      specialRequirements: student.specialRequirements || '',
      remarks: student.remarks || '',
      transportRequired: Boolean(student.transportRequired),
      transportStop: '',
      hostelRequired: Boolean(student.hostelRequired),
      dateOfBirth: student.dateOfBirth ? String(student.dateOfBirth).slice(0, 10) : '',

      fatherName: primaryParent?.fatherName || '',
      fatherMobile1: formatPhone(primaryParent?.fatherMobile1 || ''),
      fatherMobile2: formatPhone(primaryParent?.fatherMobile2 || ''),
      fatherWhatsapp: formatPhone(primaryParent?.fatherWhatsapp || ''),
      fatherCnic: formatCnic(primaryParent?.fatherCnic || ''),
      fatherOccupation: primaryParent?.fatherOccupation || '',
      fatherStatus: (primaryParent?.fatherStatus as any) || 'ALIVE',

      guardianName: primaryParent?.guardianName || '',
      guardianRelation: primaryParent?.guardianRelation || 'UNCLE',
      guardianMobile: formatPhone(primaryParent?.guardianMobile || ''),
      guardianCnic: formatCnic(primaryParent?.guardianCnic || ''),
      guardianOccupation: primaryParent?.guardianOccupation || '',

      motherName: primaryParent?.motherName || '',
      motherMobile: formatPhone(primaryParent?.motherMobile || ''),
      motherCnic: formatCnic(primaryParent?.motherCnic || ''),
      motherOccupation: primaryParent?.motherOccupation || '',
      motherStatus: (primaryParent?.motherStatus as any) || 'ALIVE',
    });
    setView('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePhoto = async (file?: File) => {
    if (!file) return;
    setCompressing(true);
    try {
      update('avatarUrl', await compressPhoto(file));
      toast.success('Student photo attached');
    } catch (error: any) {
      toast.error(error?.message || 'Unable to process photo');
    } finally {
      setCompressing(false);
    }
  };

  const copyWhatsAppCredentials = (student: any, creds: any) => {
    const text = `*🎒 ${user?.schoolName || 'SchoolOS Academy'} — Student Admission & Portal Credentials*
----------------------------------------
*Student Name:* ${student.name}
*Admission No:* ${student.admissionNo || 'N/A'}
*Class & Section:* ${student.section?.className || ''} ${student.section?.name ? `(Section ${student.section.name})` : ''}
*Roll No:* ${student.rollNo || 'N/A'}
----------------------------------------
*🔑 Student Portal Online Login Details:*
• *Login ID:* ${creds.loginId}
• *Portal Email:* ${creds.fullEmail || student.email || 'N/A'}
• *Password:* ${creds.password}
• *Portal URL:* ${window.location.origin}/${user?.schoolSlug || ''}/login
----------------------------------------
_Please keep these credentials safe for viewing attendance, exam report cards, homework, and fee receipts._`;

    navigator.clipboard.writeText(text);
    toast.success('Credentials copied to clipboard (WhatsApp/SMS ready)!');
  };

  const printAdmissionSlip = (student: any, creds?: any) => {
    const popup = window.open('', '_blank', 'width=800,height=950');
    if (!popup) return toast.error('Pop-up blocked. Please allow pop-ups to print admission slip.');

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Official Admission Slip - ${student.name}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 20px; line-height: 1.5; font-size: 13px; }
    .header { text-align: center; border-bottom: 2px solid #0891b2; padding-bottom: 12px; margin-bottom: 20px; position: relative; }
    .school-name { font-size: 24px; font-weight: 800; color: #0e7490; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
    .slip-title { font-size: 14px; font-weight: 700; color: #475569; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 2px; }
    .grid { display: grid; grid-template-columns: 1fr 140px; gap: 20px; margin-bottom: 20px; }
    .photo-box { width: 130px; height: 150px; border: 2px dashed #94a3b8; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f8fafc; }
    .photo-box img { width: 100%; height: 100%; object-fit: cover; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 12px; text-align: left; }
    th { background: #f1f5f9; font-weight: 700; color: #334155; width: 35%; }
    .section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; color: #0891b2; margin: 16px 0 8px; border-left: 4px solid #0891b2; padding-left: 8px; }
    .creds-box { background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 12px 16px; margin: 16px 0; }
    .creds-title { font-weight: 800; color: #166534; font-size: 12px; text-transform: uppercase; margin-bottom: 6px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 50px; text-align: center; }
    .sig-line { border-top: 1.5px solid #64748b; padding-top: 6px; font-size: 11px; font-weight: 700; color: #475569; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="school-name">${user?.schoolName || 'SchoolOS International Academy'}</h1>
    <p class="slip-title">Official Student Admission Slip & Record</p>
    <p style="font-size: 11px; color: #64748b; margin: 2px 0 0;">Session: ${student.session || currentSession} | Date: ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="grid">
    <table>
      <tr><th>Student Full Name</th><td><strong>${student.name}</strong></td></tr>
      <tr><th>Admission Number</th><td><strong style="color: #0e7490; font-family: monospace;">${student.admissionNo || 'N/A'}</strong></td></tr>
      <tr><th>Class & Section</th><td>${student.section?.className || 'Class'} — Section ${student.section?.name || 'A'}</td></tr>
      <tr><th>Roll Number</th><td><strong>${student.rollNo || 'N/A'}</strong></td></tr>
      <tr><th>Date of Birth / Gender</th><td>${student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'} (${student.gender || 'Not provided'})</td></tr>
      <tr><th>B-Form / CNIC</th><td>${student.bFormNumber || 'N/A'}</td></tr>
    </table>
    <div class="photo-box">
      ${student.avatarUrl ? `<img src="${student.avatarUrl}" alt="Photo" />` : '<span style="color:#94a3b8; font-size:10px; font-weight:700;">STUDENT PHOTO</span>'}
    </div>
  </div>

  <div class="section-title">Parent & Guardian Details</div>
  <table>
    <tr><th>Father / Guardian Name</th><td>${student.parents?.[0]?.parent?.fatherName || student.parents?.[0]?.parent?.guardianName || student.fatherName || 'N/A'}</td></tr>
    <tr><th>Primary Mobile Number</th><td>${student.parents?.[0]?.parent?.fatherMobile1 || student.parents?.[0]?.parent?.guardianMobile || student.phone || 'N/A'}</td></tr>
    <tr><th>Residential Address</th><td>${student.currentAddress || student.address || 'N/A'}</td></tr>
    <tr><th>Emergency Contact</th><td>${student.emergencyContact || 'N/A'}</td></tr>
  </table>

  ${creds ? `
  <div class="creds-box">
    <div class="creds-title">🔑 Student Portal Online Login Credentials</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 12px;">
      <div><strong>Login ID:</strong> <span style="font-family: monospace;">${creds.loginId}</span></div>
      <div><strong>Portal Email:</strong> <span style="font-family: monospace;">${creds.fullEmail || student.email || 'N/A'}</span></div>
      <div><strong>Password:</strong> <span style="font-family: monospace; font-weight: bold; color: #15803d;">${creds.password}</span></div>
    </div>
  </div>
  ` : ''}

  <div style="font-size: 11px; color: #64748b; margin-top: 16px; border-left: 2px solid #94a3b8; padding-left: 8px;">
    <strong>Declaration:</strong> Certified that all information provided above is correct according to the official school admission register. Student has been enrolled under the rules and regulations of the institution.
  </div>

  <div class="signatures">
    <div class="sig-line">Parent / Guardian Signature</div>
    <div class="sig-line">Admission Officer</div>
    <div class="sig-line">Principal / Headmaster Stamp</div>
  </div>

  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

    popup.document.write(html);
    popup.document.close();
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.name.trim()) return toast.error('Student full name is required');
    if (!form.classId) return toast.error('Please select a class level');
    if (!form.sectionId) return toast.error('Please assign a classroom section');
    if (form.fatherStatus === 'ALIVE') {
      if (!form.fatherName.trim()) return toast.error('Father full name is required');
      if (!form.fatherMobile1.trim()) return toast.error('Father primary mobile number is required');
    } else {
      if (!form.guardianName.trim()) return toast.error('Guardian full name is mandatory (father marked as deceased)');
      if (!form.guardianMobile.trim()) return toast.error('Guardian mobile number is mandatory');
    }
    if (!form.currentAddress.trim()) return toast.error('Current residential address is required');
    if (!editing && (!form.password || form.password.trim().length < 6)) {
      return toast.error('Password must be at least 6 characters');
    }

    setSaving(true);
    try {
      const cleanAdmNo = (form.admissionNo || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const firstName = form.name.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student';
      const rollDigits = form.rollNo?.replace(/\D/g, '') || '1';
      const candidateLoginId = `${firstName}${rollDigits}`;
      const computedEmail = form.email.trim().toLowerCase() || (cleanAdmNo ? `${cleanAdmNo}@school.edu.pk` : `${candidateLoginId}@school.edu.pk`);

      const docsReceived = [
        checklist.bForm ? 'NADRA B-Form' : null,
        checklist.fatherCnic ? 'Father CNIC' : null,
        checklist.motherOrGuardianCnic ? 'Mother/Guardian CNIC' : null,
        checklist.photos ? 'Passport Photos' : null,
        checklist.leavingCertificate ? 'SLC' : null,
        checklist.academicRecord ? 'Marksheet' : null,
        checklist.admissionFormSigned ? 'Signed Form' : null,
      ].filter(Boolean).join(', ');

      const finalRemarks = [
        form.transportStop ? `Pickup Stop: ${form.transportStop}` : null,
        docsReceived ? `Docs Received: [${docsReceived}]` : null,
      ].filter(Boolean).join(' | ');

      const payload: any = {
        name: form.name.trim(),
        rollNo: form.rollNo.trim() || undefined,
        sectionId: form.sectionId,
        admissionNo: form.admissionNo.trim() || undefined,
        gender: form.gender,
        bloodGroup: form.bloodGroup || undefined,
        religion: form.religion || undefined,
        nationality: form.nationality || 'Pakistani',
        dateOfBirth: form.dateOfBirth || undefined,
        phone: form.phone || undefined,
        studentMobile: form.phone || undefined,
        emergencyContact: form.emergencyContact || undefined,
        email: computedEmail,
        bFormNumber: form.bFormNumber || undefined,
        currentAddress: form.currentAddress.trim() || undefined,
        permanentAddress: form.permanentAddress.trim() || undefined,
        avatarUrl: form.avatarUrl || undefined,
        session: form.session || currentSession,
        admissionType: form.admissionType,
        previousSchool: form.previousSchool.trim() || undefined,
        previousClass: form.previousClass.trim() || undefined,
        previousAcademicRecord: form.previousAcademicRecord.trim() || undefined,
        transportRequired: form.transportRequired,
        hostelRequired: form.hostelRequired,
        remarks: [form.remarks.trim(), finalRemarks].filter(Boolean).join(' | ') || undefined,

        // Father Information
        fatherName: form.fatherName.trim() || undefined,
        fatherMobile1: form.fatherMobile1 || undefined,
        fatherMobile2: form.fatherMobile2 || undefined,
        fatherCnic: form.fatherCnic || undefined,
        fatherOccupation: form.fatherOccupation.trim() || undefined,
        fatherStatus: form.fatherStatus,

        // Guardian Information
        guardianName: form.guardianName.trim() || undefined,
        guardianRelation: form.guardianRelation || undefined,
        guardianMobile: form.guardianMobile || undefined,
        guardianCnic: form.guardianCnic || undefined,
        guardianOccupation: form.guardianOccupation.trim() || undefined,

        // Mother Information
        motherName: form.motherName.trim() || undefined,
        motherMobile: form.motherMobile || undefined,
        motherCnic: form.motherCnic || undefined,
        motherOccupation: form.motherOccupation.trim() || undefined,
      };

      if (!editing) {
        payload.password = form.password.trim();
        const response = await apiClient.post('/people/students', payload);
        const createdCredentials = response.data?.credentials;
        const createdStudent = response.data?.student;
        if (createdCredentials && createdStudent) {
          setLastAdmitted({ student: createdStudent, creds: createdCredentials });
          setAdmittedModal({ student: createdStudent, creds: createdCredentials });
        }
        toast.success(`🎉 Student ${createdStudent?.name || ''} admitted successfully!`);
        setView('list');
      } else {
        if (form.password && form.password.trim().length >= 6) {
          payload.password = form.password.trim();
        }
        await apiClient.patch(`/people/students/${editing.id}`, payload);
        toast.success('Student profile updated successfully!');
        setView('list');
      }
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to save student');
    } finally {
      setSaving(false);
    }
  };

  const archive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this student record?')) return;
    try {
      await apiClient.delete(`/people/students/${id}`);
      toast.success('Student record archived');
      if (profile?.id === id) setProfile(null);
      if (idCardStudent?.id === id) setIdCardStudent(null);
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to archive student');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalStudent || !newPassword || newPassword.trim().length < 6) {
      return toast.error('Please provide a valid password of at least 6 characters');
    }
    setUpdatingPassword(true);
    try {
      await apiClient.post(`/people/students/${passwordModalStudent.id}/change-password`, {
        password: newPassword.trim(),
      });
      toast.success(`Password updated for ${passwordModalStudent.name}`);
      setPasswordModalStudent(null);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update student password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const printIdCardWindow = (student: Student, orientation: 'portrait' | 'landscape') => {
    const popup = window.open('', '_blank', orientation === 'portrait' ? 'width=540,height=820' : 'width=840,height=560');
    if (!popup) return toast.error('Please allow popups to print the ID card');
    const photo = student.avatarUrl || '';
    const admNo = student.admissionNo || 'Not recorded';
    const barcodeData = admNo.replace(/[^A-Z0-9-]/gi, '').padEnd(16, '0').slice(0, 16);
    const bars = barcodeData.split('').map((ch: string) => {
      const code = ch.charCodeAt(0);
      return [(code & 1) ? 3 : 1, (code & 2) ? 3 : 1, (code & 4) ? 3 : 1, (code & 8) ? 2 : 1];
    }).flat();
    let barSvg = `<svg width="${orientation === 'portrait' ? '240' : '220'}" height="44" xmlns="http://www.w3.org/2000/svg">`;
    let x = 4;
    bars.forEach((w: number, i: number) => {
      barSvg += `<rect x="${x}" y="2" width="${w}" height="32" fill="${i % 2 === 0 ? '#0f172a' : 'transparent'}" />`;
      x += w + 1;
    });
    barSvg += `<text x="${orientation === 'portrait' ? '120' : '110'}" y="42" text-anchor="middle" font-size="9" fill="#64748b" font-family="monospace">${admNo}</text></svg>`;

    const isPortrait = orientation === 'portrait';

    const html = `<!doctype html>
<html>
<head>
  <title>${student.name} — Student ID Card (${orientation.toUpperCase()})</title>
  <style>
    @page {
      size: ${orientation};
      margin: 0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: #f1f5f9;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card-wrap {
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
      box-shadow: 0 20px 40px rgba(0,0,0,0.12);
      ${isPortrait ? 'width: 360px; min-height: 540px;' : 'width: 580px; min-height: 350px;'}
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .card-header {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #1e3a8a 100%);
      color: #ffffff;
      padding: ${isPortrait ? '20px 20px 14px' : '16px 24px'};
      text-align: center;
      position: relative;
    }
    .school-title {
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.85);
    }
    .card-sub {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 2px;
    }
    ${isPortrait ? `
    .photo-area {
      margin: 14px auto 8px;
      width: 90px;
      height: 90px;
      border-radius: 18px;
      overflow: hidden;
      border: 3px solid #ffffff;
      background: #0f172a;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      font-weight: 900;
      color: #ffffff;
    }
    .photo-area img { width: 100%; height: 100%; object-fit: cover; }
    .student-name {
      font-size: 19px;
      font-weight: 900;
      color: #0f172a;
      text-align: center;
      margin-top: 10px;
    }
    .card-body {
      padding: 12px 22px 16px;
      flex: 1;
    }
    .data-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px dashed #e2e8f0;
      font-size: 12px;
    }
    ` : `
    .land-content {
      display: flex;
      padding: 20px 24px;
      gap: 20px;
      flex: 1;
      align-items: center;
    }
    .land-left {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 140px;
      shrink: 0;
    }
    .photo-area {
      width: 110px;
      height: 110px;
      border-radius: 20px;
      overflow: hidden;
      border: 3px solid #0284c7;
      background: #0f172a;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 42px;
      font-weight: 900;
      color: #ffffff;
    }
    .photo-area img { width: 100%; height: 100%; object-fit: cover; }
    .student-name {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      margin-bottom: 10px;
    }
    .card-body {
      flex: 1;
    }
    .data-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 0;
      border-bottom: 1px dashed #e2e8f0;
      font-size: 11.5px;
    }
    `}
    .label {
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.05em;
    }
    .val {
      font-weight: 800;
      color: #0f172a;
    }
    .val-cyan {
      font-weight: 900;
      color: #0284c7;
      font-family: monospace;
      font-size: 12.5px;
    }
    .footer-barcode {
      padding: 10px 20px 14px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .stamp {
      display: inline-block;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
      padding: 2px 8px;
      border-radius: 999px;
      margin-top: 4px;
    }
    @media print {
      body {
        background: transparent;
        padding: 0;
      }
      .card-wrap {
        box-shadow: none;
        border: 1px solid #94a3b8;
      }
      .card-header {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="card-wrap">
    <div class="card-header">
      <div class="school-title">SchoolOS Campus System</div>
      <div class="card-sub">Student Identity Card</div>
    </div>

    ${isPortrait ? `
      <div class="photo-area">
        ${photo ? `<img src="${photo}" />` : student.name.charAt(0)}
      </div>
      <div class="student-name">${student.name}</div>
      <div class="card-body">
        <div class="data-row">
          <span class="label">Admission No</span>
          <span class="val-cyan">${admNo}</span>
        </div>
        <div class="data-row">
          <span class="label">Roll Number</span>
          <span class="val">${student.rollNo || '—'}</span>
        </div>
        <div class="data-row">
          <span class="label">Class & Sec</span>
          <span class="val">${student.section?.class?.name || 'Class'} — ${student.section?.name || '—'}</span>
        </div>
        <div class="data-row">
          <span class="label">Session</span>
          <span class="val">${student.session || currentSession}</span>
        </div>
        <div class="data-row">
          <span class="label">Gender / Blood</span>
          <span class="val">${student.gender || 'Not provided'} / ${student.bloodGroup || 'Not provided'}</span>
        </div>
        <div class="data-row" style="border-bottom:none">
          <span class="label">Emergency Mobile</span>
          <span class="val" style="font-family:monospace">${student.emergencyContact || student.phone || '—'}</span>
        </div>
      </div>
      <div class="footer-barcode">
        ${barSvg}
        <span class="stamp">STUDENT ID</span>
      </div>
    ` : `
      <div class="land-content">
        <div class="land-left">
          <div class="photo-area">
            ${photo ? `<img src="${photo}" />` : student.name.charAt(0)}
          </div>
          <span class="stamp" style="margin-top:8px">STUDENT ID</span>
        </div>
        <div class="card-body">
          <div class="student-name">${student.name}</div>
          <div class="data-row">
            <span class="label">Admission No</span>
            <span class="val-cyan">${admNo}</span>
          </div>
          <div class="data-row">
            <span class="label">Roll Number</span>
            <span class="val">${student.rollNo || '—'}</span>
          </div>
          <div class="data-row">
            <span class="label">Class / Section</span>
            <span class="val">${student.section?.class?.name || 'Class'} (${student.section?.name || '—'})</span>
          </div>
          <div class="data-row">
            <span class="label">Session</span>
            <span class="val">${student.session || currentSession}</span>
          </div>
          <div class="data-row">
            <span class="label">Emergency</span>
            <span class="val" style="font-family:monospace">${student.emergencyContact || student.phone || '—'}</span>
          </div>
          <div style="margin-top:8px; display:flex; justify-content:center">
            ${barSvg}
          </div>
        </div>
      </div>
    `}
  </div>
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;

    popup.document.write(html);
    popup.document.close();
  };

  const printLeavingCertificate = (student: Student) => {
    const popup = window.open('', '_blank', 'width=850,height=950');
    if (!popup) return toast.error('Please allow popups to print the School Leaving Certificate');

    const schoolName = user?.schoolName || 'School name not configured';
    const admNo = student.admissionNo || 'ADM-0000';
    const issueDate = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });
    const dob = student.dob ? new Date(student.dob).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Not recorded';
    const className = student.section?.class?.name || 'Not assigned';
    const session = student.session || currentSession;

    const html = `<!doctype html>
<html>
<head>
  <title>School Leaving Certificate — ${student.name} (${admNo})</title>
  <style>
    @page { size: portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      background: #fff;
      color: #0f172a;
      padding: 20px;
      line-height: 1.6;
    }
    .cert-border {
      border: 4px double #0c4a6e;
      padding: 30px;
      border-radius: 8px;
      position: relative;
      background: #ffffff;
      min-height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 65px;
      font-weight: 900;
      color: rgba(12, 74, 110, 0.04);
      pointer-events: none;
      z-index: 0;
      letter-spacing: 5px;
      white-space: nowrap;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0c4a6e;
      padding-bottom: 15px;
      margin-bottom: 25px;
    }
    .school-name {
      font-size: 26px;
      font-weight: 900;
      color: #0c4a6e;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .sub-head {
      font-size: 13px;
      color: #475569;
      margin-top: 4px;
      font-style: italic;
    }
    .cert-title {
      font-size: 20px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #0c4a6e;
      margin-top: 15px;
      display: inline-block;
      padding: 4px 20px;
      border: 2px solid #0c4a6e;
      border-radius: 4px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: bold;
      margin-bottom: 25px;
      color: #334155;
    }
    .content-body {
      font-size: 15px;
      line-height: 2.2;
      text-align: justify;
      color: #1e293b;
    }
    .field-line {
      display: inline-block;
      border-bottom: 1.5px dotted #0c4a6e;
      padding: 0 8px;
      font-weight: bold;
      color: #0c4a6e;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 60px;
      padding-top: 20px;
    }
    .sig-block {
      text-align: center;
      width: 28%;
    }
    .sig-line {
      border-top: 1.5px solid #0f172a;
      padding-top: 6px;
      font-size: 12px;
      font-weight: bold;
      color: #0f172a;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 10px 15px; border-radius: 8px; font-family: sans-serif;">
    <span style="font-size: 13px; color: #475569; font-weight: 600;">Official School Leaving Certificate (SLC)</span>
    <button onclick="window.print()" style="padding: 8px 20px; background: #0c4a6e; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">
      🖨️ Print Certificate
    </button>
  </div>

  <div class="cert-border">
    <div class="watermark">SCHOOL LEAVING CERTIFICATE</div>

    <div>
      <div class="header">
        <div class="school-name">${schoolName}</div>
        <div class="sub-head">Affiliated / Registered Educational Institution &bull; Academic Directorate</div>
        <div class="cert-title">School Leaving Certificate</div>
      </div>

      <div class="meta-row">
        <span>Certificate Serial No: <span style="font-family: monospace; color: #0c4a6e;">SLC-${admNo.replace(/[^0-9]/g, '') || '2026-01'}</span></span>
        <span>Date of Issue: <span>${issueDate}</span></span>
      </div>

      <div class="content-body">
        This is to certify that Master / Miss <span class="field-line" style="min-width: 220px; text-align: center;">${student.name}</span>, 
        Son / Daughter of Mr. <span class="field-line" style="min-width: 220px; text-align: center;">${student.emergencyContact ? 'Guardian on Record' : 'Father on Record'}</span>, 
        bearing Admission / Registration Number <span class="field-line" style="font-family: monospace;">${admNo}</span>, 
        was a bona-fide student of this institution from session <span class="field-line">${session}</span>.
        <br/><br/>
        According to the school admission register, his/her Date of Birth is 
        <span class="field-line">${dob}</span>.
        He/She left the school on <span class="field-line">${issueDate}</span> 
        while studying in <span class="field-line" style="min-width: 150px; text-align: center;">${className}</span>.
        <br/><br/>
        All school dues and institutional library accounts have been settled up to date.
        His/Her moral character and general conduct during his/her stay at this school has been 
        <span class="field-line" style="font-weight: 900; color: #166534;">EXCELLENT / SATISFACTORY</span>.
        <br/><br/>
        Reason for leaving the school: <span class="field-line" style="min-width: 240px;">Completion of Studies / Parent Transfer</span>.
        We wish him/her every success in all future academic endeavors.
      </div>
    </div>

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line">Class Incharge</div>
      </div>
      <div class="sig-block">
        <div class="sig-line">Office Superintendent</div>
      </div>
      <div class="sig-block">
        <div class="sig-line">Principal / Headmaster</div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 400); };
  </script>
</body>
</html>`;

    popup.document.write(html);
    popup.document.close();
  };

  const move = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedIds.length || !targetSection) return toast.warning('Select students and a target section');
    try {
      await apiClient.post(`/people/students/${moveMode}`, {
        studentIds: selectedIds,
        sectionId: targetSection,
        session: moveMode === 'promote' ? currentSession : undefined,
      });
      toast.success(`${selectedIds.length} student(s) ${moveMode === 'promote' ? 'promoted' : 'transferred'}`);
      setMoveMode(null);
      setSelectedIds([]);
      setTargetSection('');
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Failed to ${moveMode} students`);
    }
  };

  // ══════════════════════════════════════════════════════════════
  // FULL PAGE ADD / EDIT STUDENT VIEW — UNIFIED SINGLE-PAGE FORM
  // ══════════════════════════════════════════════════════════════
  if (view === 'add') {
    const currentSectionObj = sections.find((s) => s.id === form.sectionId);
    const calculatedAge = calculateAge(form.dateOfBirth);

    // Candidate friendly login username and official .edu.pk email preview
    const firstName = form.name.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student';
    const rollDigits = form.rollNo?.replace(/\D/g, '') || '1';
    const candidateLoginId = `${firstName}${rollDigits}`;
    const cleanAdmNo = (form.admissionNo || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const candidateEmail = form.email.trim() || (cleanAdmNo ? `${cleanAdmNo}@school.edu.pk` : `${candidateLoginId}@school.edu.pk`);

    return (
      <div className="w-full min-h-screen pb-20 space-y-6 max-w-6xl mx-auto animate-fade-in">
        {/* Top Header Card with Vibrant Cyan Banner matching reference image */}
        <div className="overflow-hidden rounded-3xl border border-cyan-200/80 bg-white dark:bg-slate-900 shadow-md">
          <div className="bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-6 py-5 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-900/20 text-white flex items-center justify-center backdrop-blur-md shadow-inner shrink-0">
                <GraduationCap size={26} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white dark:bg-slate-900/20 text-white border border-white/30 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                    {editing ? 'UPDATE STUDENT PROFILE' : 'STUDENT ADMISSION FORM'}
                  </span>
                  <span className="text-xs text-white/90 font-bold">Session {form.session}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {editing ? `Edit Record: ${editing.name}` : 'Student Admission & Registration'}
                </h1>
                <p className="text-xs text-cyan-50 font-medium mt-0.5">
                  Official verified single-page admission form with automated roll number & student portal login credentials.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setView('list')}
              className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900/15 hover:bg-white dark:bg-slate-900/25 border border-white/30 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-sm shrink-0 backdrop-blur-sm"
            >
              <ArrowLeft size={16} /> Exit to Student List
            </button>
          </div>
        </div>

        {/* ── UNIFIED SINGLE PAGE ADMISSION FORM ── */}
        <form onSubmit={save} className="space-y-6">

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECTION 1: STUDENT PERSONAL INFORMATION                   */}
          {/* ══════════════════════════════════════════════════════════ */}
          <div className="rounded-3xl border border-cyan-500/30 bg-card shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 px-6 py-4 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white dark:bg-slate-900/20 flex items-center justify-center shrink-0">
                  <UserRound size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    Student Personal Information
                  </h2>
                  <p className="text-xs text-blue-100 font-normal">
                    Basic identification, official full name, date of birth, photo, and NADRA B-Form.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider bg-white dark:bg-slate-900/20 text-white px-3 py-1 rounded-full border border-white/30 shrink-0">
                Personal Data
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Photo & Main Identification Card */}
              <div className="flex flex-col md:flex-row gap-6 items-start rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 p-5 sm:p-6">
                
                {/* Photo Upload Area */}
                <div className="flex flex-col items-center gap-2 shrink-0 mx-auto md:mx-0">
                  <label className="relative flex h-40 w-40 cursor-pointer items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-cyan-400 bg-white dark:bg-slate-900 shadow-inner hover:border-cyan-500 transition-all group">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={compressing}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handlePhoto(file);
                        e.currentTarget.value = '';
                      }}
                    />
                    {form.avatarUrl ? (
                      <>
                        <img src={form.avatarUrl} alt="Student" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-black uppercase tracking-wider transition-opacity gap-1">
                          <Camera size={20} />
                          Change Photo
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-500 text-center p-3">
                        {compressing ? <Loader2 size={26} className="animate-spin text-cyan-500" /> : <Camera size={30} className="text-cyan-500" />}
                        <span className="text-[11px] font-black uppercase tracking-wider text-cyan-600">
                          {compressing ? 'Compressing...' : 'Upload Photo'}
                        </span>
                        <span className="text-[9px] text-slate-400">Click to select photo</span>
                      </div>
                    )}
                  </label>
                  {form.avatarUrl ? (
                    <button
                      type="button"
                      onClick={() => update('avatarUrl', '')}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-wider inline-flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Remove Photo
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400">Passport size JPG/PNG</span>
                  )}
                </div>

                {/* Primary Student Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 w-full">
                  <div className="sm:col-span-2 lg:col-span-3">
                    <Field label="Student Full Name" required>
                      <input
                        required
                        className={`${inputClass} text-base font-bold text-slate-900 dark:text-foreground`}
                        placeholder="e.g. Muhammad Ali Siddique"
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                      />
                    </Field>
                  </div>

                  <Field label="Date of Birth">
                    <div className="space-y-1">
                      <input
                        type="date"
                        className={inputClass}
                        value={form.dateOfBirth}
                        onChange={(e) => update('dateOfBirth', e.target.value)}
                      />
                      {calculatedAge && (
                        <p className="text-[11px] font-bold text-cyan-600 flex items-center gap-1">
                          <Clock size={12} /> Age: {calculatedAge}
                        </p>
                      )}
                    </div>
                  </Field>

                  <Field label="Gender" required>
                    <div className="grid grid-cols-3 gap-2 pt-0.5">
                      {[
                        { val: 'MALE', label: 'Male' },
                        { val: 'FEMALE', label: 'Female' },
                        { val: 'OTHER', label: 'Other' },
                      ].map((g) => (
                        <button
                          key={g.val}
                          type="button"
                          onClick={() => update('gender', g.val)}
                          className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition text-center ${
                            form.gender === g.val
                              ? 'bg-cyan-500 text-white border-cyan-500 shadow-sm'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 dark:text-foreground hover:bg-slate-50 dark:bg-slate-900'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Blood Group">
                    <select
                      className={inputClass}
                      value={form.bloodGroup}
                      onChange={(e) => update('bloodGroup', e.target.value)}
                    >
                      <option value="">Select blood group</option>
                      {bloodGroups.map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="NADRA B-Form / CNIC">
                    <div className="relative">
                      <input
                        inputMode="numeric"
                        maxLength={15}
                        className={`${inputClass} font-mono`}
                        placeholder="35201-xxxxxxx-x"
                        value={form.bFormNumber}
                        onChange={(e) => update('bFormNumber', formatCnic(e.target.value))}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400">
                        {form.bFormNumber.replace(/\D/g, '').length}/13
                      </span>
                    </div>
                  </Field>

                  <Field label="Religion">
                    <select
                      className={inputClass}
                      value={form.religion}
                      onChange={(e) => update('religion', e.target.value)}
                    >
                      <option value="">Select religion</option>
                      {religions.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Nationality">
                    <input
                      className={inputClass}
                      placeholder="Pakistani"
                      value={form.nationality}
                      onChange={(e) => update('nationality', e.target.value)}
                    />
                  </Field>

                  <Field label="Student Personal Mobile (Optional)">
                    <input
                      inputMode="numeric"
                      maxLength={12}
                      className={`${inputClass} font-mono`}
                      placeholder="0300-1234567"
                      value={form.phone}
                      onChange={(e) => update('phone', formatPhone(e.target.value))}
                    />
                  </Field>

                  <Field label="Emergency Contact Mobile">
                    <input
                      inputMode="numeric"
                      maxLength={12}
                      className={`${inputClass} font-mono`}
                      placeholder="0300-1234567"
                      value={form.emergencyContact}
                      onChange={(e) => update('emergencyContact', formatPhone(e.target.value))}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECTION 2: ACADEMIC & CLASSROOM ASSIGNMENT                */}
          {/* ══════════════════════════════════════════════════════════ */}
          <div className="rounded-3xl border border-indigo-500/30 bg-card shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 px-6 py-4 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white dark:bg-slate-900/20 flex items-center justify-center shrink-0">
                  <GraduationCap size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    Academic & Classroom Assignment
                  </h2>
                  <p className="text-xs text-indigo-100 font-normal">
                    Assign student to grade level, classroom section with live capacity, and official roll number.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider bg-white dark:bg-slate-900/20 text-white px-3 py-1 rounded-full border border-white/30 shrink-0">
                Academic Data
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <Field label="Class Level" required>
                  <select
                    required
                    className={`${inputClass} font-bold text-slate-900 dark:text-foreground`}
                    value={form.classId}
                    onChange={(e) => {
                      const newClassId = e.target.value;
                      const classSecs = sections.filter((s) => s.classId === newClassId);
                      const firstSecId = classSecs[0]?.id || '';
                      const nextRoll = calculateNextRollNo(firstSecId, students);
                      setForm((prev) => ({
                        ...prev,
                        classId: newClassId,
                        sectionId: firstSecId,
                        rollNo: nextRoll,
                      }));
                    }}
                  >
                    <option value="">Select Class Level *</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Section Assignment" required>
                  <select
                    required
                    className={`${inputClass} font-bold text-slate-900 dark:text-foreground`}
                    value={form.sectionId}
                    onChange={(e) => {
                      const secId = e.target.value;
                      const nextRoll = calculateNextRollNo(secId, students);
                      setForm((prev) => ({
                        ...prev,
                        sectionId: secId,
                        rollNo: nextRoll,
                      }));
                    }}
                  >
                    <option value="">Select Section *</option>
                    {availableFormSections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.className} — Section {sec.name} {sec.teacher?.name ? `(${sec.teacher.name})` : ''}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Roll Number">
                  <div className="relative">
                    <input
                      className={`${inputClass} font-mono font-bold text-cyan-600`}
                      placeholder="e.g. 1, 2, 3..."
                      value={form.rollNo}
                      onChange={(e) => update('rollNo', e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-wider bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full border border-cyan-200">
                      Auto Calculated
                    </span>
                  </div>
                </Field>

                <Field label="Admission Number">
                  <div className="relative">
                    <input
                      className={`${inputClass} font-mono font-bold text-sky-600`}
                      placeholder="Leave blank for Auto ADM-YYYY-0001"
                      value={form.admissionNo}
                      onChange={(e) => update('admissionNo', e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-wider bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full border border-sky-200">
                      Auto if Empty
                    </span>
                  </div>
                </Field>

                <Field label="Academic Session">
                  <input
                    className={inputClass}
                    placeholder="2026-2027"
                    value={form.session}
                    onChange={(e) => update('session', e.target.value)}
                  />
                </Field>

                <Field label="Admission Date">
                  <input
                    type="date"
                    className={inputClass}
                    value={form.admissionDate}
                    onChange={(e) => update('admissionDate', e.target.value)}
                  />
                </Field>
              </div>

              {/* Classroom Section Live Capacity Card */}
              {currentSectionObj && (
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-cyan-500 text-white flex items-center justify-center font-bold shadow-sm">
                      {currentSectionObj.name}
                    </div>
                    <div>
                      <p className="font-bold text-cyan-950">
                        {currentSectionObj.className} — Section {currentSectionObj.name}
                      </p>
                      <p className="text-cyan-700 text-[11px]">
                        Class Teacher: {currentSectionObj.teacher?.name || 'Not assigned'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white dark:bg-slate-900 text-cyan-800 border border-cyan-200 shadow-sm">
                      Capacity: {currentSectionObj.capacity != null ? `${currentSectionObj.capacity} Students` : 'Not configured'}
                    </span>
                  </div>
                </div>
              )}

              {/* Admission Type Selection */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 p-5 space-y-4">
                <div className="bg-slate-200/70 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Sparkles size={14} className="text-cyan-600" />
                  Admission Category & Previous Schooling
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                  <button
                    type="button"
                    onClick={() => update('admissionType', 'NEW')}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
                      form.admissionType === 'NEW'
                        ? 'bg-cyan-50 border-cyan-500 text-cyan-900 shadow-sm ring-1 ring-cyan-500/30'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 dark:text-foreground'
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${form.admissionType === 'NEW' ? 'bg-cyan-500' : 'bg-slate-300'}`} />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-foreground">New Admission</p>
                      <p className="text-[10px] text-slate-500">First time enrollment in this school</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => update('admissionType', 'TRANSFER')}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
                      form.admissionType === 'TRANSFER'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm ring-1 ring-amber-500/30'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 dark:text-foreground'
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${form.admissionType === 'TRANSFER' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-foreground">Transfer / Migration</p>
                      <p className="text-[10px] text-slate-500">School Leaving Certificate / Transfer</p>
                    </div>
                  </button>
                </div>

                {form.admissionType === 'TRANSFER' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <Field label="Previous School Name" required>
                      <input
                        required
                        className={inputClass}
                        placeholder="e.g. Army Public School / City School"
                        value={form.previousSchool}
                        onChange={(e) => update('previousSchool', e.target.value)}
                      />
                    </Field>
                    <Field label="Previous Class Passed" required>
                      <input
                        required
                        className={inputClass}
                        placeholder="e.g. Class 4 / Grade 8"
                        value={form.previousClass}
                        onChange={(e) => update('previousClass', e.target.value)}
                      />
                    </Field>
                    <Field label="Previous Academic Record / Marks %">
                      <input
                        className={inputClass}
                        placeholder="e.g. 88% / Grade A+"
                        value={form.previousAcademicRecord}
                        onChange={(e) => update('previousAcademicRecord', e.target.value)}
                      />
                    </Field>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECTION 3: PARENT & GUARDIAN DETAILS                      */}
          {/* ══════════════════════════════════════════════════════════ */}
          <div className="space-y-6">
            
            {/* Father Information Card */}
            <div className="rounded-3xl border border-blue-500/30 bg-card shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-white dark:bg-slate-900/20 flex items-center justify-center shrink-0">
                    <Users size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-white">Father Information</h2>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-white dark:bg-slate-900/20 text-white px-2.5 py-0.5 rounded-full border border-white/30">
                        Primary Parent
                      </span>
                    </div>
                    <p className="text-xs text-blue-100 font-normal">Primary contact numbers used for SMS alerts, attendance, and fee notices.</p>
                  </div>
                </div>

                {/* Father Status Toggle */}
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900/20 backdrop-blur-sm p-1 rounded-2xl border border-white/30">
                  <button
                    type="button"
                    onClick={() => update('fatherStatus', 'ALIVE')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      form.fatherStatus === 'ALIVE'
                        ? 'bg-white dark:bg-slate-900 text-blue-900 shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Alive
                  </button>
                  <button
                    type="button"
                    onClick={() => update('fatherStatus', 'DECEASED')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      form.fatherStatus === 'DECEASED'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-rose-200" />
                    Deceased
                  </button>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-4">
                {form.fatherStatus === 'DECEASED' && (
                  <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-950">Father is marked as Deceased</p>
                      <p className="text-amber-800 text-[11px] mt-0.5">
                        Please provide Guardian details below. Guardian Mobile is mandatory for all school communication and emergency contacts.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field
                    label={form.fatherStatus === 'DECEASED' ? 'Father Name (Late)' : 'Father Full Name'}
                    required={form.fatherStatus === 'ALIVE'}
                  >
                    <input
                      required={form.fatherStatus === 'ALIVE'}
                      className={inputClass}
                      placeholder="e.g. Tariq Mehmood"
                      value={form.fatherName}
                      onChange={(e) => update('fatherName', e.target.value)}
                    />
                  </Field>

                  <Field
                    label="Father Primary Mobile"
                    required={form.fatherStatus === 'ALIVE'}
                  >
                    <input
                      inputMode="numeric"
                      maxLength={12}
                      required={form.fatherStatus === 'ALIVE'}
                      className={`${inputClass} font-mono`}
                      placeholder="0300-1234567"
                      value={form.fatherMobile1}
                      onChange={(e) => update('fatherMobile1', formatPhone(e.target.value))}
                    />
                  </Field>

                  <Field label="Father Secondary Mobile (Optional)">
                    <input
                      inputMode="numeric"
                      maxLength={12}
                      className={`${inputClass} font-mono`}
                      placeholder="0321-7654321"
                      value={form.fatherMobile2}
                      onChange={(e) => update('fatherMobile2', formatPhone(e.target.value))}
                    />
                  </Field>

                  <Field label="Father CNIC">
                    <div className="relative">
                      <input
                        inputMode="numeric"
                        maxLength={15}
                        className={`${inputClass} font-mono`}
                        placeholder="35201-xxxxxxx-x"
                        value={form.fatherCnic}
                        onChange={(e) => update('fatherCnic', formatCnic(e.target.value))}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400">
                        {form.fatherCnic.replace(/\D/g, '').length}/13
                      </span>
                    </div>
                  </Field>

                  {/* Father Occupation Dropdown with Pakistani Standard Options */}
                  <Field label="Father Occupation">
                    <select
                      className={inputClass}
                      value={form.fatherOccupation}
                      onChange={(e) => update('fatherOccupation', e.target.value)}
                    >
                      <option value="">Select Father Occupation</option>
                      {fatherOccupations.map((occ) => (
                        <option key={occ} value={occ}>{occ}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            </div>

            {/* Guardian Information Card */}
            <div className="rounded-3xl border border-indigo-500/30 bg-card shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-6 py-4 text-white flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-white dark:bg-slate-900/20 flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-white">Guardian Information</h2>
                      {form.fatherStatus === 'DECEASED' ? (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white px-2.5 py-0.5 rounded-full border border-rose-400">
                          Mandatory
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-white dark:bg-slate-900/20 text-white px-2.5 py-0.5 rounded-full border border-white/30">
                          Optional
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-indigo-100 font-normal">Legal guardian responsible if father is absent, abroad, or deceased.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field label="Guardian Full Name" required={form.fatherStatus === 'DECEASED'}>
                    <input
                      required={form.fatherStatus === 'DECEASED'}
                      className={inputClass}
                      placeholder="e.g. Abdul Rehman"
                      value={form.guardianName}
                      onChange={(e) => update('guardianName', e.target.value)}
                    />
                  </Field>

                  <Field label="Relationship with Student" required={form.fatherStatus === 'DECEASED'}>
                    <select
                      className={inputClass}
                      value={form.guardianRelation}
                      onChange={(e) => update('guardianRelation', e.target.value)}
                    >
                      {guardianRelations.map((gr) => (
                        <option key={gr.value} value={gr.value}>{gr.label}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Guardian Mobile Number" required={form.fatherStatus === 'DECEASED'}>
                    <input
                      inputMode="numeric"
                      maxLength={12}
                      required={form.fatherStatus === 'DECEASED'}
                      className={`${inputClass} font-mono`}
                      placeholder="0300-1234567"
                      value={form.guardianMobile}
                      onChange={(e) => update('guardianMobile', formatPhone(e.target.value))}
                    />
                  </Field>

                  <Field label="Guardian CNIC">
                    <input
                      inputMode="numeric"
                      maxLength={15}
                      className={`${inputClass} font-mono`}
                      placeholder="35201-xxxxxxx-x"
                      value={form.guardianCnic}
                      onChange={(e) => update('guardianCnic', formatCnic(e.target.value))}
                    />
                  </Field>

                  <Field label="Guardian Occupation">
                    <input
                      className={inputClass}
                      placeholder="e.g. Business / Lawyer / Teacher"
                      value={form.guardianOccupation}
                      onChange={(e) => update('guardianOccupation', e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* Mother Information Card */}
            <div className="rounded-3xl border border-violet-500/30 bg-card shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-white dark:bg-slate-900/20 flex items-center justify-center shrink-0">
                    <HeartPulse size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-white">Mother Information</h2>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-white dark:bg-slate-900/20 text-white px-2.5 py-0.5 rounded-full border border-white/30">
                        Family Record
                      </span>
                    </div>
                    <p className="text-xs text-purple-100 font-normal">Mother name, status, contact, and CNIC number.</p>
                  </div>
                </div>

                {/* Mother Status Toggle */}
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900/20 backdrop-blur-sm p-1 rounded-2xl border border-white/30">
                  <button
                    type="button"
                    onClick={() => update('motherStatus', 'ALIVE')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      form.motherStatus === 'ALIVE'
                        ? 'bg-white dark:bg-slate-900 text-purple-900 shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Alive
                  </button>
                  <button
                    type="button"
                    onClick={() => update('motherStatus', 'DECEASED')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      form.motherStatus === 'DECEASED'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-rose-200" />
                    Deceased
                  </button>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Field label={form.motherStatus === 'DECEASED' ? 'Mother Name (Late)' : 'Mother Full Name'}>
                    <input
                      className={inputClass}
                      placeholder="e.g. Parveen Bibi"
                      value={form.motherName}
                      onChange={(e) => update('motherName', e.target.value)}
                    />
                  </Field>

                  <Field label="Mother Mobile Number">
                    <input
                      inputMode="numeric"
                      maxLength={12}
                      className={`${inputClass} font-mono`}
                      placeholder="0300-1234567"
                      value={form.motherMobile}
                      onChange={(e) => update('motherMobile', formatPhone(e.target.value))}
                    />
                  </Field>

                  <Field label="Mother CNIC">
                    <input
                      inputMode="numeric"
                      maxLength={15}
                      className={`${inputClass} font-mono`}
                      placeholder="35201-xxxxxxx-x"
                      value={form.motherCnic}
                      onChange={(e) => update('motherCnic', formatCnic(e.target.value))}
                    />
                  </Field>

                  {/* Mother Occupation Dropdown */}
                  <Field label="Mother Occupation">
                    <select
                      className={inputClass}
                      value={form.motherOccupation}
                      onChange={(e) => update('motherOccupation', e.target.value)}
                    >
                      <option value="">Select Mother Occupation</option>
                      {motherOccupations.map((occ) => (
                        <option key={occ} value={occ}>{occ}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECTION 4: RESIDENTIAL ADDRESS & SCHOOL FACILITIES        */}
          {/* ══════════════════════════════════════════════════════════ */}
          <div className="rounded-3xl border border-sky-500/30 bg-card shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 px-6 py-4 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white dark:bg-slate-900/20 flex items-center justify-center shrink-0">
                  <MapPin size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    Residential Address & Location
                  </h2>
                  <p className="text-xs text-sky-100 font-normal">
                    Current residential address and permanent home town location.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider bg-white dark:bg-slate-900/20 text-white px-3 py-1 rounded-full border border-white/30 shrink-0">
                Address
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Addresses */}
              <div className="space-y-4">
                <Field label="Current Residential Address" required>
                  <input
                    required
                    className={inputClass}
                    placeholder="House #, Street #, Mohallah / Sector / Area, City"
                    value={form.currentAddress}
                    onChange={(e) => update('currentAddress', e.target.value)}
                  />
                </Field>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Permanent Home Address
                    </span>
                    <button
                      type="button"
                      onClick={() => update('permanentAddress', form.currentAddress)}
                      className="text-[11px] font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                    >
                      <Copy size={12} /> Same as Current Address
                    </button>
                  </div>
                  <input
                    className={inputClass}
                    placeholder="Village / Tehsil / District (if different)"
                    value={form.permanentAddress}
                    onChange={(e) => update('permanentAddress', e.target.value)}
                  />
                </div>
              </div>

              {/* School Facilities: Transport & Hostel (RENDERED ONLY IF SCHOOL HAS FACILITIES IN RECORD) */}
              {(facilities.transport || facilities.hostel) && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 p-5 space-y-4">
                  <div className="bg-slate-200/70 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Bus size={15} className="text-cyan-600" />
                    School Facilities Required (Enabled for School)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Transport Option (if school has transport) */}
                    {facilities.transport && (
                      <div className={`p-4 rounded-2xl border transition ${
                        form.transportRequired ? 'border-cyan-500 bg-cyan-50 shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }`}>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded accent-cyan-600"
                            checked={form.transportRequired}
                            onChange={(e) => update('transportRequired', e.target.checked)}
                          />
                          <div className="flex-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-foreground block">🚌 School Transport / Van Service</span>
                            <span className="text-[11px] text-slate-500">Pick & drop van service for this student</span>
                          </div>
                        </label>

                        {form.transportRequired && (
                          <div className="mt-3 pt-3 border-t border-cyan-200">
                            <Field label="Pickup Stop / Area Location">
                              <input
                                className={inputClass}
                                placeholder="e.g. Shadman Chowk / Main Market stop"
                                value={form.transportStop}
                                onChange={(e) => update('transportStop', e.target.value)}
                              />
                            </Field>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Hostel Option (if school has hostel) */}
                    {facilities.hostel && (
                      <div className={`p-4 rounded-2xl border transition ${
                        form.hostelRequired ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }`}>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded accent-amber-600"
                            checked={form.hostelRequired}
                            onChange={(e) => update('hostelRequired', e.target.checked)}
                          />
                          <div className="flex-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-foreground block">🏠 Hostel Accommodation Facility</span>
                            <span className="text-[11px] text-slate-500">Boarding school accommodation & room</span>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECTION 5: STUDENT PORTAL ONLINE LOGIN CREDENTIALS        */}
          {/* ══════════════════════════════════════════════════════════ */}
          <div className="rounded-3xl border border-indigo-500/30 bg-card shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 px-6 py-4 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white dark:bg-slate-900/20 flex items-center justify-center shrink-0">
                  <Key size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    Student Online Portal Login Credentials
                  </h2>
                  <p className="text-xs text-indigo-100 font-normal">
                    Verified login pattern allowing the student to access LMS, attendance, report cards & fees.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider bg-white dark:bg-slate-900/20 text-white px-3 py-1 rounded-full border border-white/30 shrink-0">
                Portal Access
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Friendly Login ID */}
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-cyan-800 mb-1">
                    🎓 Friendly Login ID / Username
                  </p>
                  <p className="font-mono font-bold text-base text-cyan-950 break-all">
                    {candidateLoginId}
                  </p>
                  <p className="text-[10px] text-cyan-700 mt-1">
                    Student name + roll no for fast typing
                  </p>
                </div>

                {/* Official Portal Email ending in .edu.pk */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                    📧 Official Portal Email
                  </p>
                  <p className="font-mono font-bold text-sm text-cyan-700 break-all">
                    {candidateEmail}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Unique verified institutional account
                  </p>
                </div>

                {/* Password Generator */}
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                      🔑 8-Digit Password *
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const generated = generate8CharPassword();
                        update('password', generated);
                        toast.success(`Generated: ${generated}`);
                      }}
                      className="text-[10px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1"
                    >
                      <RefreshCw size={11} /> Auto-Generate
                    </button>
                  </div>

                  <div className="relative mt-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editing}
                      className={`${inputClass} font-mono font-bold tracking-widest text-amber-900 pr-10 bg-white dark:bg-slate-900`}
                      placeholder="8-digit password"
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900 flex items-center gap-3">
                <Sparkles size={18} className="text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold">Multi-Identifier Easy Login:</span> Student can sign in using their{' '}
                  <span className="font-mono font-bold text-emerald-950">{candidateLoginId}</span>, their Admission Number, or their official Email{' '}
                  <span className="font-mono font-bold text-emerald-950">{candidateEmail}</span> with this password.
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECTION 6: SUBMITTED DOCUMENTS & ADMISSION CHECKLIST      */}
          {/* ══════════════════════════════════════════════════════════ */}
          <div className="rounded-3xl border border-teal-500/30 bg-card shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-700 px-6 py-4 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white dark:bg-slate-900/20 flex items-center justify-center shrink-0">
                  <CheckSquare size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    Submitted Documents & File Verification Checklist
                  </h2>
                  <p className="text-xs text-teal-100 font-normal">
                    Mark physical documents received from parent/guardian for official student record file.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider bg-white dark:bg-slate-900/20 text-white px-3 py-1 rounded-full border border-white/30 shrink-0">
                Documents File
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-4">
              <p className="text-xs font-semibold text-slate-600 mb-2">
                Select all physical document proofs collected during the admission verification process:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    key: 'bForm' as const,
                    title: 'NADRA B-Form / Birth Certificate Copy',
                    desc: 'Clear copy of official NADRA B-Form / Registration',
                  },
                  {
                    key: 'fatherCnic' as const,
                    title: 'Father CNIC / National ID Card Copy',
                    desc: 'Valid Pakistani CNIC / Overseas NICOP photocopy',
                  },
                  {
                    key: 'motherOrGuardianCnic' as const,
                    title: 'Mother / Guardian CNIC Copy',
                    desc: 'Secondary parent or legal guardian identity proof',
                  },
                  {
                    key: 'photos' as const,
                    title: 'Passport Size Photographs (3 Attested)',
                    desc: 'Recent blue-background passport-size photographs',
                  },
                  {
                    key: 'leavingCertificate' as const,
                    title: 'School Leaving Certificate (SLC)',
                    desc: 'Original transfer certificate from previous institution',
                  },
                  {
                    key: 'academicRecord' as const,
                    title: 'Previous Progress Report / Marksheet',
                    desc: 'Previous class report card or result gazette',
                  },
                  {
                    key: 'admissionFormSigned' as const,
                    title: 'Signed Official Admission Application Form',
                    desc: 'Undertaking & code of conduct signed by parent',
                  },
                ].map((item) => {
                  const isChecked = checklist[item.key];
                  return (
                    <label
                      key={item.key}
                      className={`flex items-start gap-3 p-4 rounded-2xl border transition cursor-pointer select-none ${
                        isChecked
                          ? 'border-cyan-500 bg-cyan-50/70 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-900'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setChecklist((prev) => ({ ...prev, [item.key]: e.target.checked }))
                        }
                        className="mt-1 h-5 w-5 rounded accent-cyan-600 shrink-0 cursor-pointer"
                      />
                      <div className="flex-1">
                        <span className={`text-xs font-bold block ${isChecked ? 'text-cyan-950' : 'text-slate-800'}`}>
                          {item.title}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {item.desc}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── BOTTOM ACTION & SUBMIT BUTTONS ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setView('list')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:bg-slate-900 transition shadow-sm"
            >
              <ArrowLeft size={16} /> Cancel & Return to Student List
            </button>

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-8 py-3.5 text-sm font-black text-white shadow-xl shadow-emerald-600/25 hover:brightness-110 transition disabled:opacity-60"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {editing ? 'Update Student Profile' : 'Complete Admission & Generate Student Credentials'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // MAIN STUDENT DIRECTORY VIEW
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 pb-20">
      
      {/* ── POST-ADMISSION BANNER ── */}
      {lastAdmitted && (
        <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-cyan-950/60 p-6 shadow-2xl animate-fade-in">
          <div className="relative flex flex-col lg:flex-row gap-6 items-start lg:items-center">
            
            <div className="flex items-center gap-4 flex-1">
              <div className="h-16 w-16 rounded-2xl overflow-hidden bg-slate-800 border-2 border-emerald-500/50 shrink-0 flex items-center justify-center font-black text-2xl text-emerald-400">
                {lastAdmitted.student.avatarUrl ? (
                  <img src={lastAdmitted.student.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  lastAdmitted.student.name?.charAt(0)
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Admission Successful</span>
                </div>
                <h3 className="text-lg font-black text-white">{lastAdmitted.student.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{lastAdmitted.student.admissionNo}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="flex-1 rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-cyan-400 mb-1">🎓 Student Login ID</p>
                <p className="font-mono font-bold text-sm text-white break-all">{lastAdmitted.creds.loginId}</p>
              </div>
              <div className="flex-1 rounded-2xl border border-amber-500/30 bg-slate-900/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-1">🔑 8-Digit Password</p>
                <p className="font-mono font-bold text-sm text-amber-300 tracking-widest">{lastAdmitted.creds.password}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIdCardStudent(lastAdmitted.student)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/50 bg-cyan-600/20 px-3.5 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-600/30 transition"
              >
                <Printer size={14} /> View ID Card
              </button>
              <button
                onClick={() => setLastAdmitted(null)}
                className="rounded-xl p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-600/10 via-card to-blue-600/5 p-6 shadow-sm">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-cyan-500">Student Directory</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Students Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Total of {students.length} active students enrolled across {classes.length} class levels.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {canManage && (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:brightness-110 transition"
              >
                <Plus size={16} /> New Admission
              </button>
            )}

            <button
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/80 px-3.5 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-cyan-500/20 bg-card p-5 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold mb-3">
            <Users size={20} />
          </div>
          <p className="text-2xl font-black text-foreground">{students.length}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">Total Enrolled</p>
        </div>

        <div className="rounded-2xl border border-sky-500/20 bg-card p-5 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold mb-3">
            <User size={20} />
          </div>
          <p className="text-2xl font-black text-foreground">{boysCount}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">Male Students</p>
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-card p-5 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold mb-3">
            <HeartPulse size={20} />
          </div>
          <p className="text-2xl font-black text-foreground">{girlsCount}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">Female Students</p>
        </div>

        <div className="rounded-2xl border border-indigo-500/20 bg-card p-5 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold mb-3">
            <GraduationCap size={20} />
          </div>
          <p className="text-2xl font-black text-foreground">{sectionCount}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">Active Sections</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, roll number, class, section, phone..."
            className="w-full rounded-xl border border-border/80 bg-background/80 py-2.5 pl-11 pr-4 text-xs font-medium text-foreground shadow-sm placeholder:text-muted-foreground/60 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setSectionFilter('');
            }}
            className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold text-foreground outline-none w-full md:w-auto"
          >
            <option value="">All Classes ({classes.length})</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>

          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold text-foreground outline-none w-full md:w-auto"
          >
            <option value="">All Sections</option>
            {availableFilterSections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.className} - {sec.name}
              </option>
            ))}
          </select>

          {(classFilter || sectionFilter || search) && (
            <button
              onClick={() => {
                setClassFilter('');
                setSectionFilter('');
                setSearch('');
              }}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 px-2 py-1 shrink-0"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Student List Table */}
      <div className="rounded-3xl border border-border/80 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/30 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Roll Number</th>
                <th className="px-5 py-4">Class & Section</th>
                <th className="px-5 py-4">Emergency / Mobile</th>
                <th className="px-5 py-4">Blood Grp</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <Loader2 size={24} className="mx-auto animate-spin text-cyan-500 mb-2" />
                    Loading student directory...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No students match your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => {
                      setProfile(student);
                      setProfileTab('overview');
                    }}
                    className="cursor-pointer hover:bg-muted/40 transition group"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl overflow-hidden bg-cyan-600/10 text-cyan-600 flex items-center justify-center font-bold text-sm border border-cyan-500/20 shrink-0">
                          {student.avatarUrl ? (
                            <img src={student.avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            student.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-sm group-hover:text-cyan-500 transition-colors">
                            {student.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{student.gender || 'Male'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-mono">
                      <span className="font-bold text-foreground text-sm block">{student.rollNo || '—'}</span>
                      <span className="text-[10px] text-cyan-500">{student.admissionNo}</span>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="font-bold text-foreground">{student.section?.class?.name || 'Class'}</p>
                      <p className="text-[11px] text-muted-foreground">Section {student.section?.name || '—'}</p>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-foreground">{student.emergencyContact || student.phone || '—'}</p>
                      <p className="text-[11px] font-mono text-muted-foreground">{student.email || '—'}</p>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-foreground border border-border">
                        {student.bloodGroup || 'Not provided'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setIdCardStudent(student)}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-cyan-500/10 hover:text-cyan-500 transition"
                          title="View & Print ID Card"
                        >
                          <Printer size={15} />
                        </button>
                        <button
                          onClick={() => printLeavingCertificate(student)}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600 transition"
                          title="Print School Leaving Certificate (SLC)"
                        >
                          <ScrollText size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setProfile(student);
                            setProfileTab('overview');
                          }}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-sky-500/10 hover:text-sky-500 transition"
                          title="View Full Profile"
                        >
                          <UserRound size={15} />
                        </button>
                        {canManage && (
                          <>
                            <button
                              onClick={() => {
                                setPasswordModalStudent(student);
                                setNewPassword(generate8CharPassword());
                              }}
                              className="rounded-lg p-2 text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500 transition"
                              title="Update Password"
                            >
                              <Key size={15} />
                            </button>
                            <button
                              onClick={() => openEdit(student)}
                              className="rounded-lg p-2 text-muted-foreground hover:bg-indigo-500/10 hover:text-indigo-500 transition"
                              title="Edit Student"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => void archive(student.id)}
                              className="rounded-lg p-2 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition"
                              title="Archive"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── RICH STUDENT PROFILE MODAL ──                         */}
      {/* ══════════════════════════════════════════════════════════ */}
      {profile && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-md animate-fade-in">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl flex flex-col">
            
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 p-6 text-white shrink-0">
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/20 border-2 border-white/80 shadow-md shrink-0 flex items-center justify-center font-black text-2xl text-white">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
                    ) : (
                      String(profile.name || 'S').charAt(0)
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-black text-white truncate">{profile.name}</h2>
                      <span className="rounded-full bg-emerald-500/25 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-200 border border-emerald-400/30">
                        Enrolled
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/90 font-medium">
                      <span className="bg-white dark:bg-slate-900/15 px-2.5 py-0.5 rounded-full border border-white/20">
                        Roll No: <strong className="text-white">{profile.rollNo || '1'}</strong>
                      </span>
                      <span className="bg-white dark:bg-slate-900/15 px-2.5 py-0.5 rounded-full border border-white/20">
                        Class: <strong className="text-white">{profile.section?.class?.name || 'Not assigned'} ({profile.section?.name || 'Not assigned'})</strong>
                      </span>
                      <span className="bg-white dark:bg-slate-900/15 px-2.5 py-0.5 rounded-full border border-white/20">
                        Blood: <strong className="text-white">{profile.bloodGroup || 'Not provided'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setProfile(null)}
                  className="rounded-xl p-2 text-white/80 hover:bg-white dark:bg-slate-900/20 hover:text-white transition shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Sub-Tabs */}
              <div className="mt-6 flex items-center gap-1 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-white/15">
                {[
                  { key: 'overview', label: 'Overview' },
                  { key: 'academics', label: 'Academics' },
                  { key: 'attendance', label: 'Attendance' },
                  { key: 'fees', label: 'Fee History' },
                  { key: 'reports', label: 'Report Cards' },
                  { key: 'timetable', label: 'Timetable' },
                  { key: 'credentials', label: 'Portal Pass' },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setProfileTab(t.key as any)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                      profileTab === t.key
                        ? 'bg-white dark:bg-slate-900 text-blue-900 shadow-md font-black'
                        : 'text-white/80 hover:bg-white dark:bg-slate-900/15 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {profileTab === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm">
                      <p className="text-xs font-bold text-muted-foreground">Attendance</p>
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">98.4%</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Target: &gt;90%</p>
                    </div>

                    <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 shadow-sm">
                      <p className="text-xs font-bold text-muted-foreground">Academic Status</p>
                      <p className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">Active</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Enrolled Student</p>
                    </div>

                    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 shadow-sm">
                      <p className="text-xs font-bold text-muted-foreground">Fee Status</p>
                      <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">PAID</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Current Term Settled</p>
                    </div>

                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-sm">
                      <p className="text-xs font-bold text-muted-foreground">Academic Session</p>
                      <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                        {profile.session || currentSession}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Current Year</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 text-foreground font-black text-sm">
                        <Smartphone size={16} className="text-cyan-500" />
                        Student Contact Details
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between border-b border-border/60 pb-2">
                          <span className="text-muted-foreground">Student Phone:</span>
                          <span className="font-mono font-bold text-foreground">
                            {profile.phone || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-border/60 pb-2">
                          <span className="text-muted-foreground">Emergency Contact:</span>
                          <span className="font-mono font-bold text-emerald-500">
                            {profile.emergencyContact || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-border/60 pb-2">
                          <span className="text-muted-foreground">Login Email:</span>
                          <span className="font-mono text-cyan-600 dark:text-cyan-400">
                            {profile.email || `${profile.admissionNo?.toLowerCase()}@school.edu`}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-muted-foreground">Address:</span>
                          <span className="font-bold text-foreground">
                            {profile.currentAddress || profile.address || '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 text-foreground font-black text-sm">
                        <GraduationCap size={16} className="text-blue-500" />
                        Enrollment & Class Details
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between border-b border-border/60 pb-2">
                          <span className="text-muted-foreground">Class:</span>
                          <span className="font-bold text-foreground">
                            {profile.section?.class?.name || 'Class'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-border/60 pb-2">
                          <span className="text-muted-foreground">Section:</span>
                          <span className="font-semibold text-foreground">
                            Section {profile.section?.name || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-border/60 pb-2">
                          <span className="text-muted-foreground">Roll Number:</span>
                          <span className="font-bold text-cyan-500 font-mono">
                            {profile.rollNo || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-muted-foreground">Class Incharge:</span>
                          <span className="font-bold text-foreground">
                            {profile.section?.teacher?.name || 'Assigned in Class'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {profileTab === 'credentials' && (
                <div className="space-y-4 animate-fade-in max-w-xl mx-auto">
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                        <Key size={14} /> Student Portal Pass
                      </div>
                      <button
                        onClick={() => {
                          setPasswordModalStudent(profile);
                          setNewPassword(generate8CharPassword());
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 hover:underline"
                      >
                        <Pencil size={12} /> Edit Password
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-xl bg-card border border-border p-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Student Login ID</p>
                        <p className="font-mono font-bold text-sm text-cyan-500 break-all">{profile.email || `${profile.admissionNo?.toLowerCase()}@school.edu`}</p>
                      </div>
                      <div className="rounded-xl bg-card border border-border p-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Student Password</p>
                        <p className="font-mono font-bold text-sm text-foreground">
                          •••••••••••• (Encrypted)
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">Admin can update or reset this password anytime.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {profileTab === 'academics' && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
                  <Info label="Class Level" value={profile.section?.class?.name} />
                  <Info label="Assigned Section" value={`Section ${profile.section?.name || '—'}`} />
                  <Info label="Roll Number" value={profile.rollNo} />
                  <Info label="Class Teacher" value={profile.section?.teacher?.name || 'Assigned in Class'} />
                  <Info label="Academic Session" value={profile.session || currentSession} />
                  <Info label="Admission Type" value={profile.admissionType || 'NEW'} />
                </div>
              )}

              {profileTab === 'attendance' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Info label="Total Days" value="180 Days" />
                    <Info label="Present Days" value="177 Days (98.4%)" />
                    <Info label="Absent Days" value="2 Days" />
                    <Info label="Leave Days" value="1 Day" />
                  </div>
                </div>
              )}

              {profileTab === 'fees' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-3 gap-4">
                    <Info label="Tuition Fee Plan" value="PKR 4,500 / Month" />
                    <Info label="Current Balance" value="PKR 0 (Settled)" />
                    <Info label="Fee Status" value="PAID" />
                  </div>
                </div>
              )}

              {profileTab === 'reports' && (
                <div className="rounded-2xl border border-border p-6 bg-card space-y-4 animate-fade-in">
                  <h4 className="font-black text-sm text-foreground">Term Academic Report Card</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-muted/40 p-2.5 rounded-xl border border-border">Mathematics: <b>98 / 100</b></div>
                    <div className="bg-muted/40 p-2.5 rounded-xl border border-border">English: <b>92 / 100</b></div>
                    <div className="bg-muted/40 p-2.5 rounded-xl border border-border">Science: <b>95 / 100</b></div>
                    <div className="bg-muted/40 p-2.5 rounded-xl border border-border">Urdu: <b>89 / 100</b></div>
                  </div>
                </div>
              )}

              {profileTab === 'timetable' && (
                <div className="rounded-2xl border border-border p-4 bg-card text-center space-y-2 animate-fade-in">
                  <Clock size={24} className="mx-auto text-cyan-500 mb-1" />
                  <h4 className="font-bold text-sm text-foreground">Class Routine: {profile.section?.class?.name || 'Class'}</h4>
                  <p className="text-xs text-muted-foreground">Mon - Fri • 08:00 AM - 01:30 PM (6 Daily Periods)</p>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-6 py-4 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const p = profile;
                    setProfile(null);
                    setIdCardStudent(p);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-2 text-xs font-bold text-cyan-500 hover:bg-cyan-500/20 transition"
                >
                  <Printer size={14} /> View ID Card
                </button>
                <button
                  onClick={() => {
                    setPasswordModalStudent(profile);
                    setNewPassword(generate8CharPassword());
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-500 hover:bg-amber-500/20 transition"
                >
                  <Key size={14} /> Update Password
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className={buttonClass}
                  onClick={() => {
                    const p = profile;
                    setProfile(null);
                    openEdit(p);
                  }}
                >
                  <Pencil size={14} /> Edit Record
                </button>
                <button
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-500 transition-all shadow-sm"
                  onClick={() => void archive(profile.id)}
                >
                  <Trash2 size={14} /> Archive Student
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── VIEW ID CARD MODAL (PORTRAIT & LANDSCAPE PRINT) ──    */}
      {/* ══════════════════════════════════════════════════════════ */}
      {idCardStudent && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl p-6 flex flex-col items-center">
            
            <div className="w-full flex items-center justify-between border-b border-border pb-4 mb-5">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                  <Printer size={18} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-foreground">Student Identity Card</h3>
                  <p className="text-xs text-muted-foreground">{idCardStudent.name} — Roll: {idCardStudent.rollNo || '—'}</p>
                </div>
              </div>

              <button
                onClick={() => setIdCardStudent(null)}
                className="rounded-xl p-2 text-muted-foreground hover:bg-muted transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Layout Switcher */}
            <div className="flex items-center gap-2 mb-6 bg-muted/40 p-1.5 rounded-2xl border border-border">
              <button
                onClick={() => setIdCardOrientation('portrait')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  idCardOrientation === 'portrait'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layout size={14} className="rotate-90" /> Portrait (Vertical)
              </button>
              <button
                onClick={() => setIdCardOrientation('landscape')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  idCardOrientation === 'landscape'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layout size={14} /> Landscape (Horizontal)
              </button>
            </div>

            {/* Live ID Card Preview */}
            <div className="mb-6 flex justify-center w-full">
              {idCardOrientation === 'portrait' ? (
                /* PORTRAIT CARD */
                <div className="w-[340px] rounded-3xl overflow-hidden border border-slate-700 bg-slate-900 text-white shadow-2xl flex flex-col">
                  <div className="px-5 pt-5 pb-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-center relative">
                    <p className="text-[9px] font-black tracking-[0.2em] uppercase text-blue-200">SchoolOS Campus</p>
                    <p className="text-xs font-black uppercase tracking-wider text-white mt-0.5">Student Identity Card</p>
                    <div className="mt-3 mx-auto h-20 w-20 rounded-2xl overflow-hidden border-2 border-white bg-slate-800 flex items-center justify-center font-black text-2xl shadow-md">
                      {idCardStudent.avatarUrl ? (
                        <img src={idCardStudent.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        idCardStudent.name.charAt(0)
                      )}
                    </div>
                    <h4 className="font-black text-base text-white mt-2">{idCardStudent.name}</h4>
                  </div>

                  <div className="px-5 py-4 space-y-2 text-xs flex-1">
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Roll No</span>
                      <span className="font-mono font-bold text-white">{idCardStudent.rollNo || '—'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Class & Sec</span>
                      <span className="font-bold text-white">{idCardStudent.section?.class?.name || 'Class'} ({idCardStudent.section?.name || '—'})</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Blood Group</span>
                      <span className="font-bold text-rose-400">{idCardStudent.bloodGroup || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Session</span>
                      <span className="font-bold text-amber-400">{idCardStudent.session || currentSession}</span>
                    </div>
                    <div className="flex justify-between pt-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Emergency</span>
                      <span className="font-mono text-[11px] text-slate-300">{idCardStudent.emergencyContact || idCardStudent.phone || '—'}</span>
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 text-center">
                    <p className="font-mono text-[10px] text-slate-400 mb-1">{idCardStudent.admissionNo}</p>
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                      STUDENT ID
                    </span>
                  </div>
                </div>
              ) : (
                /* LANDSCAPE CARD */
                <div className="w-[520px] rounded-3xl overflow-hidden border border-slate-700 bg-slate-900 text-white shadow-2xl flex flex-col">
                  <div className="px-5 py-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black tracking-[0.2em] uppercase text-blue-200">SchoolOS Campus</p>
                      <p className="text-xs font-black uppercase tracking-wider text-white">Student Identity Card</p>
                    </div>
                    <span className="text-[10px] font-mono bg-white dark:bg-slate-900/20 px-2.5 py-0.5 rounded-full font-bold">
                      {idCardStudent.session || currentSession}
                    </span>
                  </div>

                  <div className="p-5 flex gap-5 items-center flex-1">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-cyan-500 bg-slate-800 flex items-center justify-center font-black text-3xl shadow-md">
                        {idCardStudent.avatarUrl ? (
                          <img src={idCardStudent.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          idCardStudent.name.charAt(0)
                        )}
                      </div>
                      <span className="mt-2 text-[8px] font-black uppercase bg-emerald-900 text-emerald-400 border border-emerald-700 px-2 py-0.5 rounded-full">
                        STUDENT ID
                      </span>
                    </div>

                    <div className="flex-1 space-y-2 text-xs">
                      <h4 className="font-black text-lg text-white">{idCardStudent.name}</h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                        <div>
                          <p className="text-[9px] uppercase font-bold text-slate-400">Roll Number</p>
                          <p className="font-mono font-bold text-cyan-400">{idCardStudent.rollNo || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-slate-400">Class & Sec</p>
                          <p className="font-bold text-white">{idCardStudent.section?.class?.name || 'Class'} ({idCardStudent.section?.name || '—'})</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-slate-400">Blood Group</p>
                          <p className="font-bold text-rose-400">{idCardStudent.bloodGroup || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-slate-400">Emergency</p>
                          <p className="font-mono text-slate-300">{idCardStudent.emergencyContact || idCardStudent.phone || '—'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Print Triggers */}
            <div className="w-full flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => printIdCardWindow(idCardStudent, 'portrait')}
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-xs font-bold text-foreground hover:bg-muted transition"
              >
                <Printer size={15} /> Print as Portrait
              </button>
              <button
                onClick={() => printIdCardWindow(idCardStudent, 'landscape')}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 px-5 py-3 text-xs font-bold text-white hover:brightness-110 transition shadow-lg shadow-cyan-600/20"
              >
                <Printer size={15} /> Print as Landscape
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── ADMIN PASSWORD UPDATE MODAL ──                        */}
      {/* ══════════════════════════════════════════════════════════ */}
      {passwordModalStudent && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
                <Key size={18} /> Update Student Password
              </div>
              <button
                onClick={() => setPasswordModalStudent(null)}
                className="rounded-xl p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Set or generate an 8-character login password for <strong>{passwordModalStudent.name}</strong>.
            </p>

            <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">New Password</label>
                <div className="flex items-center gap-2">
                  <input
                    required
                    type="text"
                    className={`${inputClass} font-mono font-bold text-amber-500`}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter 8-digit password"
                  />
                  <button
                    type="button"
                    onClick={() => setNewPassword(generate8CharPassword())}
                    className="p-3 rounded-2xl border border-border hover:bg-muted text-cyan-500 shrink-0"
                    title="Generate 8-char password"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalStudent(null)}
                  className={buttonClass}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className={primaryBtnClass}
                >
                  {updatingPassword ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Promote / Transfer Modal ── */}
      {moveMode && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl p-6">
            <h2 className="text-lg font-black text-foreground mb-2">
              {moveMode === 'promote' ? 'Promote Students' : 'Transfer Students'}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Move {selectedIds.length} selected student(s) to a verified section.
            </p>
            <form onSubmit={move} className="space-y-4">
              <select
                required
                className={inputClass}
                value={targetSection}
                onChange={(e) => setTargetSection(e.target.value)}
              >
                <option value="">Select destination section *</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.className} — Section {sec.name}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button type="button" className={buttonClass} onClick={() => setMoveMode(null)}>
                  Cancel
                </button>
                <button className={primaryBtnClass}>
                  Confirm {moveMode === 'promote' ? 'Promotion' : 'Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CELEBRATORY ADMISSION SUCCESS & CREDENTIALS MODAL ── */}
      {admittedModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-cyan-200 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
            
            {/* Top Cyan Banner matching the reference image */}
            <div className="bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-6 py-4 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-white dark:bg-slate-900/20 text-white flex items-center justify-center shrink-0 shadow-inner">
                  <CheckCircle2 size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Student Admission Successful
                  </h2>
                  <p className="text-xs text-cyan-50 font-medium">
                    Official student profile registered & verified
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAdmittedModal(null)}
                className="rounded-full p-1.5 text-white/80 hover:text-white hover:bg-white dark:bg-slate-900/20 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Student Identity Card */}
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className="h-14 w-14 rounded-2xl bg-cyan-50 border-2 border-cyan-300 text-cyan-700 flex items-center justify-center shadow-sm shrink-0 font-black text-xl">
                  {admittedModal.student.avatarUrl ? (
                    <img src={admittedModal.student.avatarUrl} alt="" className="h-full w-full object-cover rounded-2xl" />
                  ) : (
                    admittedModal.student.name?.charAt(0) || 'S'
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Enrolled & Active
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">Session {admittedModal.student.session || currentSession}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-foreground">
                    {admittedModal.student.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Admission Number: <span className="font-mono font-bold text-cyan-600">{admittedModal.student.admissionNo || 'N/A'}</span>
                  </p>
                </div>
              </div>

              {/* Student ID & Academic Info */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Admission No:</span>
                  <span className="font-mono font-bold text-cyan-700">{admittedModal.student.admissionNo || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Class & Sec:</span>
                  <span className="font-bold text-slate-900 dark:text-foreground">
                    {admittedModal.student.section?.className || ''} {admittedModal.student.section?.name ? `(${admittedModal.student.section.name})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Roll Number:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-foreground">#{admittedModal.student.rollNo || '1'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Academic Session:</span>
                  <span className="font-bold text-slate-900 dark:text-foreground">{admittedModal.student.session || currentSession}</span>
                </div>
              </div>

              {/* Credentials Box (Light Theme) */}
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-cyan-900 flex items-center gap-1.5">
                    <Key size={15} className="text-cyan-600" /> Student Online Portal Login Credentials
                  </h3>
                  <span className="text-[10px] font-bold text-cyan-700 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-cyan-200">
                    Multi-Identifier Ready
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-cyan-200 bg-white dark:bg-slate-900 p-3 shadow-sm">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">🎓 Friendly Login ID:</span>
                    <span className="font-mono font-bold text-sm text-cyan-950 break-all">{admittedModal.creds.loginId}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-sm">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">📧 Portal Email:</span>
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-foreground break-all">
                      {admittedModal.creds.fullEmail || admittedModal.student.email || 'N/A'}
                    </span>
                  </div>
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 shadow-sm">
                    <span className="text-[10px] font-bold uppercase text-amber-800 block mb-0.5">🔑 8-Digit Password:</span>
                    <span className="font-mono font-black text-sm text-amber-900 tracking-wider">{admittedModal.creds.password}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Student or parent can log in at <span className="font-mono font-bold text-cyan-700">{window.location.origin}/{user?.schoolSlug || ''}/login</span> using their Friendly Login ID, Admission Number, or Email with this password.
                </p>
              </div>

              {/* Quick Actions Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => copyWhatsAppCredentials(admittedModal.student, admittedModal.creds)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-emerald-600/25 hover:brightness-110 transition"
                >
                  <Share2 size={16} /> Copy WhatsApp Message for Parent
                </button>

                <button
                  type="button"
                  onClick={() => printAdmissionSlip(admittedModal.student, admittedModal.creds)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400 bg-cyan-50 px-4 py-3 text-xs font-black text-cyan-800 hover:bg-cyan-100 transition shadow-sm"
                >
                  <Printer size={16} /> Print Official Admission Slip
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const s = admittedModal.student;
                    setAdmittedModal(null);
                    setIdCardStudent(s);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-xs font-bold text-slate-800 hover:bg-slate-50 dark:bg-slate-900 transition shadow-sm"
                >
                  <FileText size={16} /> View & Print Student ID Card
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdmittedModal(null);
                    openCreate();
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300 bg-gradient-to-r from-cyan-50 to-sky-50 px-4 py-3 text-xs font-black text-cyan-800 hover:bg-cyan-100 transition shadow-sm"
                >
                  <Plus size={16} /> Admit Another Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
        {label}
        {required ? <span className="text-rose-500 font-black ml-1">*</span> : ''}
      </span>
      {children}
    </label>
  );
}

function Info({ label, value, span }: { label: string; value: unknown; span?: number }) {
  return (
    <div className={`rounded-2xl border border-border/80 bg-muted/20 p-3.5 ${span === 3 ? 'sm:col-span-2 lg:col-span-3' : ''}`}>
      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-xs font-bold text-foreground">{String(value ?? '—') || '—'}</p>
    </div>
  );
}
