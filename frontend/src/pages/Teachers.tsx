import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Award, BookOpen, Briefcase, Camera, Check, CheckCircle,
  Clock, DollarSign, Eye, EyeOff, FileText, Fingerprint,
  GraduationCap, Key, Loader2, Mail, MapPin, Pencil, Phone, Plus, Printer,
  RefreshCw, Search, ShieldCheck, Sparkles, Trash2, User,
  UserCheck, Users, X, Calendar, ArrowUpRight, ChevronRight,
  Layers, BookCheck, Wallet, Receipt, Layout, Smartphone
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

interface Teacher {
  id: string;
  employeeNo: string;
  name: string;
  email: string;
  phone?: string | null;
  gender?: string | null;
  qualification?: string | null;
  experience?: number | null;
  salary?: number | null;
  joiningDate?: string;
  isActive?: boolean;
  specialization?: string | null;
  dateOfBirth?: string | null;
  cnic?: string | null;
  address?: string | null;
  bloodGroup?: string | null;
  avatarUrl?: string | null;
  sectionTeacher?: Array<{
    id: string;
    name: string;
    class: { id: string; name: string };
    _count?: { students: number };
  }>;
  classSubjects?: Array<{
    id: string;
    class: { id: string; name: string };
    subject: { id: string; name: string; code?: string };
  }>;
  timetables?: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string | null;
    subject: { id: string; name: string; code?: string };
    section: { id: string; name: string; class: { id: string; name: string } };
  }>;
  payrolls?: Array<{
    id: string;
    month: number;
    year: number;
    basicSalary: number;
    allowances: number;
    deductions: number;
    netSalary: number;
    isPaid: boolean;
    paidDate?: string | null;
  }>;
  attendances?: Array<{
    id: string;
    date: string;
    status: string;
    remarks?: string | null;
  }>;
}

interface SchoolClass {
  id: string;
  name: string;
  sections?: Array<{ id: string; name: string; teacherId?: string | null }>;
  subjects?: Array<{ id: string; subject: { id: string; name: string; code?: string } }>;
}

interface SchoolSubject {
  id: string;
  name: string;
  code?: string | null;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const QUALIFICATION_CATEGORIES = [
  {
    category: '1. Matriculation & Intermediate (Secondary)',
    options: [
      'Matriculation / SSC (Science)',
      'Matriculation / SSC (Arts / General)',
      'O-Levels (Cambridge / UK Equivalent)',
      'Intermediate / F.Sc (Pre-Medical)',
      'Intermediate / F.Sc (Pre-Engineering)',
      'Intermediate / ICS (Computer Science)',
      'Intermediate / I.Com (Commerce)',
      'Intermediate / F.A (Arts / Humanities)',
      'A-Levels (Cambridge / UK Equivalent)',
    ],
  },
  {
    category: '2. Graduation & Bachelor Degrees (14 / 16 Years)',
    options: [
      'B.A (Bachelor of Arts - 14 Years)',
      'B.Sc (Bachelor of Science - 14 Years)',
      'B.Com (Bachelor of Commerce - 14 Years)',
      'Associate Degree Program (ADP - 2 Years)',
      'BS (4 Years) - Computer Science / IT / SE',
      'BS (4 Years) - Mathematics / Physics / Chemistry',
      'BS (4 Years) - Biology / Zoology / Botany',
      'BS (4 Years) - English Literature & Linguistics',
      'BS (4 Years) - Urdu & Islamic Studies',
      'BS (4 Years) - Business Administration (BBA)',
      'B.Ed (1.5 / 2.5 / 4 Years - Education)',
    ],
  },
  {
    category: '3. Master & Postgraduate Degrees (16 / 18 Years)',
    options: [
      'M.Sc (Master of Science - 16 Years)',
      'M.A (Master of Arts - 16 Years)',
      'M.Com / MBA (Commerce & Business)',
      'MCS / MIT (Computer Science & IT)',
      'M.Ed (Master of Education)',
      'MS / M.Phil (18 Years Higher Degree)',
    ],
  },
  {
    category: '4. Doctorate, Professional & Equivalent',
    options: [
      'PhD / Doctorate',
      'Dars-e-Nizami / Shahadat-ul-Almiya (Equivalent)',
      'Diploma in Education / DAE / CT / PTC',
      'Montessori & Early Childhood Diploma',
      'Other Equivalent Qualification',
    ],
  },
];

export const SPECIALIZATION_CATEGORIES = [
  {
    category: 'Primary & General Subjects',
    options: [
      'General Subjects (Primary & Middle)',
      'Montessori & Early Childhood Education (ECE)',
      'General Science (Junior Wing)',
      'Social Studies & Geography',
    ],
  },
  {
    category: 'Languages & Humanities',
    options: [
      'English Language & Literature',
      'Urdu Language & Literature',
      'Islamic Studies / Islamiyat',
      'Nazra Quran / Hifz / Arabic',
      'Pakistan Studies & History',
    ],
  },
  {
    category: 'Sciences & Mathematics',
    options: [
      'Mathematics (Primary / Middle / Secondary)',
      'Physics (Secondary / Higher Secondary)',
      'Chemistry (Secondary / Higher Secondary)',
      'Biology / Botany / Zoology',
      'General Science & Environmental Studies',
    ],
  },
  {
    category: 'Computer Science, Commerce & Arts',
    options: [
      'Computer Science & Information Technology',
      'Commerce, Accounting & Economics',
      'Physical Education, Sports & Drill',
      'Fine Arts, Drawing & Calligraphy',
      'Library & Lab Incharge',
      'Other Specialized Discipline',
    ],
  },
];

function generate8CharPassword() {
  const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';
  let pass = '';
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

const initialForm = () => ({
  name: '',
  email: '',
  employeeNo: '',
  phone: '',
  gender: 'MALE',
  qualification: 'M.Sc (Master of Science - 16 Years)',
  experience: '3',
  salary: '45000',
  password: generate8CharPassword(),
  specialization: 'General Subjects (Primary & Middle)',
  cnic: '',
  address: '',
  dateOfBirth: '',
  bloodGroup: 'A+',
  avatarUrl: '',
});

const phoneFormat = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits.length <= 4 ? digits : `${digits.slice(0, 4)}-${digits.slice(4)}`;
};

const cnicFormat = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
};

const money = (value?: number | null) => (value == null ? '—' : `PKR ${Number(value).toLocaleString('en-PK')}`);

const inputStyle = 'w-full rounded-2xl border border-slate-200 dark:border-border/80 bg-white dark:bg-background/90 px-4 py-3 text-sm text-foreground outline-none shadow-sm transition placeholder:text-slate-500 dark:text-muted-foreground/60 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 font-medium';
const buttonStyle = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card/80 px-3.5 py-2 text-sm font-semibold transition hover:bg-accent';
const primaryBtnStyle = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-600/20 hover:brightness-110 transition disabled:opacity-60';

