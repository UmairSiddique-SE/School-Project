import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, BookOpen, Briefcase, Camera, Check, CheckCircle, CheckSquare,
  Clock, Copy, DollarSign, Edit2, Eye, EyeOff, FileText, Fingerprint,
  GraduationCap, Key, Loader2, Mail, MapPin, Phone, Plus, Printer,
  RefreshCw, Search, Shield, ShieldCheck, Sparkles, Trash2, User,
  UserCheck, Users, X, AlertCircle, Calendar, ArrowUpRight, ChevronRight,
  Sparkle, Layers, BookCheck, Wallet, Receipt
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
  leaveRequests?: Array<{
    id: string;
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
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

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const initialForm = {
  name: '',
  email: '',
  employeeNo: '',
  phone: '',
  gender: 'MALE',
  qualification: '',
  experience: '',
  salary: '',
  password: '',
  specialization: '',
  cnic: '',
  address: '',
  dateOfBirth: '',
  bloodGroup: 'A+',
  avatarUrl: '',
};

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

const dateText = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<SchoolSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSalary, setFilterSalary] = useState('');

  // Modals & Active Selections
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState({ ...initialForm });
  const [step, setStep] = useState(1);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [profileTab, setProfileTab] = useState<'overview' | 'salary' | 'classes' | 'credentials' | 'attendance'>('overview');

  // Interactive Action States
  const [lastRegistered, setLastRegistered] = useState<{ teacher: Teacher; creds: { loginId: string; password: string } } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Quick Action Sub-Modals
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

  const [assignSectionModal, setAssignSectionModal] = useState<{
    teacher: Teacher;
    sectionId: string;
  } | null>(null);
  const [assigningSection, setAssigningSection] = useState(false);

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

      // If a teacher was selected, refresh their data
      if (selectedTeacher) {
        const fresh = (teachersRes.data || []).find((t: Teacher) => t.id === selectedTeacher.id);
        if (fresh) setSelectedTeacher(fresh);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to load teachers data');
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

  // Statistics
  const activeCount = teachers.filter((t) => t.isActive !== false).length;
  const inchargeCount = teachers.filter((t) => (t.sectionTeacher?.length || 0) > 0).length;
  const paidCount = teachers.filter((t) => isPaidThisMonth(t)).length;
  const totalPayroll = teachers.reduce((sum, t) => sum + Number(t.salary || 0), 0);

  const openAdd = () => {
    setEditing(null);
    const nextNo = `TCH-${String(teachers.length + 1).padStart(3, '0')}`;
    setForm({ ...initialForm, employeeNo: nextNo });
    setStep(1);
    setShowForm(true);
  };

  const openEdit = (t: Teacher) => {
    setEditing(t);
    setForm({
      name: t.name || '',
      email: t.email || '',
      employeeNo: t.employeeNo || '',
      phone: t.phone || '',
      gender: t.gender || 'MALE',
      qualification: t.qualification || '',
      experience: t.experience == null ? '' : String(t.experience),
      salary: t.salary == null ? '' : String(t.salary),
      password: '',
      specialization: t.specialization || '',
      cnic: t.cnic || '',
      address: t.address || '',
      dateOfBirth: t.dateOfBirth ? t.dateOfBirth.split('T')[0] : '',
      bloodGroup: t.bloodGroup || 'A+',
      avatarUrl: t.avatarUrl || '',
    });
    setStep(1);
    setShowForm(true);
  };

  const handlePhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, avatarUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await apiClient.patch(`/people/teachers/${editing.id}`, {
          name: form.name,
          phone: form.phone,
          gender: form.gender,
          qualification: form.qualification,
          specialization: form.specialization,
          experience: form.experience ? Number(form.experience) : undefined,
          salary: form.salary ? Number(form.salary) : undefined,
          bloodGroup: form.bloodGroup,
          avatarUrl: form.avatarUrl || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
        });
        toast.success('Teacher profile updated successfully!');
      } else {
        const payload = {
          ...form,
          experience: form.experience ? Number(form.experience) : undefined,
          salary: form.salary ? Number(form.salary) : undefined,
        };
        const res = await apiClient.post('/people/teachers', payload);
        const createdTeacher = res.data?.teacher;
        const createdCreds = res.data?.credentials;

        if (createdTeacher && createdCreds) {
          setLastRegistered({ teacher: createdTeacher, creds: createdCreds });
        }
        toast.success(`Faculty registered — ${createdTeacher?.name || form.name}`);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ ...initialForm });
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Unable to save teacher record');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (t: Teacher) => {
    if (!window.confirm(`Archive ${t.name} from active faculty?`)) return;
    try {
      await apiClient.delete(`/people/teachers/${t.id}`);
      toast.success('Teacher record archived successfully');
      if (selectedTeacher?.id === t.id) setSelectedTeacher(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to archive teacher');
    }
  };

  // Salary Payment Action
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
      toast.success(`Salary of ${money(salaryModal.basicSalary + salaryModal.allowances - salaryModal.deductions)} recorded for ${salaryModal.teacher.name}`);
      setSalaryModal(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record salary payment');
    } finally {
      setProcessingSalary(false);
    }
  };

  // Class Incharge Assign Action
  const handleAssignSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignSectionModal || !assignSectionModal.sectionId) return toast.warning('Please select a section');
    setAssigningSection(true);
    try {
      await apiClient.post(`/people/teachers/${assignSectionModal.teacher.id}/assign-section`, {
        sectionId: assignSectionModal.sectionId,
      });
      toast.success(`Assigned as Class Incharge successfully!`);
      setAssignSectionModal(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to assign class incharge');
    } finally {
      setAssigningSection(false);
    }
  };

  const handleUnassignSection = async (sectionId: string) => {
    if (!window.confirm('Remove this teacher from being Class Incharge of this section?')) return;
    try {
      await apiClient.delete(`/people/teachers/sections/${sectionId}`);
      toast.success('Class Incharge assignment removed');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to remove class incharge');
    }
  };

  // Subject Assign Action
  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignSubjectModal || !assignSubjectModal.classId || !assignSubjectModal.subjectId) {
      return toast.warning('Please select both class and subject');
    }
    setAssigningSubject(true);
    try {
      await apiClient.post(`/people/teachers/${assignSubjectModal.teacher.id}/assign-subject`, {
        classId: assignSubjectModal.classId,
        subjectId: assignSubjectModal.subjectId,
      });
      toast.success(`Subject assigned to teacher successfully!`);
      setAssignSubjectModal(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to assign subject');
    } finally {
      setAssigningSubject(false);
    }
  };

  const handleUnassignSubject = async (classSubjectId: string) => {
    if (!window.confirm('Remove teacher from teaching this subject?')) return;
    try {
      await apiClient.delete(`/people/teachers/subjects/${classSubjectId}`);
      toast.success('Subject assignment removed');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to remove subject');
    }
  };

  // Print ID Card Generator with Barcode
  const printTeacherId = (t: Teacher, creds?: { loginId: string; password: string }) => {
    const popup = window.open('', '_blank', 'width=580,height=860');
    if (!popup) return toast.error('Please allow popups to print ID card');
    const photo = t.avatarUrl || '';
    const empNo = t.employeeNo || 'TCH-000';

    // Generate Barcode SVG bars
    const barcodeRaw = empNo.replace(/[^A-Z0-9-]/gi, '').padEnd(16, '0').slice(0, 16);
    const bars = barcodeRaw
      .split('')
      .map((ch) => {
        const c = ch.charCodeAt(0);
        return [c & 1 ? 3 : 1, c & 2 ? 3 : 1, c & 4 ? 3 : 1, c & 8 ? 2 : 1];
      })
      .flat();
    let barSvg = `<svg width="220" height="46" xmlns="http://www.w3.org/2000/svg">`;
    let x = 4;
    bars.forEach((w, i) => {
      barSvg += `<rect x="${x}" y="4" width="${w}" height="32" fill="${i % 2 === 0 ? '#fff' : 'transparent'}" />`;
      x += w + 1;
    });
    barSvg += `<text x="110" y="44" text-anchor="middle" font-size="9" fill="#94a3b8" font-family="monospace">${empNo}</text></svg>`;

    const loginLine = creds
      ? `<div class='row'><span class='muted'>Login ID</span><span class='value mono' style='font-size:11px;color:#67e8f9'>${creds.loginId}</span></div><div class='row' style='border:none'><span class='muted'>Password</span><span class='value mono' style='color:#fcd34d'>${creds.password}</span></div>`
      : '';

    popup.document.write(`<!doctype html><html><head><title>${t.name} — Faculty ID</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:#0f172a;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:20px}.card{width:380px;border-radius:24px;overflow:hidden;background:#1e293b;border:2px solid #334155;box-shadow:0 24px 48px rgba(0,0,0,.6)}.head{padding:22px 22px 16px;background:linear-gradient(135deg,#6366f1,#4338ca,#312e81);text-align:center;position:relative}.school{font-size:9px;letter-spacing:0.25em;font-weight:900;color:rgba(255,255,255,.8);text-transform:uppercase;margin-bottom:12px}.photo-wrap{width:88px;height:88px;border-radius:18px;overflow:hidden;margin:0 auto 12px;border:3px solid rgba(255,255,255,.9);background:#1e1b4b;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:900;color:white}.photo-wrap img{width:100%;height:100%;object-fit:cover}.name{font-size:19px;font-weight:900;color:white;margin-bottom:3px}.badge{display:inline-block;font-size:9.5px;font-weight:900;letter-spacing:.15em;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:3px 12px;color:rgba(255,255,255,.95)}.body{padding:18px 22px}.row{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #334155;padding:8px 0;gap:8px}.muted{font-size:9.5px;color:#94a3b8;text-transform:uppercase;letter-spacing:.12em;white-space:nowrap}.value{font-weight:700;font-size:12.5px;color:#f1f5f9;text-align:right}.mono{font-family:monospace}.barcode{padding:14px 22px 16px;border-top:1px solid #334155;display:flex;flex-direction:column;align-items:center;gap:4px}.bc-label{font-size:8.5px;color:#64748b;letter-spacing:.15em;text-transform:uppercase}.status{display:inline-flex;align-items:center;gap:5px;font-size:9px;font-weight:900;letter-spacing:.1em;background:#064e3b;border:1px solid #065f46;border-radius:999px;padding:3px 10px;color:#34d399;margin-top:8px}@media print{body{background:#fff;padding:0}.card{box-shadow:none;border-color:#e2e8f0;background:#fff}.head{-webkit-print-color-adjust:exact;print-color-adjust:exact}.body,.barcode{background:#fff}.muted{color:#64748b}.value{color:#0f172a}.row{border-color:#e2e8f0}.barcode{border-color:#e2e8f0}}</style></head><body><div class='card'><div class='head'><div class='school'>EduSphere Campus Management</div>${photo ? `<div class='photo-wrap'><img src='${photo}'/></div>` : `<div class='photo-wrap'>${t.name.charAt(0)}</div>`}<div class='name'>${t.name}</div><div style='margin-top:6px'><span class='badge'>FACULTY / TEACHER</span></div></div><div class='body'><div class='row'><span class='muted'>Employee ID</span><span class='value mono' style='color:#a5b4fc'>${empNo}</span></div><div class='row'><span class='muted'>Qualification</span><span class='value'>${t.qualification || 'Master / Bachelor'}</span></div><div class='row'><span class='muted'>Specialization</span><span class='value'>${t.specialization || 'General Faculty'}</span></div><div class='row'><span class='muted'>Blood Group</span><span class='value' style='color:#f87171'>${t.bloodGroup || '—'}</span></div><div class='row'><span class='muted'>Joining Date</span><span class='value'>${dateText(t.joiningDate)}</span></div><div class='row' style='border:none'><span class='muted'>Work Contact</span><span class='value mono' style='font-size:11px'>${t.phone || t.email}</span></div>${loginLine}</div><div class='barcode'><span class='bc-label'>Scan to Verify Faculty Identity</span>${barSvg}<span class='status'>✓ VERIFIED FACULTY MEMBER</span></div></div><script>window.onload=()=>{window.print()}</script></body></html>`);
    popup.document.close();
  };

  // Print Salary Slip
  const printSalarySlip = (t: Teacher, p: any) => {
    const popup = window.open('', '_blank', 'width=620,height=750');
    if (!popup) return toast.error('Please allow popups to print salary slip');
    const monthName = MONTH_NAMES[(p.month || 1) - 1];

    popup.document.write(`<!doctype html><html><head><title>Salary Slip - ${t.name} - ${monthName} ${p.year}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;padding:30px;background:#fff;color:#1e293b}.slip{max-width:540px;margin:0 auto;border:2px solid #0f172a;border-radius:16px;padding:24px}.head{border-bottom:2px solid #e2e8f0;padding-bottom:16px;margin-bottom:16px;text-align:center}.title{font-size:18px;font-weight:900;text-transform:uppercase;letter-spacing:1px}.sub{font-size:12px;color:#64748b;margin-top:3px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #e2e8f0}.item{font-size:12px}.item span{display:block;font-size:10px;color:#64748b;text-transform:uppercase;font-weight:700}.item strong{font-size:13px;color:#0f172a}.table{width:100%;border-collapse:collapse;margin:16px 0}.table th{text-align:left;font-size:11px;background:#f8fafc;padding:8px;border-bottom:2px solid #cbd5e1;text-transform:uppercase}.table td{padding:10px 8px;border-bottom:1px solid #e2e8f0;font-size:13px}.total{font-size:16px;font-weight:900;color:#0f172a;text-align:right;padding-top:12px}.status{display:inline-block;padding:4px 12px;background:#dcfce7;color:#15803d;border-radius:999px;font-size:11px;font-weight:900;text-transform:uppercase}.sign{margin-top:40px;display:flex;justify-content:space-between;font-size:11px;color:#64748b}@media print{body{padding:0}}</style></head><body><div class='slip'><div class='head'><div class='title'>EduSphere Campus Management</div><div class='sub'>FACULTY SALARY PAYMENT SLIP</div></div><div class='grid'><div class='item'><span>Employee Name</span><strong>${t.name}</strong></div><div class='item'><span>Employee No</span><strong>${t.employeeNo}</strong></div><div class='item'><span>Salary Month</span><strong>${monthName} ${p.year}</strong></div><div class='item'><span>Payment Status</span><strong class='status'>PAID</strong></div><div class='item'><span>Paid Date</span><strong>${dateText(p.paidDate || p.createdAt)}</strong></div><div class='item'><span>Reference</span><strong style='font-family:monospace'>PAY-${p.year}-${p.month}-${t.employeeNo}</strong></div></div><table class='table'><thead><tr><th>Salary Component</th><th style='text-align:right'>Amount (PKR)</th></tr></thead><tbody><tr><td>Basic Monthly Salary</td><td style='text-align:right'>${Number(p.basicSalary).toLocaleString()}</td></tr><tr><td>Allowances (Conveyance, Medical)</td><td style='text-align:right;color:#16a34a'>+ ${Number(p.allowances || 0).toLocaleString()}</td></tr><tr><td>Deductions (Tax, Leaves)</td><td style='text-align:right;color:#dc2626'>- ${Number(p.deductions || 0).toLocaleString()}</td></tr></tbody></table><div class='total'>NET SALARY PAID: PKR ${Number(p.netSalary).toLocaleString()}</div><div class='sign'><div>____________________<br/>Accountant Signature</div><div>____________________<br/>Authorized Principal</div></div></div><script>window.onload=()=>{window.print()}</script></body></html>`);
    popup.document.close();
  };

  const copyTeacherCredentials = (t: Teacher, creds?: { loginId: string; password: string }) => {
    const loginId = creds?.loginId || t.email;
    const pass = creds?.password || '(Provided at registration)';
    const text = `*EduSphere Faculty Portal Access*\n\nTeacher: ${t.name}\nEmployee ID: ${t.employeeNo}\nWork Email / Login: ${loginId}\nPassword: ${pass}\nPortal: Teacher LMS`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Teacher credentials copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Section helper for assign dropdown
  const availableSections = useMemo(() => {
    return classes.flatMap((cls) =>
      (cls.sections || []).map((sec) => ({
        id: sec.id,
        name: sec.name,
        className: cls.name,
        classId: cls.id,
        currentTeacherId: sec.teacherId,
      }))
    );
  }, [classes]);

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-[1400px] mx-auto">
      {/* ── 1. POST-REGISTRATION CREDENTIALS BANNER ── */}
      {lastRegistered && (
        <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-950/70 via-slate-900/90 to-indigo-950/70 p-6 shadow-2xl animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row gap-6 items-start lg:items-center">
            {/* Left Info */}
            <div className="flex items-center gap-4 flex-1">
              <div className="h-16 w-16 rounded-2xl overflow-hidden bg-slate-800 border-2 border-emerald-500/50 shrink-0 flex items-center justify-center font-black text-2xl text-emerald-400">
                {lastRegistered.teacher.avatarUrl ? (
                  <img src={lastRegistered.teacher.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  lastRegistered.teacher.name?.charAt(0)
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    Faculty Registered Successfully
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">{lastRegistered.teacher.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{lastRegistered.teacher.employeeNo}</p>
              </div>
            </div>

            {/* Middle Credentials */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="flex-1 rounded-2xl border border-indigo-500/30 bg-slate-900/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-400 mb-1">
                  🎓 Faculty Login ID / Email
                </p>
                <p className="font-mono font-bold text-sm text-white break-all">{lastRegistered.creds.loginId}</p>
              </div>
              <div className="flex-1 rounded-2xl border border-amber-500/30 bg-slate-900/80 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-1">
                  🔑 Portal Password
                </p>
                <p className="font-mono font-bold text-sm text-amber-300 tracking-widest">
                  {lastRegistered.creds.password}
                </p>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => copyTeacherCredentials(lastRegistered.teacher, lastRegistered.creds)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-md shadow-indigo-600/30"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />} Copy
              </button>
              <button
                onClick={() => printTeacherId(lastRegistered.teacher, lastRegistered.creds)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition"
              >
                <Printer size={14} /> Print ID
              </button>
              <button
                onClick={() => setLastRegistered(null)}
                className="rounded-xl p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <p className="relative mt-3 text-[11px] text-amber-400/80 font-semibold">
            ⚠️ Save these credentials now — password cannot be retrieved once dismissed. Provide directly to faculty member.
          </p>
        </div>
      )}

      {/* ── 2. TOP HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600/10 via-card to-violet-600/5 p-6 shadow-sm">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-indigo-500">
                Faculty & Academic Staff
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Teacher Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage faculty profiles, assigned classes, subject allocations, salaries, and portal access.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:brightness-110 transition"
            >
              <Plus size={16} /> Add New Teacher
            </button>

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

      {/* ── 3. STATS TILES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Faculty',
            value: teachers.length,
            icon: Users,
            gradient: 'from-indigo-500/[0.08] via-card/70 to-card',
            border: 'border-indigo-500/25 hover:border-indigo-500/50',
            glow: 'bg-indigo-500/15',
            iconBox: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
            labelColor: 'text-indigo-400',
            subtitle: `${activeCount} actively serving`,
          },
          {
            label: 'Class Incharges',
            value: inchargeCount,
            icon: GraduationCap,
            gradient: 'from-cyan-500/[0.08] via-card/70 to-card',
            border: 'border-cyan-500/25 hover:border-cyan-500/50',
            glow: 'bg-cyan-500/15',
            iconBox: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
            labelColor: 'text-cyan-400',
            subtitle: 'Section leaders assigned',
          },
          {
            label: `${MONTH_NAMES[currentMonth - 1]} Salaries`,
            value: `${paidCount} / ${teachers.length} Paid`,
            icon: Wallet,
            gradient: 'from-emerald-500/[0.08] via-card/70 to-card',
            border: 'border-emerald-500/25 hover:border-emerald-500/50',
            glow: 'bg-emerald-500/15',
            iconBox: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
            labelColor: 'text-emerald-400',
            subtitle: `${teachers.length - paidCount} pending payout`,
          },
          {
            label: 'Monthly Payroll',
            value: money(totalPayroll),
            icon: DollarSign,
            gradient: 'from-amber-500/[0.08] via-card/70 to-card',
            border: 'border-amber-500/25 hover:border-amber-500/50',
            glow: 'bg-amber-500/15',
            iconBox: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
            labelColor: 'text-amber-400',
            subtitle: 'Total salary commitment',
          },
        ].map(({ label, value, icon: Icon, gradient, border, glow, iconBox, labelColor, subtitle }) => (
          <div
            key={label}
            className={`group relative overflow-hidden rounded-3xl border ${border} bg-gradient-to-br ${gradient} p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1`}
          >
            <div className={`pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full ${glow} blur-2xl transition-all duration-500 group-hover:scale-150`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-wider ${labelColor}`}>{label}</p>
                <h4 className="mt-2 text-2xl font-black text-foreground tracking-tight">{value}</h4>
              </div>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBox} border shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                <Icon size={20} strokeWidth={2.2} />
              </div>
            </div>
            <div className="relative mt-4 text-[11px] font-medium text-muted-foreground">{subtitle}</div>
          </div>
        ))}
      </div>

      {/* ── 4. SEARCH & FILTER BAR ── */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-card/60 p-4 rounded-3xl border border-border shadow-sm backdrop-blur-xl">
        <div className="relative sm:col-span-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, employee ID, qualification, subject, class incharge..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition outline-none font-medium"
          />
        </div>
        <div className="sm:col-span-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-background border border-border text-foreground text-sm focus:border-indigo-500 outline-none transition font-bold"
          >
            <option value="">All Faculty Roles</option>
            <option value="ACTIVE">Active Teachers</option>
            <option value="INCHARGE">Class Incharges Only</option>
            <option value="INACTIVE">Inactive / Archived</option>
          </select>
        </div>
        <div className="sm:col-span-3">
          <select
            value={filterSalary}
            onChange={(e) => setFilterSalary(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-background border border-border text-foreground text-sm focus:border-indigo-500 outline-none transition font-bold"
          >
            <option value="">All Salary Status</option>
            <option value="PAID">Paid ({MONTH_NAMES[currentMonth - 1]})</option>
            <option value="UNPAID">Pending Payout ({MONTH_NAMES[currentMonth - 1]})</option>
          </select>
        </div>
      </div>

      {/* ── 5. TEACHER DIRECTORY TABLE ── */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={48} className="animate-spin text-indigo-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-28 rounded-3xl border border-dashed border-border bg-card/40 space-y-4">
          <div className="h-20 w-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mx-auto border border-indigo-500/20">
            <GraduationCap size={40} />
          </div>
          <div className="space-y-1">
            <p className="font-black text-2xl text-foreground">No faculty records found</p>
            <p className="text-xs text-muted-foreground">Adjust filters or click "Add New Teacher" to register faculty</p>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">Faculty Member</th>
                  <th className="px-6 py-4">Employee ID</th>
                  <th className="px-6 py-4">Class Incharge</th>
                  <th className="px-6 py-4">Teaching Subjects</th>
                  <th className="px-6 py-4">{MONTH_NAMES[currentMonth - 1]} Salary</th>
                  <th className="px-6 py-4">Monthly Base</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filtered.map((t) => {
                  const incharge = t.sectionTeacher?.[0];
                  const paid = isPaidThisMonth(t);

                  return (
                    <tr
                      key={t.id}
                      onClick={() => {
                        setSelectedTeacher(t);
                        setProfileTab('overview');
                      }}
                      className="hover:bg-muted/40 transition cursor-pointer group"
                    >
                      {/* Photo + Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-2xl overflow-hidden bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-black text-lg shrink-0">
                            {t.avatarUrl ? (
                              <img src={t.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              t.name.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-foreground group-hover:text-indigo-400 transition truncate">
                              {t.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">{t.email}</p>
                            {t.qualification && (
                              <span className="text-[10px] text-indigo-400 font-semibold">{t.qualification}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Employee ID */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                          {t.employeeNo}
                        </span>
                      </td>

                      {/* Class Incharge */}
                      <td className="px-6 py-4">
                        {incharge ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 font-bold text-xs">
                            <Sparkles size={12} />
                            <span>{incharge.class?.name} - {incharge.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium">— None</span>
                        )}
                      </td>

                      {/* Teaching Subjects */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(t.classSubjects || []).length > 0 ? (
                            t.classSubjects!.slice(0, 2).map((cs) => (
                              <span
                                key={cs.id}
                                className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-md border border-border text-foreground"
                              >
                                {cs.subject?.name} ({cs.class?.name})
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">— Not Assigned</span>
                          )}
                          {(t.classSubjects?.length || 0) > 2 && (
                            <span className="text-[10px] font-bold text-indigo-400">
                              +{t.classSubjects!.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Salary Status */}
                      <td className="px-6 py-4">
                        {paid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                            <CheckCircle size={12} /> Paid
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSalaryModal({
                                teacher: t,
                                month: currentMonth,
                                year: currentYear,
                                basicSalary: Number(t.salary || 0),
                                allowances: 0,
                                deductions: 0,
                                remarks: '',
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/25 hover:bg-amber-500/20 transition"
                          >
                            <Wallet size={12} /> Pay Now
                          </button>
                        )}
                      </td>

                      {/* Base Salary */}
                      <td className="px-6 py-4 font-mono font-bold text-xs text-foreground">
                        {money(t.salary)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => printTeacherId(t)}
                            className="p-2 rounded-xl text-muted-foreground hover:text-indigo-400 hover:bg-muted transition"
                            title="Print Faculty ID Card"
                          >
                            <Printer size={15} />
                          </button>
                          <button
                            onClick={() => openEdit(t)}
                            className="p-2 rounded-xl text-muted-foreground hover:text-amber-400 hover:bg-muted transition"
                            title="Edit Profile"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => void remove(t)}
                            className="p-2 rounded-xl text-muted-foreground hover:text-rose-400 hover:bg-muted transition"
                            title="Archive Record"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 6. RICH TEACHER PROFILE MODAL ── */}
      <AnimatePresence>
        {selectedTeacher && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
            onClick={() => setSelectedTeacher(null)}
          >
            <div
              className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-700/80 bg-slate-950 text-white shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl overflow-hidden border-2 border-indigo-400 bg-slate-800 flex items-center justify-center font-black text-2xl text-white shrink-0">
                    {selectedTeacher.avatarUrl ? (
                      <img src={selectedTeacher.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      selectedTeacher.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-black text-white">{selectedTeacher.name}</h2>
                      <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {selectedTeacher.employeeNo}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        {selectedTeacher.isActive !== false ? 'Active Faculty' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedTeacher.qualification || 'Faculty'} • {selectedTeacher.specialization || 'General Academic'} • Joined {dateText(selectedTeacher.joiningDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => printTeacherId(selectedTeacher)}
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition"
                  >
                    <Printer size={14} /> Print ID
                  </button>
                  <button
                    onClick={() => {
                      const t = selectedTeacher;
                      setSelectedTeacher(null);
                      openEdit(t);
                    }}
                    className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                    title="Edit Teacher Profile"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setSelectedTeacher(null)}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="px-6 pt-3 border-b border-slate-800 bg-slate-900/60 flex gap-2 overflow-x-auto shrink-0">
                {[
                  { id: 'overview', label: 'Overview & Profile', icon: User },
                  { id: 'salary', label: 'Salary & Payroll History', icon: Wallet },
                  { id: 'classes', label: 'Class Incharge & Subjects', icon: BookOpen },
                  { id: 'credentials', label: 'ID Card & Portal Access', icon: Key },
                  { id: 'attendance', label: 'Attendance & Leaves', icon: Calendar },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setProfileTab(id as any)}
                    className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition whitespace-nowrap ${
                      profileTab === id
                        ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                {/* ── TAB 1: OVERVIEW & PROFILE ── */}
                {profileTab === 'overview' && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Quick Summary Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Class Incharge</span>
                        <p className="font-bold text-sm text-cyan-400 mt-1">
                          {selectedTeacher.sectionTeacher?.[0]
                            ? `${selectedTeacher.sectionTeacher[0].class?.name} - ${selectedTeacher.sectionTeacher[0].name}`
                            : 'None Assigned'}
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Teaching Subjects</span>
                        <p className="font-bold text-sm text-indigo-400 mt-1">
                          {selectedTeacher.classSubjects?.length || 0} Assigned
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">{MONTH_NAMES[currentMonth - 1]} Salary</span>
                        <p className={`font-bold text-sm mt-1 ${isPaidThisMonth(selectedTeacher) ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {isPaidThisMonth(selectedTeacher) ? '✓ Paid' : '⏳ Pending'}
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Monthly Base</span>
                        <p className="font-mono font-bold text-sm text-white mt-1">
                          {money(selectedTeacher.salary)}
                        </p>
                      </div>
                    </div>

                    {/* Detailed Info Grid */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                        <User size={14} /> Personal & Professional Records
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                        {[
                          { label: 'Work Email / Login', value: selectedTeacher.email, icon: Mail, mono: true },
                          { label: 'Phone Number', value: selectedTeacher.phone || '—', icon: Phone, mono: true },
                          { label: 'Gender', value: selectedTeacher.gender || '—', icon: User },
                          { label: 'Blood Group', value: selectedTeacher.bloodGroup || '—', icon: Sparkle },
                          { label: 'Qualification', value: selectedTeacher.qualification || '—', icon: GraduationCap },
                          { label: 'Specialization', value: selectedTeacher.specialization || '—', icon: BookOpen },
                          { label: 'Total Experience', value: selectedTeacher.experience != null ? `${selectedTeacher.experience} Years` : '—', icon: Award },
                          { label: 'Joining Date', value: dateText(selectedTeacher.joiningDate), icon: Calendar },
                          { label: 'CNIC / National ID', value: selectedTeacher.cnic || '—', icon: Fingerprint, mono: true },
                          { label: 'Date of Birth', value: dateText(selectedTeacher.dateOfBirth), icon: Calendar },
                          { label: 'Residential Address', value: selectedTeacher.address || '—', icon: MapPin, full: true },
                        ].map(({ label, value, icon: Icon, mono, full }) => (
                          <div key={label} className={`p-3 rounded-xl bg-slate-900 border border-slate-800/80 ${full ? 'col-span-2 md:col-span-3' : ''}`}>
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                              <Icon size={11} /> {label}
                            </span>
                            <p className={`font-bold text-sm text-slate-200 mt-1 truncate ${mono ? 'font-mono' : ''}`}>
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 2: SALARY & PAYROLL HISTORY ── */}
                {profileTab === 'salary' && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Current Month Payout Status Card */}
                    <div className="rounded-2xl border-2 border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                            Current Salary Period: {MONTH_NAMES[currentMonth - 1]} {currentYear}
                          </span>
                          {isPaidThisMonth(selectedTeacher) ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              ✓ Paid
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              ⏳ Pending Payout
                            </span>
                          )}
                        </div>
                        <h3 className="text-2xl font-black text-white">{money(selectedTeacher.salary)}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Base contract salary per month.
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          setSalaryModal({
                            teacher: selectedTeacher,
                            month: currentMonth,
                            year: currentYear,
                            basicSalary: Number(selectedTeacher.salary || 0),
                            allowances: 0,
                            deductions: 0,
                            remarks: '',
                          })
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg hover:brightness-110 transition"
                      >
                        <Wallet size={16} />
                        {isPaidThisMonth(selectedTeacher) ? 'Re-issue / Update Salary' : 'Record / Pay Monthly Salary'}
                      </button>
                    </div>

                    {/* Payroll History Table */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                          <Receipt size={14} className="text-indigo-400" /> Previous Salary Payments & Payslips
                        </h4>
                        <span className="text-xs text-slate-500 font-mono">
                          {selectedTeacher.payrolls?.length || 0} Records Found
                        </span>
                      </div>

                      {(selectedTeacher.payrolls || []).length === 0 ? (
                        <div className="text-center py-16 text-slate-500 space-y-2">
                          <Receipt size={32} className="mx-auto opacity-40" />
                          <p className="text-sm font-bold">No previous salary payouts recorded yet</p>
                          <p className="text-xs">Click "Record / Pay Monthly Salary" above to record the first payout</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-800 bg-slate-900 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                <th className="px-6 py-3">Month / Year</th>
                                <th className="px-6 py-3">Basic Salary</th>
                                <th className="px-6 py-3">Allowances</th>
                                <th className="px-6 py-3">Deductions</th>
                                <th className="px-6 py-3">Net Paid</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Paid Date</th>
                                <th className="px-6 py-3 text-right">Slip</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 font-medium">
                              {selectedTeacher.payrolls!.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-800/40 transition">
                                  <td className="px-6 py-3 font-bold text-white">
                                    {MONTH_NAMES[(p.month || 1) - 1]} {p.year}
                                  </td>
                                  <td className="px-6 py-3 font-mono">{money(p.basicSalary)}</td>
                                  <td className="px-6 py-3 font-mono text-emerald-400">
                                    +{money(p.allowances)}
                                  </td>
                                  <td className="px-6 py-3 font-mono text-rose-400">
                                    -{money(p.deductions)}
                                  </td>
                                  <td className="px-6 py-3 font-mono font-black text-white">
                                    {money(p.netSalary)}
                                  </td>
                                  <td className="px-6 py-3">
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      ✓ Paid
                                    </span>
                                  </td>
                                  <td className="px-6 py-3 text-slate-400">
                                    {dateText(p.paidDate)}
                                  </td>
                                  <td className="px-6 py-3 text-right">
                                    <button
                                      onClick={() => printSalarySlip(selectedTeacher, p)}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline"
                                    >
                                      <Printer size={12} /> Print Slip
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── TAB 3: CLASS INCHARGE & TEACHING SUBJECTS ── */}
                {profileTab === 'classes' && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Class Incharge Card */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                            <GraduationCap size={16} /> Class Incharge (Class Teacher) Assignment
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            The designated faculty responsible for classroom attendance, discipline, and parent meetings.
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setAssignSectionModal({
                              teacher: selectedTeacher,
                              sectionId: selectedTeacher.sectionTeacher?.[0]?.id || '',
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition"
                        >
                          <Plus size={14} /> Assign New Class Incharge
                        </button>
                      </div>

                      {(selectedTeacher.sectionTeacher || []).length === 0 ? (
                        <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-slate-500">
                          <p className="text-sm font-bold">Not currently assigned as Class Incharge to any section</p>
                          <p className="text-xs mt-1">Click "Assign New Class Incharge" to assign this teacher to a section</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {selectedTeacher.sectionTeacher!.map((sec) => (
                            <div
                              key={sec.id}
                              className="p-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 to-slate-900 flex items-center justify-between gap-4"
                            >
                              <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                                  Class Incharge
                                </span>
                                <h4 className="text-lg font-black text-white">
                                  {sec.class?.name} — Section {sec.name}
                                </h4>
                                <p className="text-xs text-slate-400">
                                  {sec._count?.students || 0} active students enrolled
                                </p>
                              </div>
                              <button
                                onClick={() => handleUnassignSection(sec.id)}
                                className="text-xs text-rose-400 hover:text-rose-300 font-bold border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 rounded-xl"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Assigned Teaching Subjects */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                            <BookOpen size={16} /> Assigned Teaching Subjects & Workload
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Classes and subjects this teacher is assigned to teach.
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setAssignSubjectModal({
                              teacher: selectedTeacher,
                              classId: classes[0]?.id || '',
                              subjectId: subjects[0]?.id || '',
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition"
                        >
                          <Plus size={14} /> Assign Subject
                        </button>
                      </div>

                      {(selectedTeacher.classSubjects || []).length === 0 ? (
                        <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-slate-500">
                          <p className="text-sm font-bold">No teaching subjects assigned yet</p>
                          <p className="text-xs mt-1">Assign subjects so this teacher can grade exams, post homework, and take attendance</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {selectedTeacher.classSubjects!.map((cs) => (
                            <div
                              key={cs.id}
                              className="p-4 rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-between"
                            >
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block">
                                  {cs.class?.name}
                                </span>
                                <p className="font-bold text-sm text-white mt-0.5">{cs.subject?.name}</p>
                                {cs.subject?.code && (
                                  <span className="text-[10px] text-slate-500 font-mono">Code: {cs.subject.code}</span>
                                )}
                              </div>
                              <button
                                onClick={() => handleUnassignSubject(cs.id)}
                                className="text-[10px] font-bold text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10"
                                title="Unassign"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Weekly Timetable Schedule */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
                        <Clock size={16} /> Weekly Timetable Schedule ({selectedTeacher.timetables?.length || 0} Periods/Week)
                      </h3>

                      {(selectedTeacher.timetables || []).length === 0 ? (
                        <p className="text-xs text-slate-500">No scheduled periods generated in the timetable yet.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-800 text-[10px] font-black uppercase text-slate-400">
                                <th className="py-2">Day</th>
                                <th className="py-2">Time</th>
                                <th className="py-2">Class / Section</th>
                                <th className="py-2">Subject</th>
                                <th className="py-2">Room</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                              {selectedTeacher.timetables!.map((tt) => (
                                <tr key={tt.id}>
                                  <td className="py-2 font-bold text-indigo-400">{DAYS[tt.dayOfWeek] || 'Day'}</td>
                                  <td className="py-2 font-mono">{tt.startTime} - {tt.endTime}</td>
                                  <td className="py-2 font-bold text-white">{tt.section?.class?.name} ({tt.section?.name})</td>
                                  <td className="py-2">{tt.subject?.name}</td>
                                  <td className="py-2 text-slate-400">{tt.room || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── TAB 4: ID CARD & PORTAL ACCESS ── */}
                {profileTab === 'credentials' && (() => {
                  const empNo = selectedTeacher.employeeNo || 'TCH-000';
                  // Barcode SVG calculation
                  const barcodeRaw = empNo.replace(/[^A-Z0-9-]/gi, '').padEnd(16, '0').slice(0, 16);
                  const bars = barcodeRaw
                    .split('')
                    .map((ch) => {
                      const c = ch.charCodeAt(0);
                      return [c & 1 ? 3 : 1, c & 2 ? 3 : 1, c & 4 ? 3 : 1, c & 8 ? 2 : 1];
                    })
                    .flat();
                  let x = 0;
                  const rects = bars.map((w, i) => {
                    const r = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w} height={34} fill="currentColor" /> : null;
                    x += w + 0.8;
                    return r;
                  });

                  return (
                    <div className="space-y-6 animate-fade-in">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                        {/* LEFT: Physical ID Card */}
                        <div className="flex flex-col gap-4">
                          <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                            <Sparkles size={14} /> Physical Faculty ID Card
                          </span>

                          <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 text-white shadow-2xl">
                            {/* Card Header */}
                            <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-indigo-700 via-purple-700 to-violet-800 relative overflow-hidden">
                              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <p className="text-[9px] font-black tracking-[0.25em] uppercase text-indigo-200/80">
                                    EduSphere Campus
                                  </p>
                                  <p className="text-[11px] font-black uppercase tracking-wider text-white mt-0.5">
                                    Faculty Identity Card
                                  </p>
                                </div>
                                <GraduationCap size={24} className="text-white/80" />
                              </div>
                              {/* Photo + Info */}
                              <div className="flex items-end gap-4">
                                <div className="h-20 w-20 rounded-xl overflow-hidden border-2 border-white/80 bg-slate-800 shrink-0 flex items-center justify-center font-black text-3xl text-white shadow-lg">
                                  {selectedTeacher.avatarUrl ? (
                                    <img src={selectedTeacher.avatarUrl} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    selectedTeacher.name.charAt(0)
                                  )}
                                </div>
                                <div className="pb-1">
                                  <h3 className="font-black text-lg text-white leading-tight">{selectedTeacher.name}</h3>
                                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    <span className="text-[10px] bg-white/15 border border-white/20 rounded-full px-2 py-0.5 text-white font-bold">
                                      {selectedTeacher.qualification || 'Faculty'}
                                    </span>
                                    <span className="text-[10px] bg-white/15 border border-white/20 rounded-full px-2 py-0.5 text-amber-200 font-bold">
                                      {selectedTeacher.specialization || 'Teacher'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Card Body */}
                            <div className="px-5 py-4 grid grid-cols-2 gap-x-4 gap-y-2">
                              {[
                                ['Employee No', selectedTeacher.employeeNo, 'text-indigo-400'],
                                ['Gender', selectedTeacher.gender || '—', 'text-white'],
                                ['Blood Group', selectedTeacher.bloodGroup || '—', 'text-rose-400'],
                                ['Joined', dateText(selectedTeacher.joiningDate), 'text-white'],
                                ['Contact', selectedTeacher.phone || '—', 'text-white font-mono'],
                                ['Class Incharge', selectedTeacher.sectionTeacher?.[0]?.name ? `${selectedTeacher.sectionTeacher[0].class?.name}-${selectedTeacher.sectionTeacher[0].name}` : '—', 'text-cyan-400'],
                              ].map(([label, val, color]) => (
                                <div key={label as string} className="border-b border-slate-800 pb-2">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">{label}</p>
                                  <p className={`text-[12px] font-bold mt-0.5 ${color}`}>{val}</p>
                                </div>
                              ))}
                            </div>

                            {/* Barcode Strip */}
                            <div className="px-5 py-4 border-t border-slate-800 flex flex-col items-center gap-2">
                              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                                Scan to Verify Faculty Member
                              </p>
                              <svg width="220" height="40" viewBox={`0 0 ${x} 34`} className="text-white" preserveAspectRatio="none">
                                {rects}
                              </svg>
                              <p className="font-mono text-[10px] text-slate-500 tracking-wider">{selectedTeacher.employeeNo}</p>
                              <span className="mt-1 inline-flex items-center gap-1.5 text-[9px] font-black tracking-wider uppercase bg-emerald-900/60 border border-emerald-700/60 rounded-full px-3 py-1 text-emerald-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> VERIFIED FACULTY
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => printTeacherId(selectedTeacher)}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 py-3 text-xs font-bold text-white shadow-lg hover:brightness-110 transition"
                          >
                            <Printer size={15} /> Print Professional Faculty ID Card
                          </button>
                        </div>

                        {/* RIGHT: Portal Login Credentials */}
                        <div className="flex flex-col justify-between space-y-4">
                          <div className="space-y-4">
                            <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                              <Key size={14} /> Teacher Portal Access & Credentials
                            </span>

                            <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/80 p-5 space-y-3">
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                  Login ID / Work Email
                                </span>
                                <p className="font-mono font-bold text-sm text-indigo-300 mt-1 break-all">
                                  {selectedTeacher.email}
                                </p>
                              </div>

                              <div className="pt-3 border-t border-slate-800">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Portal Password
                                  </span>
                                  <button
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                                  >
                                    {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                                    {showPassword ? 'Hide' : 'Show'}
                                  </button>
                                </div>
                                <p className="font-mono font-bold text-sm text-amber-300 mt-1 tracking-widest">
                                  {showPassword ? '(Set at registration / Encrypted)' : '•••••••••••••'}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-1">
                                  Teachers login directly via the Teacher LMS portal.
                                </p>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
                              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                                <ShieldCheck size={14} className="text-emerald-400" /> Portal Role & Permissions
                              </p>
                              <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                                <li>Mark daily student attendance for assigned classes</li>
                                <li>Create & grade student exams, tests, and quizzes</li>
                                <li>Post daily homework, assignments, and notes</li>
                                <li>View teaching timetable and classroom schedule</li>
                              </ul>
                            </div>
                          </div>

                          <button
                            onClick={() => copyTeacherCredentials(selectedTeacher)}
                            className="w-full flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 py-3 text-xs font-bold text-indigo-400 hover:bg-indigo-500/20 transition"
                          >
                            {copied ? <Check size={15} /> : <Copy size={15} />}
                            {copied ? 'Copied to Clipboard!' : 'Copy Faculty Login Credentials'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── TAB 5: ATTENDANCE & LEAVES ── */}
                {profileTab === 'attendance' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                        <Calendar size={16} /> 30-Day Attendance Log
                      </h3>

                      {(selectedTeacher.attendances || []).length === 0 ? (
                        <p className="text-xs text-slate-500">No recent staff attendance entries found.</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {selectedTeacher.attendances!.map((att) => (
                            <div
                              key={att.id}
                              className={`p-3 rounded-xl border text-center ${
                                att.status === 'PRESENT'
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : att.status === 'LATE'
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                              }`}
                            >
                              <span className="text-[10px] font-bold block">{dateText(att.date)}</span>
                              <strong className="text-xs font-black">{att.status}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Leave Requests */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <FileText size={16} className="text-indigo-400" /> Recent Leave Applications
                      </h3>

                      {(selectedTeacher.leaveRequests || []).length === 0 ? (
                        <p className="text-xs text-slate-500">No leave requests submitted.</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedTeacher.leaveRequests!.map((lr) => (
                            <div
                              key={lr.id}
                              className="p-3 rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-white">{lr.type} Leave</span>
                                <p className="text-slate-400 text-[11px]">
                                  {dateText(lr.startDate)} - {dateText(lr.endDate)}: {lr.reason}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  lr.status === 'APPROVED'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : lr.status === 'REJECTED'
                                    ? 'bg-rose-500/10 text-rose-400'
                                    : 'bg-amber-500/10 text-amber-400'
                                }`}
                              >
                                {lr.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => printTeacherId(selectedTeacher)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-700 transition"
                  >
                    <Printer size={14} className="text-indigo-400" /> Print ID Card
                  </button>
                  <button
                    onClick={() => copyTeacherCredentials(selectedTeacher)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-700 transition"
                  >
                    <Key size={14} className="text-amber-400" /> Copy Login
                  </button>
                </div>

                <button
                  onClick={() => setSelectedTeacher(null)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 7. PAY SALARY MODAL ── */}
      <AnimatePresence>
        {salaryModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
            onClick={() => setSalaryModal(null)}
          >
            <div
              className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl text-white space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    Faculty Payroll Payout
                  </span>
                  <h3 className="text-lg font-black text-white mt-0.5">
                    Pay Salary: {salaryModal.teacher.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSalaryModal(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handlePaySalary} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Salary Month *
                    </label>
                    <select
                      value={salaryModal.month}
                      onChange={(e) => setSalaryModal({ ...salaryModal, month: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:border-emerald-500 outline-none"
                    >
                      {MONTH_NAMES.map((m, idx) => (
                        <option key={m} value={idx + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Year *
                    </label>
                    <input
                      type="number"
                      value={salaryModal.year}
                      onChange={(e) => setSalaryModal({ ...salaryModal, year: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Basic Salary (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={salaryModal.basicSalary}
                    onChange={(e) => setSalaryModal({ ...salaryModal, basicSalary: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-bold font-mono focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Allowances (+ PKR)
                    </label>
                    <input
                      type="number"
                      value={salaryModal.allowances}
                      onChange={(e) => setSalaryModal({ ...salaryModal, allowances: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 text-sm font-bold font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Deductions (- PKR)
                    </label>
                    <input
                      type="number"
                      value={salaryModal.deductions}
                      onChange={(e) => setSalaryModal({ ...salaryModal, deductions: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-rose-400 text-sm font-bold font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Net Payout Banner */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    Net Payout Amount:
                  </span>
                  <span className="font-mono font-black text-lg text-white">
                    PKR {Math.max(0, salaryModal.basicSalary + salaryModal.allowances - salaryModal.deductions).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSalaryModal(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processingSalary}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50"
                  >
                    {processingSalary ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Confirm & Record Salary Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 8. ASSIGN CLASS INCHARGE MODAL ── */}
      <AnimatePresence>
        {assignSectionModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
            onClick={() => setAssignSectionModal(null)}
          >
            <div
              className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl text-white space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white">
                  Assign as Class Incharge
                </h3>
                <button onClick={() => setAssignSectionModal(null)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAssignSection} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Select Section *
                  </label>
                  <select
                    required
                    value={assignSectionModal.sectionId}
                    onChange={(e) => setAssignSectionModal({ ...assignSectionModal, sectionId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:border-cyan-500 outline-none"
                  >
                    <option value="">Select Section</option>
                    {availableSections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.className} — Section {sec.name} {sec.currentTeacherId ? '(Currently assigned)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAssignSectionModal(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assigningSection}
                    className="px-4 py-2 rounded-xl bg-cyan-600 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-50"
                  >
                    {assigningSection ? 'Assigning...' : 'Assign Class Incharge'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 9. ASSIGN SUBJECT MODAL ── */}
      <AnimatePresence>
        {assignSubjectModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
            onClick={() => setAssignSubjectModal(null)}
          >
            <div
              className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl text-white space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white">
                  Assign Teaching Subject
                </h3>
                <button onClick={() => setAssignSubjectModal(null)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAssignSubject} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Select Class *
                  </label>
                  <select
                    required
                    value={assignSubjectModal.classId}
                    onChange={(e) => setAssignSubjectModal({ ...assignSubjectModal, classId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:border-indigo-500 outline-none"
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Select Subject *
                  </label>
                  <select
                    required
                    value={assignSubjectModal.subjectId}
                    onChange={(e) => setAssignSubjectModal({ ...assignSubjectModal, subjectId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:border-indigo-500 outline-none"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAssignSubjectModal(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assigningSubject}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {assigningSubject ? 'Assigning...' : 'Assign Subject'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 10. ADD / EDIT TEACHER MODAL ── */}
      <AnimatePresence>
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
          >
            <div
              className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl text-white overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                    Faculty Registry
                  </span>
                  <h2 className="text-xl font-black text-white mt-0.5">
                    {editing ? `Edit Faculty: ${editing.name}` : 'Register New Faculty Member'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Steps Indicator */}
              <div className="flex items-center justify-center gap-2 px-6 py-3 border-b border-slate-800 bg-slate-900/40">
                {[
                  { id: 1, title: 'Personal Info', icon: User },
                  { id: 2, title: 'Academic & Salary', icon: Briefcase },
                  { id: 3, title: 'Portal Credentials', icon: Key },
                ].map((s, idx) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(s.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        step === s.id
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : step > s.id
                          ? 'bg-slate-800 text-indigo-400'
                          : 'bg-slate-900 text-slate-500'
                      }`}
                    >
                      <s.icon size={13} />
                      <span>{s.title}</span>
                    </button>
                    {idx < 2 && <span className="text-slate-600 text-xs">→</span>}
                  </div>
                ))}
              </div>

              <form onSubmit={save} className="p-6 space-y-5">
                {/* Step 1: Personal Information */}
                {step === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                      {/* Photo Upload */}
                      <label className="relative flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-indigo-500/40 bg-slate-900 hover:border-indigo-400 transition group shrink-0 mx-auto sm:mx-0">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhoto(file);
                            e.currentTarget.value = '';
                          }}
                        />
                        {form.avatarUrl ? (
                          <>
                            <img src={form.avatarUrl} alt="Teacher" className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black uppercase tracking-wider transition-opacity">
                              Change
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 text-slate-400 text-center p-2">
                            <Camera size={24} className="text-indigo-400" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                              Upload Photo
                            </span>
                          </div>
                        )}
                      </label>

                      {/* Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 w-full">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                            Teacher Full Name *
                          </label>
                          <input
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g. Prof. Tariq Mahmood"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:border-indigo-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                            Work Email *
                          </label>
                          <input
                            required
                            type="email"
                            disabled={!!editing}
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="tariq@school.edu"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:border-indigo-500 outline-none disabled:opacity-50"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                            Mobile Phone
                          </label>
                          <input
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: phoneFormat(e.target.value) })}
                            placeholder="0300-1234567"
                            maxLength={12}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold font-mono focus:border-indigo-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                            Gender
                          </label>
                          <select
                            value={form.gender}
                            onChange={(e) => setForm({ ...form, gender: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:border-indigo-500 outline-none"
                          >
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                            Blood Group
                          </label>
                          <select
                            value={form.bloodGroup}
                            onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:border-indigo-500 outline-none"
                          >
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                              <option key={bg} value={bg}>{bg}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                            CNIC / National ID
                          </label>
                          <input
                            value={form.cnic}
                            onChange={(e) => setForm({ ...form, cnic: cnicFormat(e.target.value) })}
                            placeholder="35202-1234567-1"
                            maxLength={15}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold font-mono focus:border-indigo-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            value={form.dateOfBirth}
                            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:border-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                        Residential Address
                      </label>
                      <input
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="House / Street / City"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Academic & Salary */}
                {step === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                          Employee No / Faculty ID *
                        </label>
                        <input
                          required
                          disabled={!!editing}
                          value={form.employeeNo}
                          onChange={(e) => setForm({ ...form, employeeNo: e.target.value })}
                          placeholder="e.g. TCH-001"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-indigo-400 text-xs font-mono font-bold focus:border-indigo-500 outline-none disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                          Highest Qualification *
                        </label>
                        <input
                          required
                          value={form.qualification}
                          onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                          placeholder="e.g. M.Sc Mathematics, M.Phil"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:border-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                          Academic Specialization
                        </label>
                        <input
                          value={form.specialization}
                          onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                          placeholder="e.g. Mathematics, Physics, English"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:border-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                          Total Teaching Experience (Years)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={form.experience}
                          onChange={(e) => setForm({ ...form, experience: e.target.value })}
                          placeholder="e.g. 5"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold font-mono focus:border-indigo-500 outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                          Monthly Basic Salary (PKR) *
                        </label>
                        <input
                          type="number"
                          required
                          value={form.salary}
                          onChange={(e) => setForm({ ...form, salary: e.target.value })}
                          placeholder="e.g. 60000"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 text-sm font-bold font-mono focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Portal Credentials & Confirmation */}
                {step === 3 && (
                  <div className="space-y-4 animate-fade-in">
                    {!editing ? (
                      <div className="p-4 rounded-2xl border border-indigo-500/30 bg-slate-900 space-y-3">
                        <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                          <Key size={14} /> Teacher Portal Access Setup
                        </span>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                            Custom Password (Optional, leave blank to auto-generate)
                          </label>
                          <input
                            type="password"
                            minLength={12}
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            placeholder="Min 12 characters or auto-generated"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold font-mono focus:border-indigo-500 outline-none"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">
                            If left blank, an ultra-secure 12-char password will be automatically generated and displayed after registration.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900 text-xs text-slate-400">
                        Portal access account is active with email: <strong className="text-white">{form.email}</strong>.
                      </div>
                    )}

                    {/* Summary Review */}
                    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Record Summary
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <p><span className="text-slate-500">Name:</span> <strong className="text-white">{form.name}</strong></p>
                        <p><span className="text-slate-500">Employee No:</span> <strong className="text-indigo-400">{form.employeeNo}</strong></p>
                        <p><span className="text-slate-500">Qualification:</span> <strong className="text-white">{form.qualification || '—'}</strong></p>
                        <p><span className="text-slate-500">Salary:</span> <strong className="text-emerald-400">{money(Number(form.salary))}</strong></p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      if (step > 1) setStep(step - 1);
                      else setShowForm(false);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    {step === 1 ? 'Cancel' : 'Back'}
                  </button>

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={() => setStep(step + 1)}
                      disabled={step === 1 && (!form.name || !form.email)}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                      Next Step <ArrowUpRight size={14} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-xs font-black uppercase tracking-wider text-white shadow-lg hover:brightness-110 disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      {editing ? 'Update Faculty Record' : 'Complete Registration'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
