import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Camera, GraduationCap, Loader2, Pencil, Plus, Printer, RefreshCw, Search, Trash2,
  UserRound, Users, X, MapPin, User,
  Eye, EyeOff, Check, HeartPulse, FileText, Key, Clock, Sparkles, Layout, Smartphone
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
  bFormNumber: string;
  email: string;
  phone: string;
  emergencyContact: string;
  password: string;
  admissionType: 'NEW' | 'TRANSFER';
  sectionId: string;
  classId: string;
  session: string;
  previousSchool: string;
  previousClass: string;
  currentAddress: string;
  permanentAddress: string;
  transportRequired: boolean;
  hostelRequired: boolean;
  avatarUrl: string;
};

const inputClass = 'w-full rounded-2xl border border-slate-200 dark:border-border/80 bg-white dark:bg-background/90 px-4 py-3 text-sm text-foreground outline-none shadow-sm transition placeholder:text-muted-foreground/60 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 font-medium';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-3.5 py-2 text-sm font-semibold transition hover:bg-accent';
const primaryBtnClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-600/20 hover:brightness-110 transition disabled:opacity-60';
const currentSession = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
const religions = ['Muslim', 'Christian', 'Hindu', 'Sikh', 'Buddhist', 'Other'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function generate8CharPassword() {
  const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';
  let pass = '';
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

const emptyForm = (): FormState => ({
  rollNo: '',
  name: '',
  dateOfBirth: '',
  gender: 'MALE',
  bloodGroup: 'O+',
  religion: 'Muslim',
  bFormNumber: '',
  email: '',
  phone: '',
  emergencyContact: '',
  password: generate8CharPassword(),
  admissionType: 'NEW',
  classId: '',
  sectionId: '',
  session: currentSession,
  previousSchool: '',
  previousClass: '',
  currentAddress: '',
  permanentAddress: '',
  transportRequired: false,
  hostelRequired: false,
  avatarUrl: '',
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

  // Success Banner after admission
  const [lastAdmitted, setLastAdmitted] = useState<{ student: Student; creds: { loginId: string; password: string } } | null>(null);

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

  const load = async () => {
    setLoading(true);
    try {
      const [studentRes, classRes, sectionRes] = await Promise.all([
        apiClient.get('/people/students'),
        apiClient.get('/classes').catch(() => ({ data: [] })),
        apiClient.get('/classes/sections').catch(() => ({ data: [] })),
      ]);
      setStudents(Array.isArray(studentRes.data) ? studentRes.data : []);
      setClasses(Array.isArray(classRes.data) ? classRes.data : []);
      setSections(Array.isArray(sectionRes.data) ? sectionRes.data : []);
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
    const matchedSection = sections.find((s) => s.id === student.sectionId);

    setForm({
      ...emptyForm(),
      name: student.name || '',
      rollNo: student.rollNo || '',
      gender: student.gender || 'MALE',
      bloodGroup: student.bloodGroup || 'O+',
      religion: student.religion || 'Muslim',
      classId: matchedSection?.classId || student.section?.classId || '',
      sectionId: student.sectionId || '',
      currentAddress: student.currentAddress || student.address || '',
      permanentAddress: student.permanentAddress || '',
      phone: formatPhone(student.phone || ''),
      emergencyContact: formatPhone(student.emergencyContact || ''),
      bFormNumber: formatCnic(student.bFormNumber || ''),
      avatarUrl: student.avatarUrl || '',
      email: student.email || '',
      password: '',
      session: student.session || currentSession,
      admissionType: student.admissionType === 'TRANSFER' ? 'TRANSFER' : 'NEW',
      previousSchool: student.previousSchool || '',
      previousClass: student.previousClass || '',
      transportRequired: Boolean(student.transportRequired),
      hostelRequired: Boolean(student.hostelRequired),
      dateOfBirth: student.dateOfBirth ? String(student.dateOfBirth).slice(0, 10) : '',
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

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.sectionId) {
      return toast.error('Student name and Section assignment are required');
    }
    if (form.admissionType === 'TRANSFER' && (!form.previousSchool.trim() || !form.previousClass.trim())) {
      return toast.error('Previous School and Previous Class are required for transfer students');
    }
    if (form.bFormNumber && (!cnicValid(form.bFormNumber) || form.bFormNumber.replace(/\D/g, '').length !== 13)) {
      return toast.error('Student CNIC / B-Form must contain exactly 13 digits: 35202-1234567-1');
    }
    if (form.phone && (!phoneValid(form.phone) || form.phone.replace(/\D/g, '').length !== 11)) {
      return toast.error('Student Mobile must contain 11 digits: 0300-1234567');
    }
    if (form.emergencyContact && (!phoneValid(form.emergencyContact) || form.emergencyContact.replace(/\D/g, '').length !== 11)) {
      return toast.error('Emergency Contact must contain 11 digits: 0300-1234567');
    }
    if (!editing && (!form.password || form.password.trim().length < 6)) {
      return toast.error('Password must be at least 6 characters (8 characters auto-generated)');
    }

    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        rollNo: form.rollNo.trim() || undefined,
        sectionId: form.sectionId,
        gender: form.gender,
        bloodGroup: form.bloodGroup || undefined,
        religion: form.religion || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        phone: form.phone || undefined,
        studentMobile: form.phone || undefined,
        emergencyContact: form.emergencyContact || undefined,
        email: form.email.trim().toLowerCase() || undefined,
        bFormNumber: form.bFormNumber || undefined,
        currentAddress: form.currentAddress.trim() || undefined,
        permanentAddress: form.permanentAddress.trim() || undefined,
        avatarUrl: form.avatarUrl || undefined,
        session: form.session || currentSession,
        admissionType: form.admissionType,
        previousSchool: form.previousSchool || undefined,
        previousClass: form.previousClass || undefined,
        transportRequired: form.transportRequired,
        hostelRequired: form.hostelRequired,
      };

      if (!editing) {
        payload.password = form.password.trim();
        const response = await apiClient.post('/people/students', payload);
        const createdCredentials = response.data?.credentials;
        const createdStudent = response.data?.student;
        if (createdCredentials && createdStudent) {
          setLastAdmitted({ student: createdStudent, creds: createdCredentials });
        }
        toast.success(`✅ Student admitted successfully`);
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
    const admNo = student.admissionNo || 'ADM-0000';
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
      <div class="school-title">EduSphere Campus System</div>
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
          <span class="val">${student.gender || 'Male'} / ${student.bloodGroup || 'O+'}</span>
        </div>
        <div class="data-row" style="border-bottom:none">
          <span class="label">Emergency Mobile</span>
          <span class="val" style="font-family:monospace">${student.emergencyContact || student.phone || '—'}</span>
        </div>
      </div>
      <div class="footer-barcode">
        ${barSvg}
        <span class="stamp">✓ VERIFIED STUDENT</span>
      </div>
    ` : `
      <div class="land-content">
        <div class="land-left">
          <div class="photo-area">
            ${photo ? `<img src="${photo}" />` : student.name.charAt(0)}
          </div>
          <span class="stamp" style="margin-top:8px">✓ VERIFIED</span>
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
  // FULL PAGE ADD / EDIT STUDENT VIEW
  // ══════════════════════════════════════════════════════════════
  if (view === 'add') {
    return (
      <div className="w-full min-h-screen pb-20 space-y-6 max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-sky-500/5 to-card p-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center border border-cyan-500/25 shadow-inner">
                <GraduationCap size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    {editing ? 'UPDATE STUDENT PROFILE' : 'NEW STUDENT ADMISSION'}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">Session {form.session}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  {editing ? `Edit Record: ${editing.name}` : 'Student Registration'}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enter student credentials, academic classroom section, and portal login password.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setView('list')}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-2 text-sm font-bold text-foreground hover:bg-muted transition-all shadow-sm"
            >
              <ArrowLeft size={16} /> Back to Student List
            </button>
          </div>
        </div>

        {/* Full Page Admission Form */}
        <form onSubmit={save} className="space-y-6">
          
          {/* 1. STUDENT INFORMATION */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-cyan-500 mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              1. STUDENT PERSONAL INFORMATION
            </h3>
            
            <div className="rounded-2xl border border-border bg-muted/15 p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                
                {/* Photo Upload */}
                <div className="flex flex-col items-center gap-2 shrink-0 mx-auto md:mx-0">
                  <label className="relative flex h-36 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-cyan-500/40 bg-card shadow-inner hover:border-cyan-400 transition-all group">
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
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black uppercase tracking-wider transition-opacity">
                          Change
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground text-center p-2">
                        {compressing ? <Loader2 size={24} className="animate-spin text-cyan-500" /> : <Camera size={26} className="text-cyan-500" />}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">Student Photo</span>
                      </div>
                    )}
                  </label>
                  {form.avatarUrl ? (
                    <button
                      type="button"
                      onClick={() => update('avatarUrl', '')}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-400 uppercase tracking-wider"
                    >
                      Remove Photo
                    </button>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">JPG/PNG (Max 2MB)</span>
                  )}
                </div>

                {/* Right Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 w-full">
                  
                  <Field label="Student Full Name" required>
                    <input
                      required
                      className={inputClass}
                      placeholder="e.g. Muhammad Ali"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                    />
                  </Field>

                  {/* Class Selection */}
                  <Field label="Class Level" required>
                    <select
                      required
                      className={inputClass}
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
                      <option value="">Select Class *</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </Field>

                  {/* Section Assignment (Auto assigns Roll Number) */}
                  <Field label="Section Assignment" required>
                    <select
                      required
                      className={inputClass}
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

                  {/* Auto-Assigned Roll Number */}
                  <Field label="Roll Number (Auto-Generated with Class/Sec)">
                    <div className="relative">
                      <input
                        className={`${inputClass} font-mono font-bold text-cyan-600 dark:text-cyan-400`}
                        placeholder="e.g. 1, 2, 3..."
                        value={form.rollNo}
                        onChange={(e) => update('rollNo', e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-500 px-2 py-0.5 rounded-full border border-cyan-500/20 pointer-events-none">
                        Auto Roll No
                      </span>
                    </div>
                  </Field>

                  <Field label="Date of Birth">
                    <input
                      type="date"
                      className={inputClass}
                      value={form.dateOfBirth}
                      onChange={(e) => update('dateOfBirth', e.target.value)}
                    />
                  </Field>

                  <Field label="Gender" required>
                    <select
                      className={inputClass}
                      value={form.gender}
                      onChange={(e) => update('gender', e.target.value)}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </Field>

                  <Field label="Blood Group">
                    <select
                      className={inputClass}
                      value={form.bloodGroup}
                      onChange={(e) => update('bloodGroup', e.target.value)}
                    >
                      {bloodGroups.map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="B-Form / CNIC (Optional)">
                    <input
                      inputMode="numeric"
                      maxLength={15}
                      className={`${inputClass} font-mono`}
                      placeholder="35201-xxxxxxx-x"
                      value={form.bFormNumber}
                      onChange={(e) => update('bFormNumber', formatCnic(e.target.value))}
                    />
                  </Field>

                  <Field label="Religion">
                    <select
                      className={inputClass}
                      value={form.religion}
                      onChange={(e) => update('religion', e.target.value)}
                    >
                      {religions.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Student Mobile (Optional)">
                    <input
                      inputMode="numeric"
                      maxLength={12}
                      className={`${inputClass} font-mono`}
                      placeholder="0300-1234567"
                      value={form.phone}
                      onChange={(e) => update('phone', formatPhone(e.target.value))}
                    />
                  </Field>

                  <Field label="Emergency Contact Phone (Optional)">
                    <input
                      inputMode="numeric"
                      maxLength={12}
                      className={`${inputClass} font-mono`}
                      placeholder="0300-1234567"
                      value={form.emergencyContact}
                      onChange={(e) => update('emergencyContact', formatPhone(e.target.value))}
                    />
                  </Field>

                  <Field label="Student Login Email (Optional)">
                    <input
                      type="email"
                      className={inputClass}
                      placeholder="student@school.edu (Auto-created if empty)"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 8-CHARACTER AUTO-GENERATED LOGIN PASSWORD */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-cyan-500 mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              2. STUDENT PORTAL LOGIN CREDENTIALS
            </h3>

            <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/20 via-sky-950/10 to-card p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Student Login Password (8 Characters Auto-Generated)
                  </label>
                  <p className="text-[11px] text-muted-foreground mb-2">
                    Auto-generates an 8-character password for student portal access. Admin can customize or update anytime.
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={`${inputClass} font-mono font-bold tracking-wider text-amber-500 pr-10`}
                        placeholder="8-character password"
                        value={form.password}
                        onChange={(e) => update('password', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const generated = generate8CharPassword();
                        update('password', generated);
                        toast.success(`Generated 8-char password: ${generated}`);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-xs font-bold text-cyan-500 hover:bg-cyan-500/20 transition shrink-0"
                    >
                      <RefreshCw size={14} /> Re-Generate (8 Chars)
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-500 font-bold">
                    <Sparkles size={15} /> Instant Portal Activation
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Once saved, the student can log in using their student email / admission ID and this 8-character password. Admin can edit or reset this password at any time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. RESIDENTIAL ADDRESS */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-cyan-500 mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              3. RESIDENTIAL ADDRESS
            </h3>
            <div className="rounded-2xl border border-border bg-muted/15 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Current Residential Address">
                  <input
                    className={inputClass}
                    placeholder="House / Street / Area / City"
                    value={form.currentAddress}
                    onChange={(e) => update('currentAddress', e.target.value)}
                  />
                </Field>
                <Field label="Permanent Address">
                  <input
                    className={inputClass}
                    placeholder="Permanent Home Address"
                    value={form.permanentAddress}
                    onChange={(e) => update('permanentAddress', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setView('list')}
              className={buttonClass}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={primaryBtnClass}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {editing ? 'Update Student Record' : 'Complete Admission'}
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
                        {student.bloodGroup || 'O+'}
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
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden bg-white/20 border-2 border-white/80 shadow-md shrink-0 flex items-center justify-center font-black text-2xl text-white">
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
                      <span className="bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
                        Roll No: <strong className="text-white">{profile.rollNo || '1'}</strong>
                      </span>
                      <span className="bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
                        Class: <strong className="text-white">{profile.section?.class?.name || 'Class'} ({profile.section?.name || 'A'})</strong>
                      </span>
                      <span className="bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
                        Blood: <strong className="text-white">{profile.bloodGroup || 'O+'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setProfile(null)}
                  className="rounded-xl p-2 text-white/80 hover:bg-white/20 hover:text-white transition shrink-0"
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
                        ? 'bg-white text-blue-900 shadow-md font-black'
                        : 'text-white/80 hover:bg-white/15 hover:text-white'
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
                    <p className="text-[9px] font-black tracking-[0.2em] uppercase text-blue-200">EduSphere Campus</p>
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
                      <span className="font-bold text-rose-400">{idCardStudent.bloodGroup || 'O+'}</span>
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
                      ✓ VERIFIED STUDENT
                    </span>
                  </div>
                </div>
              ) : (
                /* LANDSCAPE CARD */
                <div className="w-[520px] rounded-3xl overflow-hidden border border-slate-700 bg-slate-900 text-white shadow-2xl flex flex-col">
                  <div className="px-5 py-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black tracking-[0.2em] uppercase text-blue-200">EduSphere Campus</p>
                      <p className="text-xs font-black uppercase tracking-wider text-white">Student Identity Card</p>
                    </div>
                    <span className="text-[10px] font-mono bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
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
                        ✓ VERIFIED
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
                          <p className="font-bold text-rose-400">{idCardStudent.bloodGroup || 'O+'}</p>
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
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-muted-foreground">
        {label}
        {required ? ' *' : ''}
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