export default function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<SchoolSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSalary, setFilterSalary] = useState('');

  // Page View state: 'list' | 'add'
  const [view, setView] = useState<'list' | 'add'>('list');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState(initialForm());
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [profileTab, setProfileTab] = useState<'overview' | 'salary' | 'classes' | 'credentials' | 'attendance'>('overview');

  // Success Banner after admission
  const [lastRegistered, setLastRegistered] = useState<{ teacher: Teacher; creds: { loginId: string; password: string } } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // ID Card Viewer Modal State
  const [idCardTeacher, setIdCardTeacher] = useState<Teacher | null>(null);
  const [idCardOrientation, setIdCardOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Password Management Modal State
  const [passwordModalTeacher, setPasswordModalTeacher] = useState<Teacher | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Salary Modal
  const [salaryModal, setSalaryModal] = useState<{
    teacher: Teacher;
    month: number;
    year: number;
    basicSalary: number;
    allowances: number;
    deductions: number;
    remarks: string;
  } | null>(null);
  const [processingSalary, setProcessingSalary] = useState(false);

  // Section Incharge Modal
  const [assignSectionModal, setAssignSectionModal] = useState<{
    teacher: Teacher;
    sectionId: string;
  } | null>(null);
  const [assigningSection, setAssigningSection] = useState(false);

  // Assign Subject Modal
  const [assignSubjectModal, setAssignSubjectModal] = useState<{
    teacher: Teacher;
    classId: string;
    subjectId: string;
  } | null>(null);
  const [assigningSubject, setAssigningSubject] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const load = async () => {
    setLoading(true);
    try {
      const [teachersRes, classesRes, subjectsRes] = await Promise.all([
        apiClient.get('/people/teachers'),
        apiClient.get('/classes').catch(() => ({ data: [] })),
        apiClient.get('/classes/subjects').catch(() => ({ data: [] })),
      ]);
      setTeachers(Array.isArray(teachersRes.data) ? teachersRes.data : []);
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
      setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);

      if (selectedTeacher) {
        const fresh = (teachersRes.data || []).find((t: Teacher) => t.id === selectedTeacher.id);
        if (fresh) setSelectedTeacher(fresh);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to load teachers database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const isPaidThisMonth = (t: Teacher) => {
    return (t.payrolls || []).some((p) => p.month === currentMonth && p.year === currentYear && p.isPaid);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teachers.filter((t) => {
      const inchargeSection = t.sectionTeacher?.[0];
      const inchargeText = inchargeSection ? `${inchargeSection.class?.name} ${inchargeSection.name}`.toLowerCase() : '';
      const subjectsText = (t.classSubjects || []).map((cs) => `${cs.class?.name} ${cs.subject?.name}`).join(' ').toLowerCase();

      const matchesSearch =
        !q ||
        [t.name, t.email, t.employeeNo, t.phone, t.qualification, t.specialization, inchargeText, subjectsText].some((v) =>
          String(v ?? '').toLowerCase().includes(q)
        );

      const matchesStatus =
        !filterStatus ||
        (filterStatus === 'ACTIVE' && t.isActive !== false) ||
        (filterStatus === 'INACTIVE' && t.isActive === false) ||
        (filterStatus === 'INCHARGE' && (t.sectionTeacher?.length || 0) > 0);

      const isPaid = isPaidThisMonth(t);
      const matchesSalary =
        !filterSalary ||
        (filterSalary === 'PAID' && isPaid) ||
        (filterSalary === 'UNPAID' && !isPaid);

      return matchesSearch && matchesStatus && matchesSalary;
    });
  }, [teachers, query, filterStatus, filterSalary]);

  const inchargeCount = useMemo(() => teachers.filter((t) => (t.sectionTeacher?.length || 0) > 0).length, [teachers]);
  const paidCount = useMemo(() => teachers.filter((t) => isPaidThisMonth(t)).length, [teachers]);
  const totalPayroll = useMemo(() => teachers.reduce((sum, t) => sum + (t.salary || 0), 0), [teachers]);

  // Open Create in Full Screen
  const openCreate = () => {
    setEditing(null);
    const currentYear = new Date().getFullYear();
    const highestNum = teachers.reduce((max, t) => {
      const match = String(t.employeeNo || '').match(/(\d+)/g);
      const num = match ? parseInt(match[match.length - 1], 10) : 0;
      return Math.max(max, isNaN(num) ? 0 : num);
    }, 0);
    const nextNum = highestNum + 1;
    const nextEmployeeNo = `EMP-${currentYear}-${String(nextNum).padStart(3, '0')}`;
    const generatedPass = generate8CharPassword();

    setForm({
      ...initialForm(),
      employeeNo: nextEmployeeNo,
      password: generatedPass,
      email: '',
    });
    setView('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Edit in Full Screen
  const openEdit = (teacher: Teacher) => {
    setEditing(teacher);
    setForm({
      ...initialForm(),
      name: teacher.name || '',
      email: teacher.email || '',
      employeeNo: teacher.employeeNo || '',
      phone: teacher.phone ? phoneFormat(teacher.phone) : '',
      gender: teacher.gender || 'MALE',
      qualification: teacher.qualification || '',
      experience: teacher.experience ? String(teacher.experience) : '',
      salary: teacher.salary ? String(teacher.salary) : '',
      password: '',
      specialization: teacher.specialization || '',
      cnic: teacher.cnic ? cnicFormat(teacher.cnic) : '',
      address: teacher.address || '',
      dateOfBirth: teacher.dateOfBirth ? String(teacher.dateOfBirth).slice(0, 10) : '',
      bloodGroup: teacher.bloodGroup || 'A+',
      avatarUrl: teacher.avatarUrl || '',
    });
    setView('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, avatarUrl: reader.result as string }));
      toast.success('Teacher photo attached');
    };
    reader.readAsDataURL(file);
  };

  // Save Teacher in ONE Step
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Teacher Full Name is required');

    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        employeeNo: form.employeeNo.trim() || undefined,
        email: form.email.trim().toLowerCase() || undefined,
        phone: form.phone ? form.phone.replace(/\D/g, '') : undefined,
        gender: form.gender,
        qualification: form.qualification.trim() || undefined,
        experience: form.experience ? parseInt(form.experience, 10) : undefined,
        salary: form.salary ? parseFloat(form.salary) : undefined,
        specialization: form.specialization.trim() || undefined,
        cnic: form.cnic || undefined,
        address: form.address.trim() || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        bloodGroup: form.bloodGroup,
        avatarUrl: form.avatarUrl || undefined,
      };

      if (editing) {
        if (form.password && form.password.trim().length >= 6) {
          payload.password = form.password.trim();
        }
        await apiClient.patch(`/people/teachers/${editing.id}`, payload);
        toast.success(`Teacher record updated: ${form.name}`);
        setView('list');
      } else {
        payload.password = form.password && form.password.trim().length >= 6
          ? form.password.trim()
          : generate8CharPassword();
        const res = await apiClient.post('/people/teachers', payload);
        const createdTeacher = res.data?.teacher;
        const creds = res.data?.credentials;
        if (createdTeacher && creds) {
          setLastRegistered({ teacher: createdTeacher, creds });
        }
        toast.success(`✅ Teacher registered successfully — ${createdTeacher?.employeeNo || form.employeeNo}`);
        setView('list');
      }
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save teacher');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this teacher record?')) return;
    try {
      await apiClient.delete(`/people/teachers/${id}`);
      toast.success('Teacher record archived');
      if (selectedTeacher?.id === id) setSelectedTeacher(null);
      if (idCardTeacher?.id === id) setIdCardTeacher(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to archive teacher');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalTeacher || !newPassword || newPassword.trim().length < 6) {
      return toast.error('Please provide a valid password of at least 6 characters');
    }
    setUpdatingPassword(true);
    try {
      await apiClient.post(`/people/teachers/${passwordModalTeacher.id}/change-password`, {
        password: newPassword.trim(),
      });
      toast.success(`Password updated for ${passwordModalTeacher.name}`);
      setPasswordModalTeacher(null);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update teacher password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handlePaySalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryModal) return;
    setProcessingSalary(true);
    try {
      await apiClient.post(`/people/teachers/${salaryModal.teacher.id}/pay-salary`, {
        month: salaryModal.month,
        year: salaryModal.year,
        basicSalary: salaryModal.basicSalary,
        allowances: salaryModal.allowances,
        deductions: salaryModal.deductions,
        remarks: salaryModal.remarks,
      });
      toast.success(`Salary of ${money(salaryModal.basicSalary + salaryModal.allowances - salaryModal.deductions)} paid to ${salaryModal.teacher.name}`);
      setSalaryModal(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to process salary payment');
    } finally {
      setProcessingSalary(false);
    }
  };

  const handleAssignSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignSectionModal || !assignSectionModal.sectionId) {
      return toast.error('Please select a section');
    }
    setAssigningSection(true);
    try {
      await apiClient.post(`/people/teachers/${assignSectionModal.teacher.id}/assign-section`, {
        sectionId: assignSectionModal.sectionId,
      });
      toast.success(`Section incharge assigned to ${assignSectionModal.teacher.name}`);
      setAssignSectionModal(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to assign class incharge');
    } finally {
      setAssigningSection(false);
    }
  };

  const handleUnassignSection = async (sectionId: string) => {
    if (!confirm('Remove teacher as incharge of this section?')) return;
    try {
      await apiClient.delete(`/people/teachers/sections/${sectionId}`);
      toast.success('Section incharge unassigned');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to unassign section');
    }
  };

  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignSubjectModal || !assignSubjectModal.classId || !assignSubjectModal.subjectId) {
      return toast.error('Please select both Class and Subject');
    }
    setAssigningSubject(true);
    try {
      await apiClient.post(`/people/teachers/${assignSubjectModal.teacher.id}/assign-subject`, {
        classId: assignSubjectModal.classId,
        subjectId: assignSubjectModal.subjectId,
      });
      toast.success(`Subject allocated to ${assignSubjectModal.teacher.name}`);
      setAssignSubjectModal(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to assign subject');
    } finally {
      setAssigningSubject(false);
    }
  };

  const printTeacherIdCard = (teacher: Teacher, orientation: 'portrait' | 'landscape') => {
    const popup = window.open('', '_blank', orientation === 'portrait' ? 'width=540,height=820' : 'width=840,height=560');
    if (!popup) return toast.error('Please allow popups to print the ID card');
    const photo = teacher.avatarUrl || '';
    const empNo = teacher.employeeNo || 'EMP-000';
    const barcodeData = empNo.replace(/[^A-Z0-9-]/gi, '').padEnd(16, '0').slice(0, 16);
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
    barSvg += `<text x="${orientation === 'portrait' ? '120' : '110'}" y="42" text-anchor="middle" font-size="9" fill="#64748b" font-family="monospace">${empNo}</text></svg>`;

    const isPortrait = orientation === 'portrait';

    const html = `<!doctype html>
<html>
<head>
  <title>${teacher.name} — Faculty ID Card (${orientation.toUpperCase()})</title>
  <style>
    @page { size: ${orientation}; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
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
    }
    .card-header {
      background: linear-gradient(135deg, #4338ca 0%, #3730a3 50%, #1e1b4b 100%);
      color: #ffffff;
      padding: ${isPortrait ? '20px 20px 14px' : '16px 24px'};
      text-align: center;
    }
    .school-title { font-size: 11px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(255,255,255,0.85); }
    .card-sub { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }
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
    .teacher-name { font-size: 19px; font-weight: 900; color: #0f172a; text-align: center; margin-top: 10px; }
    .card-body { padding: 12px 22px 16px; flex: 1; }
    .data-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 12px; }
    ` : `
    .land-content { display: flex; padding: 20px 24px; gap: 20px; flex: 1; align-items: center; }
    .land-left { display: flex; flex-direction: column; align-items: center; width: 140px; shrink: 0; }
    .photo-area { width: 110px; height: 110px; border-radius: 20px; overflow: hidden; border: 3px solid #4338ca; background: #0f172a; display: flex; align-items: center; justify-content: center; font-size: 42px; font-weight: 900; color: #ffffff; }
    .photo-area img { width: 100%; height: 100%; object-fit: cover; }
    .teacher-name { font-size: 18px; font-weight: 900; color: #0f172a; margin-bottom: 10px; }
    .card-body { flex: 1; }
    .data-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px dashed #e2e8f0; font-size: 11.5px; }
    `}
    .label { color: #64748b; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
    .val { font-weight: 800; color: #0f172a; }
    .val-indigo { font-weight: 900; color: #4338ca; font-family: monospace; font-size: 12.5px; }
    .footer-barcode { padding: 10px 20px 14px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .stamp { display: inline-block; font-size: 9px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; background: #dcfce7; color: #15803d; border: 1px solid #86efac; padding: 2px 8px; border-radius: 999px; margin-top: 4px; }
    @media print {
      body { background: transparent; padding: 0; }
      .card-wrap { box-shadow: none; border: 1px solid #94a3b8; }
      .card-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="card-wrap">
    <div class="card-header">
      <div class="school-title">EduSphere Campus Faculty</div>
      <div class="card-sub">Official Teacher ID Card</div>
    </div>

    ${isPortrait ? `
      <div class="photo-area">
        ${photo ? `<img src="${photo}" />` : teacher.name.charAt(0)}
      </div>
      <div class="teacher-name">${teacher.name}</div>
      <div class="card-body">
        <div class="data-row">
          <span class="label">Employee No</span>
          <span class="val-indigo">${empNo}</span>
        </div>
        <div class="data-row">
          <span class="label">Qualification</span>
          <span class="val">${teacher.qualification || 'Master Degree'}</span>
        </div>
        <div class="data-row">
          <span class="label">Specialization</span>
          <span class="val">${teacher.specialization || 'Academic Faculty'}</span>
        </div>
        <div class="data-row">
          <span class="label">Experience</span>
          <span class="val">${teacher.experience || '3'} Years</span>
        </div>
        <div class="data-row" style="border-bottom:none">
          <span class="label">Official Phone</span>
          <span class="val" style="font-family:monospace">${teacher.phone || '—'}</span>
        </div>
      </div>
      <div class="footer-barcode">
        ${barSvg}
        <span class="stamp">✓ VERIFIED FACULTY</span>
      </div>
    ` : `
      <div class="land-content">
        <div class="land-left">
          <div class="photo-area">
            ${photo ? `<img src="${photo}" />` : teacher.name.charAt(0)}
          </div>
          <span class="stamp" style="margin-top:8px">✓ FACULTY</span>
        </div>
        <div class="card-body">
          <div class="teacher-name">${teacher.name}</div>
          <div class="data-row">
            <span class="label">Employee No</span>
            <span class="val-indigo">${empNo}</span>
          </div>
          <div class="data-row">
            <span class="label">Qualification</span>
            <span class="val">${teacher.qualification || 'Master Degree'}</span>
          </div>
          <div class="data-row">
            <span class="label">Specialization</span>
            <span class="val">${teacher.specialization || 'Academic Faculty'}</span>
          </div>
          <div class="data-row">
            <span class="label">Phone</span>
            <span class="val" style="font-family:monospace">${teacher.phone || '—'}</span>
          </div>
          <div style="margin-top:8px; display:flex; justify-content:center">
            ${barSvg}
          </div>
        </div>
      </div>
    `}
  </div>
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

    popup.document.write(html);
    popup.document.close();
  };

  // ══════════════════════════════════════════════════════════════
  // FULL SCREEN ADD / EDIT TEACHER VIEW (ALL IN ONE SINGLE STEP)
  // ══════════════════════════════════════════════════════════════
  if (view === 'add') {
    return (
      <div className="w-full min-h-screen pb-20 space-y-6 max-w-7xl mx-auto animate-fade-in">
        
        {/* Full Screen Top Header */}
        <div className="overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-purple-500/5 to-card p-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-cyan-500/15 text-cyan-600 flex items-center justify-center border border-cyan-500/25 shadow-inner">
                <Briefcase size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-600 dark:text-indigo-400 border border-cyan-500/30 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    {editing ? 'UPDATE TEACHER PROFILE' : 'NEW TEACHER RECRUITMENT'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-muted-foreground font-semibold">Faculty ID: {form.employeeNo || 'EMP-2026-001'}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-foreground">
                  {editing ? `Edit Faculty Record: ${editing.name}` : 'Teacher Registration & Portal Access'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
                  Complete all teacher profile, academic credentials, and official school login in one step.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setView('list')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card/80 px-4 py-2 text-sm font-bold text-foreground hover:bg-muted transition-all shadow-sm"
            >
              <ArrowLeft size={16} /> Back to Teachers List
            </button>
          </div>
        </div>

        {/* Form: 100% IN ONE SINGLE STEP */}
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* SECTION 1: PERSONAL & CONTACT INFORMATION */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="-mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-6 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <User size={18} />
                <span className="font-bold text-sm sm:text-base">1. Personal & Contact Information</span>
              </div>
              <span className="bg-white/20 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">Required</span>
            </div>

            <div className="rounded-2xl border border-border bg-slate-50/70 dark:bg-muted/15 p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                
                {/* Photo Upload */}
                <div className="flex flex-col items-center gap-2 shrink-0 mx-auto md:mx-0">
                  <label className="relative flex h-36 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-cyan-500/40 bg-card shadow-inner hover:border-cyan-400 transition-all group">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhoto}
                    />
                    {form.avatarUrl ? (
                      <>
                        <img src={form.avatarUrl} alt="Teacher" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black uppercase tracking-wider transition-opacity">
                          Change
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-muted-foreground text-center p-2">
                        <Camera size={26} className="text-cyan-600" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-indigo-400">Teacher Photo</span>
                      </div>
                    )}
                  </label>
                  {form.avatarUrl ? (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, avatarUrl: '' }))}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-400 uppercase tracking-wider"
                    >
                      Remove Photo
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500 dark:text-muted-foreground">JPG/PNG (Max 2MB)</span>
                  )}
                </div>

                {/* Personal Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 w-full">
                  <Field label="Teacher Full Name" required>
                    <input
                      required
                      className={inputStyle}
                      placeholder="e.g. Tariq Mahmood / Ali Khan"
                      value={form.name}
                      onChange={(e) => {
                        const nameVal = e.target.value;
                        const firstName = nameVal.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
                        setForm((prev) => {
                          const isCustomGmail = Boolean(prev.email && prev.email.includes('@') && !prev.email.endsWith('@school.edu.pk'));
                          let newEmail = prev.email;
                          if (!isCustomGmail && !editing) {
                            const regNum = prev.employeeNo.match(/(\d+)$/)?.[1] || prev.employeeNo.replace(/\D/g, '').slice(-3) || '001';
                            newEmail = firstName ? `${firstName}${regNum}@school.edu.pk` : '';
                          }
                          return {
                            ...prev,
                            name: nameVal,
                            email: newEmail,
                          };
                        });
                      }}
                    />
                  </Field>

                  <Field label="Gender" required>
                    <select
                      className={inputStyle}
                      value={form.gender}
                      onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </Field>

                  <Field label="Date of Birth">
                    <input
                      type="date"
                      className={inputStyle}
                      value={form.dateOfBirth}
                      onChange={(e) => setForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                    />
                  </Field>

                  <Field label="Blood Group">
                    <select
                      className={inputStyle}
                      value={form.bloodGroup}
                      onChange={(e) => setForm((prev) => ({ ...prev, bloodGroup: e.target.value }))}
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Contact Mobile (Optional)">
                    <input
                      inputMode="numeric"
                      maxLength={12}
                      className={`${inputStyle} font-mono`}
                      placeholder="0300-1234567"
                      value={form.phone}
                      onChange={(e) => setForm((prev) => ({ ...prev, phone: phoneFormat(e.target.value) }))}
                    />
                  </Field>

                  <Field label="CNIC / National ID (Optional)">
                    <input
                      inputMode="numeric"
                      maxLength={15}
                      className={`${inputStyle} font-mono`}
                      placeholder="35201-1234567-1"
                      value={form.cnic}
                      onChange={(e) => setForm((prev) => ({ ...prev, cnic: cnicFormat(e.target.value) }))}
                    />
                  </Field>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <Field label="Residential Address (Optional)">
                      <input
                        className={inputStyle}
                        placeholder="House / Street / Area / City"
                        value={form.address}
                        onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                      />
                    </Field>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: ACADEMIC QUALIFICATIONS & SALARY */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="-mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <GraduationCap size={18} />
                <span className="font-bold text-sm sm:text-base">2. Academic Qualifications & Compensation</span>
              </div>
              <span className="bg-white/20 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">Academic Record</span>
            </div>

            <div className="rounded-2xl border border-border bg-slate-50/70 dark:bg-muted/15 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <Field label="Educational Qualification" required>
                  <select
                    required
                    className={inputStyle}
                    value={form.qualification}
                    onChange={(e) => setForm((prev) => ({ ...prev, qualification: e.target.value }))}
                  >
                    {form.qualification && !QUALIFICATION_CATEGORIES.some(cat => cat.options.includes(form.qualification)) && (
                      <option value={form.qualification}>{form.qualification} (Custom)</option>
                    )}
                    {QUALIFICATION_CATEGORIES.map((group) => (
                      <optgroup key={group.category} label={group.category}>
                        {group.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </Field>

                <Field label="Specialization / Subject Focus">
                  <select
                    className={inputStyle}
                    value={form.specialization}
                    onChange={(e) => setForm((prev) => ({ ...prev, specialization: e.target.value }))}
                  >
                    {form.specialization && !SPECIALIZATION_CATEGORIES.some(cat => cat.options.includes(form.specialization)) && (
                      <option value={form.specialization}>{form.specialization} (Custom)</option>
                    )}
                    {SPECIALIZATION_CATEGORIES.map((group) => (
                      <optgroup key={group.category} label={group.category}>
                        {group.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </Field>

                <Field label="Teaching Experience">
                  <select
                    className={inputStyle}
                    value={form.experience}
                    onChange={(e) => setForm((prev) => ({ ...prev, experience: e.target.value }))}
                  >
                    <option value="0">Fresh / Less than 1 Year</option>
                    <option value="1">1 Year Experience</option>
                    <option value="2">2 Years Experience</option>
                    <option value="3">3 Years Experience</option>
                    <option value="4">4 Years Experience</option>
                    <option value="5">5 Years Experience</option>
                    <option value="6">6 Years Experience</option>
                    <option value="7">7 Years Experience</option>
                    <option value="8">8 Years Experience</option>
                    <option value="10">10+ Years (Senior Faculty)</option>
                    <option value="15">15+ Years (Principal / Senior)</option>
                  </select>
                </Field>

                <Field label="Monthly Basic Salary (PKR)" required>
                  <input
                    required
                    type="number"
                    min={0}
                    step="500"
                    className={`${inputStyle} font-mono font-bold text-emerald-600 dark:text-emerald-400`}
                    placeholder="45000"
                    value={form.salary}
                    onChange={(e) => setForm((prev) => ({ ...prev, salary: e.target.value }))}
                  />
                </Field>

              </div>
            </div>
          </div>

          {/* SECTION 3: OFFICIAL SCHOOL LOGIN ID & 8-CHARACTER PASSWORD */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="-mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-6 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Key size={18} />
                <span className="font-bold text-sm sm:text-base">3. Official Faculty Portal Login Credentials</span>
              </div>
              <span className="bg-white/20 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">Security</span>
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-indigo-950/20 via-purple-950/10 to-card p-6 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                
                <Field label="Employee Code / No" required>
                  <div className="relative">
                    <input
                      required
                      className={`${inputStyle} font-mono font-bold text-cyan-600 dark:text-indigo-400`}
                      placeholder="e.g. EMP-2026-001"
                      value={form.employeeNo}
                      onChange={(e) => setForm((prev) => ({ ...prev, employeeNo: e.target.value }))}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase bg-cyan-500/10 text-cyan-600 px-2 py-0.5 rounded-full border border-cyan-500/20 pointer-events-none">
                      Official ID
                    </span>
                  </div>
                </Field>

                <Field label="Teacher Login ID / Gmail" required>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <input
                        required
                        className={`${inputStyle} font-mono font-bold text-cyan-600 dark:text-cyan-400`}
                        placeholder="apna Gmail ya name+digits (e.g. ali001)"
                        value={form.email}
                        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const fName = form.name.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'teacher';
                          const regNum = form.employeeNo.match(/(\d+)$/)?.[1] || form.employeeNo.replace(/\D/g, '').slice(-3) || '001';
                          const generated = `${fName}${regNum}@school.edu.pk`;
                          setForm((prev) => ({ ...prev, email: generated }));
                          toast.info(`Auto Generated: ${fName}${regNum}`);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded-lg transition"
                        title="Auto-generate from first name + numbers"
                      >
                        Auto Name+No
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-muted-foreground">
                      💡 Teacher ka apna <strong>Gmail</strong> ho to wahi login ID ban jayega, nahi to first name + registration digits (jaise <code>ali001</code>) se auto-generate ho jayega.
                    </p>
                  </div>
                </Field>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground mb-1">
                    Portal Login Password (8 Characters) *
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={`${inputStyle} font-mono font-bold tracking-wider text-amber-500 pr-10`}
                        placeholder="8-character password"
                        value={form.password}
                        onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-muted-foreground hover:text-slate-900 dark:text-foreground"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const generated = generate8CharPassword();
                        setForm((prev) => ({ ...prev, password: generated }));
                        toast.success(`Generated 8-char password: ${generated}`);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-3 text-xs font-bold text-cyan-600 hover:bg-cyan-500/20 transition shrink-0"
                      title="Re-Generate 8-char password"
                    >
                      <RefreshCw size={14} /> Re-Generate
                    </button>
                  </div>
                </div>

              </div>

              <div className="rounded-xl bg-card border border-border p-4 flex items-center gap-3">
                <ShieldCheck size={20} className="text-emerald-500 shrink-0" />
                <p className="text-xs text-slate-500 dark:text-muted-foreground">
                  Teacher is <strong>Login ID</strong> ya <strong>Employee No</strong> aur <strong>Password</strong> se apne faculty portal mein login kar sakte hain.
                </p>
              </div>

            </div>
          </div>

          {/* Submit Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setView('list')}
              className={buttonStyle}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={primaryBtnStyle}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {editing ? 'Update Teacher Record' : 'Complete Teacher Registration'}
            </button>
          </div>

        </form>

      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // MAIN TEACHERS DIRECTORY VIEW
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 pb-20">
      
      {/* Registration Success Banner */}
      {lastRegistered && (
        <div className="relative overflow-hidden rounded-3xl border-2 border-cyan-500/40 bg-gradient-to-r from-indigo-950/70 via-slate-900/80 to-purple-950/60 p-6 shadow-2xl animate-fade-in">
          <div className="relative flex flex-col lg:flex-row gap-6 items-start lg:items-center">
            
            <div className="flex items-center gap-4 flex-1">
              <div className="h-16 w-16 rounded-2xl overflow-hidden bg-slate-800 border-2 border-cyan-500/50 shrink-0 flex items-center justify-center font-black text-2xl text-indigo-400">
                {lastRegistered.teacher.avatarUrl ? (
                  <img src={lastRegistered.teacher.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  lastRegistered.teacher.name?.charAt(0)
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Teacher Registered</span>
                </div>
                <h3 className="text-lg font-black text-white">{lastRegistered.teacher.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{lastRegistered.teacher.employeeNo}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="flex-1 rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-cyan-400 mb-1">🎓 Official Login ID</p>
                <p className="font-mono font-bold text-sm text-white break-all">{lastRegistered.creds.loginId}</p>
              </div>
              <div className="flex-1 rounded-2xl border border-amber-500/30 bg-slate-900/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-1">🔑 8-Digit Password</p>
                <p className="font-mono font-bold text-sm text-amber-300 tracking-widest">{lastRegistered.creds.password}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIdCardTeacher(lastRegistered.teacher)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/50 bg-cyan-600/20 px-3.5 py-2.5 text-xs font-bold text-indigo-300 hover:bg-cyan-600/30 transition"
              >
                <Printer size={14} /> View ID Card
              </button>
              <button
                onClick={() => setLastRegistered(null)}
                className="rounded-xl p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X size={16} />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-indigo-600/10 via-card to-purple-600/5 p-6 shadow-sm">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-cyan-600">Faculty Database</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-foreground">Teacher Management</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-muted-foreground">
              Total {teachers.length} active faculty members • Salary tracking & class allocations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:brightness-110 transition"
            >
              <Plus size={16} /> Add Teacher
            </button>

            <button
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card/80 px-3.5 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-cyan-500/20 bg-card p-5 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center font-bold mb-3">
            <Users size={20} />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-foreground">{teachers.length}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-muted-foreground mt-0.5">Total Teachers</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-card p-5 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold mb-3">
            <UserCheck size={20} />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-foreground">{inchargeCount}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-muted-foreground mt-0.5">Class Incharges</p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-card p-5 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold mb-3">
            <Wallet size={20} />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-foreground">{paidCount} / {teachers.length}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-muted-foreground mt-0.5">Salary Paid ({MONTH_NAMES[currentMonth - 1]})</p>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-card p-5 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold mb-3">
            <DollarSign size={20} />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-foreground">{money(totalPayroll)}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-muted-foreground mt-0.5">Monthly Payroll Budget</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-muted-foreground pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by teacher name, employee no, subject, qualification..."
            className="w-full rounded-xl border border-border/80 bg-background/80 py-2.5 pl-11 pr-4 text-xs font-medium text-foreground shadow-sm placeholder:text-slate-500 dark:text-muted-foreground/60 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background px-3.5 py-2.5 text-xs font-bold text-foreground outline-none"
          >
            <option value="">All Faculty ({teachers.length})</option>
            <option value="ACTIVE">Active Teachers</option>
            <option value="INCHARGE">Class Incharges</option>
            <option value="INACTIVE">Inactive Teachers</option>
          </select>

          <select
            value={filterSalary}
            onChange={(e) => setFilterSalary(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-background px-3.5 py-2.5 text-xs font-bold text-foreground outline-none"
          >
            <option value="">All Salary Status</option>
            <option value="PAID">Salary Paid</option>
            <option value="UNPAID">Salary Unpaid</option>
          </select>

          {(query || filterStatus || filterSalary) && (
            <button
              onClick={() => {
                setQuery('');
                setFilterStatus('');
                setFilterSalary('');
              }}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 px-2 py-1 shrink-0"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Teachers Directory Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Users size={18} />
            <span className="font-bold text-sm sm:text-base">Faculty Directory & Academic Records</span>
          </div>
          <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">{filtered.length} Teachers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/30 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
              <tr>
                <th className="px-5 py-4">Faculty Member</th>
                <th className="px-5 py-4">Employee No</th>
                <th className="px-5 py-4">Incharge / Subjects</th>
                <th className="px-5 py-4">Qualification</th>
                <th className="px-5 py-4">Salary Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-muted-foreground">
                    <Loader2 size={24} className="mx-auto animate-spin text-cyan-600 mb-2" />
                    Loading teacher directory...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-muted-foreground">
                    No teacher records match your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const isPaid = isPaidThisMonth(t);
                  const incharge = t.sectionTeacher?.[0];
                  return (
                    <tr
                      key={t.id}
                      onClick={() => {
                        setSelectedTeacher(t);
                        setProfileTab('overview');
                      }}
                      className="cursor-pointer hover:bg-slate-100/70 dark:bg-muted/40 transition group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl overflow-hidden bg-cyan-600/10 text-cyan-600 flex items-center justify-center font-bold text-sm border border-cyan-500/20 shrink-0">
                            {t.avatarUrl ? (
                              <img src={t.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              t.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm group-hover:text-cyan-600 transition-colors">
                              {t.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-muted-foreground font-mono">{t.phone || t.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 font-mono">
                        <span className="font-bold text-cyan-600 block">{t.employeeNo}</span>
                        <span className="text-[10px] text-slate-500 dark:text-muted-foreground">{t.gender || 'Male'}</span>
                      </td>

                      <td className="px-5 py-3.5">
                        {incharge ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-1">
                            Incharge: {incharge.class?.name} ({incharge.name})
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-muted-foreground text-[11px] block">No Section Assigned</span>
                        )}
                        <p className="text-[11px] text-slate-500 dark:text-muted-foreground font-medium truncate max-w-[200px]">
                          {(t.classSubjects || []).map((cs) => cs.subject?.name).filter(Boolean).join(', ') || 'Subjects not allocated'}
                        </p>
                      </td>

                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900 dark:text-foreground">{t.qualification || 'Master Degree'}</p>
                        <p className="text-[11px] text-slate-500 dark:text-muted-foreground">{t.experience || 3} Yrs Experience</p>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                            isPaid
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                            {isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                          <p className="font-mono text-[11px] font-bold text-slate-900 dark:text-foreground">{money(t.salary)}</p>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setIdCardTeacher(t)}
                            className="rounded-lg p-2 text-slate-500 dark:text-muted-foreground hover:bg-cyan-500/10 hover:text-cyan-600 transition"
                            title="View & Print ID Card"
                          >
                            <Printer size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setPasswordModalTeacher(t);
                              setNewPassword(generate8CharPassword());
                            }}
                            className="rounded-lg p-2 text-slate-500 dark:text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500 transition"
                            title="Update Password"
                          >
                            <Key size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setSalaryModal({
                                teacher: t,
                                month: currentMonth,
                                year: currentYear,
                                basicSalary: t.salary || 40000,
                                allowances: 0,
                                deductions: 0,
                                remarks: '',
                              });
                            }}
                            className="rounded-lg p-2 text-slate-500 dark:text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500 transition"
                            title="Pay Salary"
                          >
                            <DollarSign size={15} />
                          </button>
                          <button
                            onClick={() => openEdit(t)}
                            className="rounded-lg p-2 text-slate-500 dark:text-muted-foreground hover:bg-sky-500/10 hover:text-sky-500 transition"
                            title="Edit Record"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => void handleArchive(t.id)}
                            className="rounded-lg p-2 text-slate-500 dark:text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition"
                            title="Archive"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── TEACHER PROFILE MODAL ──                              */}
      {/* ══════════════════════════════════════════════════════════ */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-md animate-fade-in">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl flex flex-col">
            
            {/* Top Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 via-purple-700 to-sky-700 p-6 text-white shrink-0">
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden bg-white/20 border-2 border-white/80 shadow-md shrink-0 flex items-center justify-center font-black text-2xl text-white">
                    {selectedTeacher.avatarUrl ? (
                      <img src={selectedTeacher.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      selectedTeacher.name.charAt(0)
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-black text-white truncate">{selectedTeacher.name}</h2>
                      <span className="rounded-full bg-emerald-500/25 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-200 border border-emerald-400/30">
                        Faculty
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/90 font-medium">
                      <span className="bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
                        Employee No: <strong className="text-white">{selectedTeacher.employeeNo}</strong>
                      </span>
                      <span className="bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
                        Qualification: <strong className="text-white">{selectedTeacher.qualification || 'Master'}</strong>
                      </span>
                      <span className="bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
                        Salary: <strong className="text-emerald-300">{money(selectedTeacher.salary)}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTeacher(null)}
                  className="rounded-xl p-2 text-white/80 hover:bg-white/20 hover:text-white transition shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="mt-6 flex items-center gap-1 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-white/15">
                {[
                  { key: 'overview', label: 'Overview' },
                  { key: 'classes', label: 'Incharge & Subjects' },
                  { key: 'salary', label: 'Payroll History' },
                  { key: 'credentials', label: 'Portal Pass' },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setProfileTab(t.key as any)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                      profileTab === t.key
                        ? 'bg-white text-indigo-900 shadow-md font-black'
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
                    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 shadow-sm">
                      <p className="text-xs font-bold text-slate-500 dark:text-muted-foreground">Monthly Salary</p>
                      <p className="text-2xl font-black text-cyan-600 dark:text-indigo-400 mt-1">{money(selectedTeacher.salary)}</p>
                    </div>

                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm">
                      <p className="text-xs font-bold text-slate-500 dark:text-muted-foreground">Class Incharge</p>
                      <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                        {selectedTeacher.sectionTeacher?.[0]?.class?.name ? `${selectedTeacher.sectionTeacher[0].class.name} (${selectedTeacher.sectionTeacher[0].name})` : 'Not Assigned'}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 shadow-sm">
                      <p className="text-xs font-bold text-slate-500 dark:text-muted-foreground">Assigned Subjects</p>
                      <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{selectedTeacher.classSubjects?.length || 0}</p>
                    </div>

                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-sm">
                      <p className="text-xs font-bold text-slate-500 dark:text-muted-foreground">Experience</p>
                      <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{selectedTeacher.experience || 3} Years</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="rounded-3xl border border-slate-200 dark:border-border bg-white dark:bg-card p-5 shadow-sm space-y-3 text-xs">
                      <p className="font-black text-sm text-foreground mb-2">Personal Information</p>
                      <div className="flex justify-between border-b border-border/60 pb-2">
                        <span className="text-slate-500 dark:text-muted-foreground">Phone:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-foreground">{selectedTeacher.phone || '—'}</span>
                      </div>
                      <div className="flex justify-between border-b border-border/60 pb-2">
                        <span className="text-slate-500 dark:text-muted-foreground">Official Email:</span>
                        <span className="font-mono text-cyan-600 dark:text-cyan-400">{selectedTeacher.email}</span>
                      </div>
                      <div className="flex justify-between border-b border-border/60 pb-2">
                        <span className="text-slate-500 dark:text-muted-foreground">Gender / Blood:</span>
                        <span className="font-bold text-slate-900 dark:text-foreground">{selectedTeacher.gender || 'Male'} / {selectedTeacher.bloodGroup || 'A+'}</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-500 dark:text-muted-foreground">Address:</span>
                        <span className="font-bold text-slate-900 dark:text-foreground">{selectedTeacher.address || '—'}</span>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 dark:border-border bg-white dark:bg-card p-5 shadow-sm space-y-3 text-xs">
                      <p className="font-black text-sm text-foreground mb-2">Qualifications & Department</p>
                      <div className="flex justify-between border-b border-border/60 pb-2">
                        <span className="text-slate-500 dark:text-muted-foreground">Qualification:</span>
                        <span className="font-bold text-slate-900 dark:text-foreground">{selectedTeacher.qualification || 'Master Degree'}</span>
                      </div>
                      <div className="flex justify-between border-b border-border/60 pb-2">
                        <span className="text-slate-500 dark:text-muted-foreground">Specialization:</span>
                        <span className="font-bold text-cyan-600">{selectedTeacher.specialization || 'General'}</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-500 dark:text-muted-foreground">Status:</span>
                        <span className="font-bold text-emerald-500">Active Faculty</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {profileTab === 'classes' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="rounded-2xl border border-border p-5 bg-card space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-foreground">Section Incharge Role</h4>
                        <p className="text-xs text-slate-500 dark:text-muted-foreground">Classroom administration and primary supervision</p>
                      </div>
                      <button
                        onClick={() => setAssignSectionModal({ teacher: selectedTeacher, sectionId: '' })}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-500"
                      >
                        <Plus size={14} /> Assign Section
                      </button>
                    </div>

                    {selectedTeacher.sectionTeacher && selectedTeacher.sectionTeacher.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedTeacher.sectionTeacher.map((sec) => (
                          <div key={sec.id} className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5">
                            <div>
                              <p className="font-bold text-slate-900 dark:text-foreground">{sec.class?.name} — Section {sec.name}</p>
                              <p className="text-[11px] text-slate-500 dark:text-muted-foreground">{sec._count?.students || 0} Students enrolled</p>
                            </div>
                            <button
                              onClick={() => void handleUnassignSection(sec.id)}
                              className="text-xs font-bold text-rose-500 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-muted-foreground">Not currently assigned as incharge of any section.</p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-border p-5 bg-card space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-foreground">Allocated Teaching Subjects</h4>
                        <p className="text-xs text-slate-500 dark:text-muted-foreground">Class subjects taught by this teacher</p>
                      </div>
                      <button
                        onClick={() => setAssignSubjectModal({ teacher: selectedTeacher, classId: '', subjectId: '' })}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500"
                      >
                        <Plus size={14} /> Assign Subject
                      </button>
                    </div>

                    {selectedTeacher.classSubjects && selectedTeacher.classSubjects.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {selectedTeacher.classSubjects.map((cs) => (
                          <div key={cs.id} className="rounded-xl border border-border bg-slate-50 dark:bg-muted/20 p-3">
                            <p className="font-bold text-foreground text-xs">{cs.subject?.name}</p>
                            <p className="text-[11px] text-slate-500 dark:text-muted-foreground">{cs.class?.name}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-muted-foreground">No subjects allocated yet.</p>
                    )}
                  </div>
                </div>
              )}

              {profileTab === 'salary' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-foreground">Salary & Payroll History</h4>
                      <p className="text-xs text-slate-500 dark:text-muted-foreground">Monthly basic salary: {money(selectedTeacher.salary)}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSalaryModal({
                          teacher: selectedTeacher,
                          month: currentMonth,
                          year: currentYear,
                          basicSalary: selectedTeacher.salary || 45000,
                          allowances: 0,
                          deductions: 0,
                          remarks: '',
                        });
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                    >
                      <DollarSign size={14} /> Pay Monthly Salary
                    </button>
                  </div>

                  {selectedTeacher.payrolls && selectedTeacher.payrolls.length > 0 ? (
                    <div className="rounded-2xl border border-border overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted/30 border-b border-border text-[10px] font-black uppercase text-slate-500 dark:text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3">Month / Year</th>
                            <th className="px-4 py-3">Basic</th>
                            <th className="px-4 py-3">Allowances</th>
                            <th className="px-4 py-3">Deductions</th>
                            <th className="px-4 py-3">Net Paid</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {selectedTeacher.payrolls.map((p) => (
                            <tr key={p.id}>
                              <td className="px-4 py-3 font-bold">{MONTH_NAMES[p.month - 1]} {p.year}</td>
                              <td className="px-4 py-3 font-mono">{money(p.basicSalary)}</td>
                              <td className="px-4 py-3 font-mono text-emerald-500">+{money(p.allowances)}</td>
                              <td className="px-4 py-3 font-mono text-rose-500">-{money(p.deductions)}</td>
                              <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-foreground">{money(p.netSalary)}</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                  ✓ PAID
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border p-6 text-center text-slate-500 dark:text-muted-foreground text-xs">
                      No previous salary payments recorded yet. Click "Pay Monthly Salary" above to record.
                    </div>
                  )}
                </div>
              )}

              {profileTab === 'credentials' && (
                <div className="space-y-4 animate-fade-in max-w-xl mx-auto">
                  <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black uppercase tracking-wider text-cyan-600 flex items-center gap-1.5">
                        <Key size={14} /> Teacher Portal Access Pass
                      </div>
                      <button
                        onClick={() => {
                          setPasswordModalTeacher(selectedTeacher);
                          setNewPassword(generate8CharPassword());
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 hover:underline"
                      >
                        <Pencil size={12} /> Edit Password
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-xl bg-card border border-border p-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground mb-1">Official Login ID / Email</p>
                        <p className="font-mono font-bold text-sm text-cyan-500 break-all">{selectedTeacher.email}</p>
                      </div>
                      <div className="rounded-xl bg-card border border-border p-3">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground mb-1">Password</p>
                        <p className="font-mono font-bold text-sm text-slate-900 dark:text-foreground">•••••••••••• (Encrypted)</p>
                        <p className="text-[10px] text-slate-500 dark:text-muted-foreground mt-1">Admin can update or reset this password anytime.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-slate-50 dark:bg-muted/20 px-6 py-4 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const t = selectedTeacher;
                    setSelectedTeacher(null);
                    setIdCardTeacher(t);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-2 text-xs font-bold text-cyan-600 hover:bg-cyan-500/20 transition"
                >
                  <Printer size={14} /> View ID Card
                </button>
                <button
                  onClick={() => {
                    setPasswordModalTeacher(selectedTeacher);
                    setNewPassword(generate8CharPassword());
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-500 hover:bg-amber-500/20 transition"
                >
                  <Key size={14} /> Update Password
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className={buttonStyle}
                  onClick={() => {
                    const t = selectedTeacher;
                    setSelectedTeacher(null);
                    openEdit(t);
                  }}
                >
                  <Pencil size={14} /> Edit Record
                </button>
                <button
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-500 transition-all shadow-sm"
                  onClick={() => void handleArchive(selectedTeacher.id)}
                >
                  <Trash2 size={14} /> Archive Teacher
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── VIEW ID CARD MODAL (PORTRAIT & LANDSCAPE PRINT) ──    */}
      {/* ══════════════════════════════════════════════════════════ */}
      {idCardTeacher && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-2xl p-6 flex flex-col items-center">
            
            <div className="w-full flex items-center justify-between border-b border-border pb-4 mb-5">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center">
                  <Printer size={18} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-foreground">Teacher Identity Card</h3>
                  <p className="text-xs text-slate-500 dark:text-muted-foreground">{idCardTeacher.name} — Employee No: {idCardTeacher.employeeNo}</p>
                </div>
              </div>

              <button
                onClick={() => setIdCardTeacher(null)}
                className="rounded-xl p-2 text-slate-500 dark:text-muted-foreground hover:bg-muted transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Layout Switcher */}
            <div className="flex items-center gap-2 mb-6 bg-slate-100/70 dark:bg-muted/40 p-1.5 rounded-2xl border border-border">
              <button
                onClick={() => setIdCardOrientation('portrait')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  idCardOrientation === 'portrait'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-500 dark:text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layout size={14} className="rotate-90" /> Portrait (Vertical)
              </button>
              <button
                onClick={() => setIdCardOrientation('landscape')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  idCardOrientation === 'landscape'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-500 dark:text-muted-foreground hover:text-foreground'
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
                  <div className="px-5 pt-5 pb-4 bg-gradient-to-r from-indigo-700 via-purple-700 to-sky-700 text-center relative">
                    <p className="text-[9px] font-black tracking-[0.2em] uppercase text-indigo-200">EduSphere Faculty</p>
                    <p className="text-xs font-black uppercase tracking-wider text-white mt-0.5">Faculty Identity Card</p>
                    <div className="mt-3 mx-auto h-20 w-20 rounded-2xl overflow-hidden border-2 border-white bg-slate-800 flex items-center justify-center font-black text-2xl shadow-md">
                      {idCardTeacher.avatarUrl ? (
                        <img src={idCardTeacher.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        idCardTeacher.name.charAt(0)
                      )}
                    </div>
                    <h4 className="font-black text-base text-white mt-2">{idCardTeacher.name}</h4>
                  </div>

                  <div className="px-5 py-4 space-y-2 text-xs flex-1">
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Employee No</span>
                      <span className="font-mono font-bold text-indigo-400">{idCardTeacher.employeeNo}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Qualification</span>
                      <span className="font-bold text-white">{idCardTeacher.qualification || 'Master Degree'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Specialization</span>
                      <span className="font-bold text-white">{idCardTeacher.specialization || 'Academic Staff'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Experience</span>
                      <span className="font-bold text-amber-400">{idCardTeacher.experience || 3} Years</span>
                    </div>
                    <div className="flex justify-between pt-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Official Phone</span>
                      <span className="font-mono text-[11px] text-slate-300">{idCardTeacher.phone || '—'}</span>
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 text-center">
                    <p className="font-mono text-[10px] text-slate-400 mb-1">{idCardTeacher.employeeNo}</p>
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                      ✓ VERIFIED FACULTY
                    </span>
                  </div>
                </div>
              ) : (
                /* LANDSCAPE CARD */
                <div className="w-[520px] rounded-3xl overflow-hidden border border-slate-700 bg-slate-900 text-white shadow-2xl flex flex-col">
                  <div className="px-5 py-3 bg-gradient-to-r from-indigo-700 via-purple-700 to-sky-700 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black tracking-[0.2em] uppercase text-indigo-200">EduSphere Faculty</p>
                      <p className="text-xs font-black uppercase tracking-wider text-white">Official Teacher ID Card</p>
                    </div>
                    <span className="text-[10px] font-mono bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
                      {idCardTeacher.employeeNo}
                    </span>
                  </div>

                  <div className="p-5 flex gap-5 items-center flex-1">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-cyan-500 bg-slate-800 flex items-center justify-center font-black text-3xl shadow-md">
                        {idCardTeacher.avatarUrl ? (
                          <img src={idCardTeacher.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          idCardTeacher.name.charAt(0)
                        )}
                      </div>
                      <span className="mt-2 text-[8px] font-black uppercase bg-emerald-900 text-emerald-400 border border-emerald-700 px-2 py-0.5 rounded-full">
                        ✓ FACULTY
                      </span>
                    </div>

                    <div className="flex-1 space-y-2 text-xs">
                      <h4 className="font-black text-lg text-white">{idCardTeacher.name}</h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                        <div>
                          <p className="text-[9px] uppercase font-bold text-slate-400">Employee No</p>
                          <p className="font-mono font-bold text-indigo-400">{idCardTeacher.employeeNo}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-slate-400">Qualification</p>
                          <p className="font-bold text-white">{idCardTeacher.qualification || 'Master'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-slate-400">Specialization</p>
                          <p className="font-bold text-purple-400">{idCardTeacher.specialization || 'General'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-slate-400">Phone</p>
                          <p className="font-mono text-slate-300">{idCardTeacher.phone || '—'}</p>
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
                onClick={() => printTeacherIdCard(idCardTeacher, 'portrait')}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card px-5 py-3 text-xs font-bold text-foreground hover:bg-muted transition"
              >
                <Printer size={15} /> Print as Portrait
              </button>
              <button
                onClick={() => printTeacherIdCard(idCardTeacher, 'landscape')}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-600 px-5 py-3 text-xs font-bold text-white hover:brightness-110 transition shadow-lg shadow-indigo-600/20"
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
      {passwordModalTeacher && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
                <Key size={18} /> Update Teacher Password
              </div>
              <button
                onClick={() => setPasswordModalTeacher(null)}
                className="rounded-xl p-1.5 text-slate-500 dark:text-muted-foreground hover:text-slate-900 dark:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-muted-foreground">
              Set or generate an 8-character login password for <strong>{passwordModalTeacher.name}</strong>.
            </p>

            <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground">New Password</label>
                <div className="flex items-center gap-2">
                  <input
                    required
                    type="text"
                    className={`${inputStyle} font-mono font-bold text-amber-500`}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter 8-digit password"
                  />
                  <button
                    type="button"
                    onClick={() => setNewPassword(generate8CharPassword())}
                    className="p-3 rounded-2xl border border-border hover:bg-muted text-cyan-600 shrink-0"
                    title="Generate 8-char password"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalTeacher(null)}
                  className={buttonStyle}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className={primaryBtnStyle}
                >
                  {updatingPassword ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Pay Salary Modal ── */}
      {salaryModal && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-500 font-black text-base">
                <DollarSign size={20} /> Record Salary Payout
              </div>
              <button
                onClick={() => setSalaryModal(null)}
                className="rounded-xl p-1.5 text-slate-500 dark:text-muted-foreground hover:text-slate-900 dark:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-muted-foreground">
              Paying monthly salary to <strong>{salaryModal.teacher.name}</strong> ({salaryModal.teacher.employeeNo}).
            </p>

            <form onSubmit={handlePaySalary} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Payout Month">
                  <select
                    className={inputStyle}
                    value={salaryModal.month}
                    onChange={(e) => setSalaryModal({ ...salaryModal, month: Number(e.target.value) })}
                  >
                    {MONTH_NAMES.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Payout Year">
                  <input
                    type="number"
                    className={inputStyle}
                    value={salaryModal.year}
                    onChange={(e) => setSalaryModal({ ...salaryModal, year: Number(e.target.value) })}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Basic Salary (PKR)" required>
                  <input
                    type="number"
                    required
                    className={inputStyle}
                    value={salaryModal.basicSalary}
                    onChange={(e) => setSalaryModal({ ...salaryModal, basicSalary: Number(e.target.value) })}
                  />
                </Field>

                <Field label="Allowances (+)">
                  <input
                    type="number"
                    className={inputStyle}
                    value={salaryModal.allowances}
                    onChange={(e) => setSalaryModal({ ...salaryModal, allowances: Number(e.target.value) })}
                  />
                </Field>

                <Field label="Deductions (-)">
                  <input
                    type="number"
                    className={inputStyle}
                    value={salaryModal.deductions}
                    onChange={(e) => setSalaryModal({ ...salaryModal, deductions: Number(e.target.value) })}
                  />
                </Field>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Total Net Payout:</span>
                <span className="font-mono text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {money(salaryModal.basicSalary + salaryModal.allowances - salaryModal.deductions)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSalaryModal(null)}
                  className={buttonStyle}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingSalary}
                  className={primaryBtnStyle}
                >
                  {processingSalary ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Confirm Salary Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Assign Section Modal ── */}
      {assignSectionModal && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-600 font-black text-base">
                <Users size={18} /> Assign Section Incharge
              </div>
              <button
                onClick={() => setAssignSectionModal(null)}
                className="rounded-xl p-1.5 text-slate-500 dark:text-muted-foreground hover:text-slate-900 dark:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-muted-foreground">
              Assign <strong>{assignSectionModal.teacher.name}</strong> as class incharge.
            </p>

            <form onSubmit={handleAssignSection} className="space-y-4">
              <Field label="Choose Class & Section" required>
                <select
                  required
                  className={inputStyle}
                  value={assignSectionModal.sectionId}
                  onChange={(e) => setAssignSectionModal({ ...assignSectionModal, sectionId: e.target.value })}
                >
                  <option value="">Select Section</option>
                  {classes.flatMap((c) =>
                    (c.sections || []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {c.name} — Section {s.name}
                      </option>
                    ))
                  )}
                </select>
              </Field>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignSectionModal(null)}
                  className={buttonStyle}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigningSection}
                  className={primaryBtnStyle}
                >
                  {assigningSection ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Confirm Incharge Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Assign Subject Modal ── */}
      {assignSubjectModal && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-500 font-black text-base">
                <BookOpen size={18} /> Allocate Subject to Teacher
              </div>
              <button
                onClick={() => setAssignSubjectModal(null)}
                className="rounded-xl p-1.5 text-slate-500 dark:text-muted-foreground hover:text-slate-900 dark:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAssignSubject} className="space-y-4">
              <Field label="Class" required>
                <select
                  required
                  className={inputStyle}
                  value={assignSubjectModal.classId}
                  onChange={(e) => setAssignSubjectModal({ ...assignSubjectModal, classId: e.target.value })}
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Subject" required>
                <select
                  required
                  className={inputStyle}
                  value={assignSubjectModal.subjectId}
                  onChange={(e) => setAssignSubjectModal({ ...assignSubjectModal, subjectId: e.target.value })}
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code || 'SUB'})</option>
                  ))}
                </select>
              </Field>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignSubjectModal(null)}
                  className={buttonStyle}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigningSubject}
                  className={primaryBtnStyle}
                >
                  {assigningSubject ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Allocate Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Teacher Password Update Modal ── */}
      {passwordModalTeacher && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
                <Key size={18} /> Update Teacher Portal Password
              </div>
              <button
                onClick={() => setPasswordModalTeacher(null)}
                className="rounded-xl p-1.5 text-slate-500 dark:text-muted-foreground hover:text-slate-900 dark:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-muted-foreground">
              Set or generate an 8-digit login password for <strong>{passwordModalTeacher.name}</strong> ({passwordModalTeacher.employeeNo}).
            </p>

            <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground">New 8-Digit Password</label>
                <div className="flex items-center gap-2">
                  <input
                    required
                    type="text"
                    className={`${inputStyle} font-mono font-bold text-amber-500`}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter 8-digit password"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const generated = generate8CharPassword();
                      setNewPassword(generated);
                      toast.success(`Generated: ${generated}`);
                    }}
                    className="p-3 rounded-2xl border border-border hover:bg-muted text-cyan-600 shrink-0"
                    title="Re-Generate 8-digit password"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalTeacher(null)}
                  className={buttonStyle}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className={primaryBtnStyle}
                >
                  {updatingPassword ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Save Password
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
      <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
        {label}
        {required ? ' *' : ''}
      </span>
      {children}
    </label>
  );
}
