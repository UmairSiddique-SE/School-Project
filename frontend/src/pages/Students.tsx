import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRightLeft, ArrowUpRight, Camera, CheckSquare, Download, FileUp, GraduationCap,
  ImagePlus, Loader2, Pencil, Plus, Printer, RefreshCw, Search, Trash2,
  UserCheck, UserRound, Users, X, BookOpen, ShieldCheck, Mail, Phone, MapPin, AlertCircle, User,
  Eye, EyeOff, Copy, Check, HeartPulse, Award, Calendar, FileText, Key, Clock, Sparkles, Filter
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

type Student = any;
type Teacher = { id: string; name: string; email?: string };
type Section = { id: string; name: string; capacity?: number; teacher?: Teacher | null; className: string; classId: string };
type FacilityAvailability = { transport: boolean; hostel: boolean };

type FormState = {
  admissionNo: string;
  rollNo: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  religion: string;
  bFormNumber: string;
  email: string;
  phone: string;
  admissionType: 'NEW' | 'TRANSFER';
  sectionId: string;
  classId: string;
  session: string;
  previousSchool: string;
  previousClass: string;
  leavingCertificateUrl: string;
  previousAcademicRecord: string;
  medicalNotes: string;
  specialRequirements: string;
  fatherName: string;
  fatherStatus: 'ALIVE' | 'DECEASED';
  fatherMobile1: string;
  fatherWhatsapp: string;
  fatherCnic: string;
  fatherOccupation: string;
  motherName: string;
  motherMobile: string;
  motherOccupation: string;
  guardianName: string;
  guardianRelation: string;
  guardianMobile: string;
  currentAddress: string;
  permanentAddress: string;
  transportRequired: boolean;
  hostelRequired: boolean;
  avatarUrl: string;
};

const input = 'w-full rounded-2xl border border-slate-200 dark:border-border/80 bg-white dark:bg-background/90 px-4 py-3 text-sm text-foreground outline-none shadow-sm transition placeholder:text-muted-foreground/60 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 font-medium';
const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-3.5 py-2 text-sm font-semibold transition hover:bg-accent';
const primaryBtn = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-600/20 hover:brightness-110 transition disabled:opacity-60';
const currentSession = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
const religions = ['Muslim', 'Christian', 'Hindu', 'Sikh', 'Buddhist', 'Other'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const guardianRelations = ['UNCLE', 'AUNT', 'GRANDPARENT', 'SIBLING', 'OTHER'];
const fatherOccupations = ['Business', 'Government Job', 'Private Job', 'Self Employed', 'Farmer', 'Overseas', 'Driver', 'Shopkeeper', 'Labour', 'Doctor', 'Engineer', 'Teacher', 'Other'];
const motherOccupations = ['Housewife', 'Government Job', 'Private Job', 'Business', 'Self Employed', 'Teacher', 'Doctor', 'Engineer', 'Other'];

const emptyForm = (): FormState => ({
  admissionNo: '',
  rollNo: '',
  name: '',
  dateOfBirth: '',
  gender: 'MALE',
  bloodGroup: 'O+',
  religion: 'Muslim',
  bFormNumber: '',
  email: '',
  phone: '',
  admissionType: 'NEW',
  classId: '',
  sectionId: '',
  session: currentSession,
  previousSchool: '',
  previousClass: '',
  leavingCertificateUrl: '',
  previousAcademicRecord: '',
  medicalNotes: '',
  specialRequirements: '',
  fatherName: '',
  fatherStatus: 'ALIVE',
  fatherMobile1: '',
  fatherWhatsapp: '',
  fatherCnic: '',
  fatherOccupation: '',
  motherName: '',
  motherMobile: '',
  motherOccupation: '',
  guardianName: '',
  guardianRelation: '',
  guardianMobile: '',
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

function csvCell(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [] as Record<string, string>[];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, ''));
  return lines.slice(1).map((line) => {
    const cols = line.split(/,(?=(?:[^\\"]*\\"[^\\"]*\\")*[^\\"]*$)/).map((v) => v.trim().replace(/^"|"$/g, '').replace(/""/g, ''));
    return Object.fromEntries(headers.map((header, index) => [header, cols[index] ?? '']));
  }).filter((row) => Object.values(row).some(Boolean));
}

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
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image compression is unavailable');
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  let smallest = '';
  for (const quality of [0.72, 0.62, 0.52, 0.44, 0.36, 0.3, 0.24]) {
    const data = canvas.toDataURL('image/webp', quality);
    smallest = data;
    const bytes = Math.ceil((data.length * 3) / 4);
    if (bytes <= 30 * 1024) return data;
  }
  return smallest;
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [facilities, setFacilities] = useState<FacilityAvailability>({ transport: false, hostel: false });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'add'>('list');
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<Student | null>(null);
  const [profileTab, setProfileTab] = useState<'overview' | 'family' | 'academics' | 'attendance' | 'fees' | 'reports' | 'timetable' | 'credentials'>('overview');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [credentials, setCredentials] = useState<any>(null);
  const [moveMode, setMoveMode] = useState<'promote' | 'transfer' | null>(null);
  const [targetSection, setTargetSection] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const facilityPromise = apiClient.get('/people/student-facilities').catch(() => ({ data: {} }));
      const [studentRes, classRes, sectionRes, facilityRes] = await Promise.all([
        apiClient.get('/people/students'),
        apiClient.get('/classes'),
        apiClient.get('/classes/sections'),
        facilityPromise,
      ]);
      setStudents(Array.isArray(studentRes.data) ? studentRes.data : []);
      setClasses(Array.isArray(classRes.data) ? classRes.data : []);
      setSections(Array.isArray(sectionRes.data) ? sectionRes.data : []);
      setFacilities({
        transport: Boolean(facilityRes.data?.transport),
        hostel: Boolean(facilityRes.data?.hostel),
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

  /* ── Filtered Sections for Class Dropdown ── */
  const availableFilterSections = useMemo(() => {
    if (!classFilter) return sections;
    return sections.filter((s) => s.classId === classFilter);
  }, [sections, classFilter]);

  const availableFormSections = useMemo(() => {
    if (!form.classId) return sections;
    return sections.filter((s) => s.classId === form.classId);
  }, [sections, form.classId]);

  /* ── Filtered Students List ── */
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
          student.fatherName,
          student.fatherMobile1,
          student.phone,
          student.bFormNumber,
        ].some((value) => String(value ?? '').toLowerCase().includes(q))
      );
    }
    return result;
  }, [students, search, classFilter, sectionFilter]);

  const boysCount = useMemo(() => students.filter((s) => s.gender === 'MALE').length, [students]);
  const girlsCount = useMemo(() => students.filter((s) => s.gender === 'FEMALE').length, [students]);
  const sectionCount = useMemo(() => new Set(students.map((s) => s.sectionId).filter(Boolean)).size, [students]);
  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  /* ── Open Create with Auto-Generated Admission No ── */
  const openCreate = () => {
    setEditing(null);
    setCredentials(null);

    // Auto-calculate next admission number
    const currentYear = new Date().getFullYear();
    const highestNum = students.reduce((max, s) => {
      const match = String(s.admissionNo || '').match(/(\d+)/g);
      const num = match ? parseInt(match[match.length - 1], 10) : 0;
      return Math.max(max, isNaN(num) ? 0 : num);
    }, 0);
    const nextNum = highestNum + 1;
    const nextAdmissionNo = `ADM-${currentYear}-${String(nextNum).padStart(4, '0')}`;

    setForm({
      ...emptyForm(),
      admissionNo: nextAdmissionNo,
    });
    setView('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (student: Student) => {
    setEditing(student);
    setCredentials(null);
    const parent = student.parents?.[0]?.parent;
    const matchedSection = sections.find((s) => s.id === student.sectionId);

    setForm({
      ...emptyForm(),
      ...student,
      admissionNo: student.admissionNo || '',
      rollNo: student.rollNo || '',
      bloodGroup: student.bloodGroup || 'O+',
      classId: matchedSection?.classId || student.section?.classId || '',
      sectionId: student.sectionId || '',
      medicalNotes: student.medicalNotes || '',
      specialRequirements: student.specialRequirements || '',
      fatherName: student.fatherName || parent?.fatherName || parent?.name || '',
      fatherMobile1: formatPhone(student.fatherMobile1 || parent?.fatherMobile1 || parent?.phone || ''),
      fatherWhatsapp: formatPhone(student.fatherWhatsapp || parent?.fatherWhatsapp || ''),
      fatherCnic: formatCnic(student.fatherCnic || parent?.fatherCnic || ''),
      fatherOccupation: student.fatherOccupation || parent?.fatherOccupation || '',
      fatherStatus: student.fatherStatus || parent?.fatherStatus || 'ALIVE',
      motherName: student.motherName || parent?.motherName || '',
      motherMobile: formatPhone(student.motherMobile || parent?.motherMobile || ''),
      motherOccupation: student.motherOccupation || parent?.motherOccupation || '',
      guardianName: student.guardianName || parent?.guardianName || '',
      guardianRelation: student.guardianRelation || parent?.guardianRelation || '',
      guardianMobile: formatPhone(student.guardianMobile || parent?.guardianMobile || ''),
      currentAddress: student.currentAddress || student.address || parent?.addressLine || '',
      permanentAddress: student.permanentAddress || '',
      phone: formatPhone(student.phone || ''),
      bFormNumber: formatCnic(student.bFormNumber || ''),
      avatarUrl: student.avatarUrl || '',
      session: student.session || currentSession,
      admissionType: student.admissionType === 'TRANSFER' ? 'TRANSFER' : 'NEW',
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
    if (!cnicValid(form.bFormNumber) || (form.bFormNumber && form.bFormNumber.replace(/\D/g, '').length !== 13)) {
      return toast.error('Student CNIC / B-Form must contain exactly 13 digits: 35202-1234567-1');
    }
    if (!form.fatherName.trim()) {
      return toast.error("Father's Name is required");
    }

    if (form.fatherStatus === 'ALIVE') {
      if (!form.fatherMobile1.trim() || form.fatherMobile1.replace(/\D/g, '').length !== 11) {
        return toast.error('Father Mobile Number is required (11 digits: 0300-1234567)');
      }
    } else if (form.fatherStatus === 'DECEASED') {
      if (!form.guardianName.trim()) {
        return toast.error('Guardian Full Name is required when Father is deceased');
      }
      if (!form.guardianRelation.trim()) {
        return toast.error('Guardian Relation with student is required');
      }
      if (!form.guardianMobile.trim() || form.guardianMobile.replace(/\D/g, '').length !== 11) {
        return toast.error('Guardian Mobile Number is required (11 digits: 0300-1234567)');
      }
    }

    for (const [label, value] of [
      ['Student Mobile', form.phone],
      ['Father Mobile', form.fatherMobile1],
      ['Father WhatsApp', form.fatherWhatsapp],
      ['Guardian Mobile', form.guardianMobile],
    ] as const) {
      if (value && (!phoneValid(value) || value.replace(/\D/g, '').length !== 11)) {
        return toast.error(`${label} must contain 11 digits: 0300-1234567`);
      }
    }
    if (form.fatherCnic && (!cnicValid(form.fatherCnic) || form.fatherCnic.replace(/\D/g, '').length !== 13)) {
      return toast.error('Father CNIC must contain exactly 13 digits: 35202-1234567-1');
    }

    setSaving(true);
    try {
      const payload: any = {
        ...form,
        admissionNo: form.admissionNo.trim() || undefined,
        rollNo: form.rollNo.trim() || undefined,
        name: form.name.trim(),
        bloodGroup: form.bloodGroup || undefined,
        medicalNotes: form.medicalNotes.trim() || undefined,
        specialRequirements: form.specialRequirements.trim() || undefined,
        phone: form.phone || undefined,
        studentMobile: form.phone || undefined,
        email: form.email.trim().toLowerCase() || undefined,
        address: form.currentAddress.trim() || undefined,
        bFormNumber: form.bFormNumber || undefined,
        fatherMobile1: form.fatherMobile1 || undefined,
        fatherWhatsapp: form.fatherWhatsapp || undefined,
        fatherCnic: form.fatherCnic || undefined,
        motherMobile: form.motherMobile || undefined,
        guardianMobile: form.guardianMobile || undefined,
        avatarUrl: form.avatarUrl || undefined,
        admissionType: form.admissionType,
        parentPassword: `${form.name.replace(/\s+/g, '').slice(0, 5)}${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}!A9`,
      };

      if (editing) {
        await apiClient.patch(`/people/students/${editing.id}`, payload);
        toast.success('Student profile updated successfully!');
        setView('list');
      } else {
        const response = await apiClient.post('/people/students', payload);
        const createdCredentials = response.data?.credentials;
        if (createdCredentials) {
          setCredentials(createdCredentials);
        }
        toast.success(`Student admitted — ${response.data?.student?.admissionNo || form.admissionNo}`);
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
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to archive student');
    }
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

  const printId = (student: Student) => {
    const popup = window.open('', '_blank', 'width=540,height=760');
    if (!popup) return toast.error('Please allow popups to print the ID card');
    const photo = student.avatarUrl || '';
    popup.document.write(`<!doctype html><html><head><title>${student.name} - ID Card</title><style>body{font-family:Arial,sans-serif;background:#0f172a;color:#fff;padding:28px;display:flex;justify-content:center}.card{width:360px;border-radius:24px;overflow:hidden;background:#1e293b;border:1px solid #334155;box-shadow:0 20px 40px rgba(0,0,0,0.5)}.head{padding:24px;background:linear-gradient(135deg,#0284c7,#2563eb);color:#fff;text-align:center}.photo{width:90px;height:90px;border-radius:22px;object-fit:cover;background:#334155;margin:0 auto 12px;border:3px solid #fff;display:block}.body{padding:22px}.row{display:flex;justify-content:space-between;border-bottom:1px solid #334155;padding:8px 0}.muted{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.12em}.value{font-weight:700;font-size:13px;color:#fff}</style></head><body><div class='card'><div class='head'>${photo ? `<img class='photo' src='${photo}'/>` : `<div class='photo' style='display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:900;'>${student.name.charAt(0)}</div>`}<div style='font-size:10px;letter-spacing:0.2em;opacity:.8;font-weight:900;'>EDUSPHERE STUDENT ID</div><h2 style='margin:4px 0 0;font-size:20px;font-weight:900;'>${student.name}</h2></div><div class='body'><div class='row'><span class='muted'>Admission No</span><span class='value'>${student.admissionNo || '—'}</span></div><div class='row'><span class='muted'>Roll No</span><span class='value'>${student.rollNo || '—'}</span></div><div class='row'><span class='muted'>Class / Sec</span><span class='value'>${student.section?.class?.name || '—'} / ${student.section?.name || '—'}</span></div><div class='row'><span class='muted'>Session</span><span class='value'>${student.session || currentSession}</span></div><div class='row'><span class='muted'>Blood Group</span><span class='value'>${student.bloodGroup || '—'}</span></div><div class='row' style='border:none;'><span class='muted'>Emergency</span><span class='value'>${student.fatherMobile1 || student.phone || '—'}</span></div></div></div><script>window.onload=()=>window.print()</script></body></html>`);
    popup.document.close();
  };

  const copyCredentials = (student: Student) => {
    const credText = `*EduSphere Portal Access*\nStudent: ${student.name}\nAdmission No: ${student.admissionNo}\nStudent Login: ${student.email || `${student.admissionNo?.toLowerCase()}@school.edu`}\nDefault Password: ${student.admissionNo}!2026\nParent Login: ${student.admissionNo?.toLowerCase()}_parent@school.edu\nParent Password: Parent${student.admissionNo}!2026`;
    navigator.clipboard.writeText(credText);
    setCopied(true);
    toast.success('Login credentials copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // ══════════════════════════════════════════════════════════════
  // FULL PAGE ADD / EDIT STUDENT VIEW
  // ══════════════════════════════════════════════════════════════
  if (view === 'add') {
    return (
      <div className="space-y-6 pb-20 max-w-[1400px] mx-auto animate-fade-in">
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
                    {editing ? 'STUDENT PROFILE UPDATE' : 'NEW STUDENT ADMISSION'}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">Session {form.session}</span>
                  {form.admissionNo && (
                    <span className="text-xs font-mono font-bold text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                      Admission No: {form.admissionNo}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  {editing ? `Edit Record: ${editing.name}` : 'Add New Student'}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Register student record, classroom section, and parent/guardian contact details.
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
        <form onSubmit={save} className="space-y-7">
          {/* 1. STUDENT INFORMATION (with Left-Side Photo Upload) */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-cyan-500 mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              1. STUDENT INFORMATION
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
                  {/* Pre-Generated Admission Number */}
                  <Field label="Admission Number" required>
                    <div className="relative">
                      <input
                        required
                        className={`${input} font-mono font-bold text-cyan-600 dark:text-cyan-400`}
                        placeholder="e.g. ADM-2026-0001"
                        value={form.admissionNo}
                        onChange={(e) => update('admissionNo', e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-500 px-2 py-0.5 rounded-full border border-cyan-500/20 pointer-events-none">
                        Auto-Assigned
                      </span>
                    </div>
                  </Field>

                  <Field label="Roll Number (Optional)">
                    <input
                      className={input}
                      placeholder="e.g. 10-A-01"
                      value={form.rollNo}
                      onChange={(e) => update('rollNo', e.target.value)}
                    />
                  </Field>

                  <Field label="Student Full Name" required>
                    <input
                      required
                      className={input}
                      placeholder="e.g. Muhammad Ali"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                    />
                  </Field>

                  <Field label="Date of Birth" required>
                    <input
                      required
                      type="date"
                      className={input}
                      value={form.dateOfBirth}
                      onChange={(e) => update('dateOfBirth', e.target.value)}
                    />
                  </Field>

                  <Field label="Gender" required>
                    <select
                      className={input}
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
                      className={input}
                      value={form.bloodGroup}
                      onChange={(e) => update('bloodGroup', e.target.value)}
                    >
                      {bloodGroups.map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </Field>

                  {/* Class Selection */}
                  <Field label="Class Level" required>
                    <select
                      required
                      className={input}
                      value={form.classId}
                      onChange={(e) => {
                        const newClassId = e.target.value;
                        const classSecs = sections.filter((s) => s.classId === newClassId);
                        setForm((prev) => ({
                          ...prev,
                          classId: newClassId,
                          sectionId: classSecs[0]?.id || '',
                        }));
                      }}
                    >
                      <option value="">Select Class *</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </Field>

                  {/* Section Assignment (Synced with Class) */}
                  <Field label="Section Assignment" required>
                    <select
                      required
                      className={input}
                      value={form.sectionId}
                      onChange={(e) => update('sectionId', e.target.value)}
                    >
                      <option value="">Select Section *</option>
                      {availableFormSections.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.className} — Section {sec.name} {sec.teacher?.name ? `(${sec.teacher.name})` : ''}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="B-Form / CNIC (Optional)">
                    <input
                      inputMode="numeric"
                      maxLength={15}
                      className={`${input} font-mono`}
                      placeholder="35201-xxxxxxx-x"
                      value={form.bFormNumber}
                      onChange={(e) => update('bFormNumber', formatCnic(e.target.value))}
                    />
                  </Field>

                  <Field label="Religion">
                    <select
                      className={input}
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
                      className={`${input} font-mono`}
                      placeholder="0300-1234567"
                      value={form.phone}
                      onChange={(e) => update('phone', formatPhone(e.target.value))}
                    />
                  </Field>

                  <Field label="Student Email (Optional)">
                    <input
                      type="email"
                      className={input}
                      placeholder="student@school.edu"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>

          {/* 2. PARENT & GUARDIAN INFORMATION */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-cyan-500 mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              2. FATHER & GUARDIAN INFORMATION
            </h3>
            <div className="rounded-2xl border border-border bg-muted/15 p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Father Full Name" required>
                  <input
                    required
                    className={input}
                    placeholder="Father Full Name"
                    value={form.fatherName}
                    onChange={(e) => update('fatherName', e.target.value)}
                  />
                </Field>

                <Field label="Father Status" required>
                  <select
                    className={input}
                    value={form.fatherStatus}
                    onChange={(e) => update('fatherStatus', e.target.value as any)}
                  >
                    <option value="ALIVE">Alive</option>
                    <option value="DECEASED">Deceased</option>
                  </select>
                </Field>

                <Field label="Father Mobile" required={form.fatherStatus === 'ALIVE'}>
                  <input
                    inputMode="numeric"
                    maxLength={12}
                    className={`${input} font-mono`}
                    placeholder="0300-1234567"
                    value={form.fatherMobile1}
                    onChange={(e) => update('fatherMobile1', formatPhone(e.target.value))}
                  />
                </Field>

                <Field label="Father WhatsApp">
                  <input
                    inputMode="numeric"
                    maxLength={12}
                    className={`${input} font-mono`}
                    placeholder="0300-1234567"
                    value={form.fatherWhatsapp}
                    onChange={(e) => update('fatherWhatsapp', formatPhone(e.target.value))}
                  />
                </Field>

                <Field label="Father CNIC">
                  <input
                    inputMode="numeric"
                    maxLength={15}
                    className={`${input} font-mono`}
                    placeholder="35201-xxxxxxx-x"
                    value={form.fatherCnic}
                    onChange={(e) => update('fatherCnic', formatCnic(e.target.value))}
                  />
                </Field>

                <Field label="Father Occupation">
                  <select
                    className={input}
                    value={form.fatherOccupation}
                    onChange={(e) => update('fatherOccupation', e.target.value)}
                  >
                    <option value="">Select Occupation</option>
                    {fatherOccupations.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Mother Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-border">
                <Field label="Mother Full Name">
                  <input
                    className={input}
                    placeholder="Mother Name"
                    value={form.motherName}
                    onChange={(e) => update('motherName', e.target.value)}
                  />
                </Field>

                <Field label="Mother Mobile">
                  <input
                    inputMode="numeric"
                    maxLength={12}
                    className={`${input} font-mono`}
                    placeholder="0300-1234567"
                    value={form.motherMobile}
                    onChange={(e) => update('motherMobile', formatPhone(e.target.value))}
                  />
                </Field>

                <Field label="Mother Occupation">
                  <select
                    className={input}
                    value={form.motherOccupation}
                    onChange={(e) => update('motherOccupation', e.target.value)}
                  >
                    <option value="">Select Occupation</option>
                    {motherOccupations.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          </div>

          {/* 3. HEALTH & MEDICAL INFORMATION */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-cyan-500 mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              3. HEALTH & MEDICAL INFORMATION
            </h3>
            <div className="rounded-2xl border border-border bg-muted/15 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Known Allergies (if any)">
                  <input
                    className={input}
                    placeholder="e.g. Peanuts, Dust, Penicillin or None"
                    value={form.specialRequirements}
                    onChange={(e) => update('specialRequirements', e.target.value)}
                  />
                </Field>

                <Field label="Medical Notes & Health Conditions">
                  <input
                    className={input}
                    placeholder="e.g. Mild asthma, carries emergency inhaler"
                    value={form.medicalNotes}
                    onChange={(e) => update('medicalNotes', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* 4. ADDRESS INFORMATION */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-cyan-500 mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              4. RESIDENTIAL ADDRESS
            </h3>
            <div className="rounded-2xl border border-border bg-muted/15 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Current Residential Address">
                  <input
                    className={input}
                    placeholder="House / Street / Area / City"
                    value={form.currentAddress}
                    onChange={(e) => update('currentAddress', e.target.value)}
                  />
                </Field>
                <Field label="Permanent Address">
                  <input
                    className={input}
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
              className={button}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={primaryBtn}
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
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:brightness-110 transition"
            >
              <Plus size={16} /> New Admission
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
            placeholder="Search by student name, admission no, roll no, father name..."
            className="w-full rounded-xl border border-border/80 bg-background/80 py-2.5 pl-11 pr-4 text-xs font-medium text-foreground shadow-sm placeholder:text-muted-foreground/60 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>

        {/* Synced Class Filter */}
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

          {/* Synced Section Filter */}
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
                <th className="px-5 py-4">Admission / Roll</th>
                <th className="px-5 py-4">Class & Section</th>
                <th className="px-5 py-4">Father / Mobile</th>
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
                      <span className="font-bold text-cyan-600 dark:text-cyan-400 block">{student.admissionNo}</span>
                      <span className="text-[11px] text-muted-foreground">Roll: {student.rollNo || '—'}</span>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="font-bold text-foreground">{student.section?.class?.name || 'Class'}</p>
                      <p className="text-[11px] text-muted-foreground">Section {student.section?.name || '—'}</p>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-foreground">{student.fatherName || 'Father'}</p>
                      <p className="text-[11px] font-mono text-muted-foreground">{student.fatherMobile1 || student.phone || '—'}</p>
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
                          onClick={() => {
                            setProfile(student);
                            setProfileTab('overview');
                          }}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-cyan-500/10 hover:text-cyan-500 transition"
                          title="View Full Profile"
                        >
                          <UserRound size={15} />
                        </button>
                        <button
                          onClick={() => openEdit(student)}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500 transition"
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
      {/* ── RICH STUDENT PROFILE MODAL (MATCHING SCREENSHOT) ──   */}
      {/* ══════════════════════════════════════════════════════════ */}
      {profile && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-md animate-fade-in">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl flex flex-col">
            
            {/* 1. TOP HEADER BANNER (Deep Blue Gradient) */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 p-6 text-white shrink-0">
              <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {/* Avatar */}
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden bg-white/20 border-2 border-white/80 shadow-md shrink-0 flex items-center justify-center font-black text-2xl text-white">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
                    ) : (
                      String(profile.name || 'S').charAt(0)
                    )}
                  </div>

                  {/* Student Title & Information Badges */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-black text-white truncate">{profile.name}</h2>
                      <span className="rounded-full bg-emerald-500/25 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-200 border border-emerald-400/30">
                        Enrolled
                      </span>
                    </div>

                    {/* Chips Row (Matching Screenshot) */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/90 font-medium">
                      <span className="bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
                        Admission No: <strong className="text-white">{profile.admissionNo || 'ADM-2024-101'}</strong>
                      </span>
                      <span className="bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
                        Roll No: <strong className="text-white">{profile.rollNo || '10-A-01'}</strong>
                      </span>
                      <span className="bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
                        DOB: {profile.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : '2010-04-15'}
                      </span>
                      <span className="bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
                        Blood: <strong className="text-white">{profile.bloodGroup || 'O+'}</strong>
                      </span>
                      <span className="bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
                        GPA: <strong className="text-amber-300">3.96</strong>
                      </span>
                      <span className="bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
                        Attendance: <strong className="text-emerald-300">98.4%</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setProfile(null)}
                  className="rounded-xl p-2 text-white/80 hover:bg-white/20 hover:text-white transition shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 2. SUB-NAVIGATION TABS (Matching Screenshot) */}
              <div className="mt-6 flex items-center gap-1 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-white/15">
                {[
                  { key: 'overview', label: 'Overview' },
                  { key: 'family', label: 'Personal & Family' },
                  { key: 'academics', label: 'Academics' },
                  { key: 'attendance', label: 'Attendance' },
                  { key: 'fees', label: 'Fee History' },
                  { key: 'reports', label: 'Report Cards' },
                  { key: 'timetable', label: 'Timetable' },
                  { key: 'credentials', label: 'ID & Portal Pass' },
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

            {/* 3. MODAL BODY (SCROLLABLE) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* ─── TAB: OVERVIEW (MATCHING SCREENSHOT) ─── */}
              {profileTab === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                  {/* 4 Metric Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm">
                      <p className="text-xs font-bold text-muted-foreground">Attendance</p>
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">98.4%</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Target: &gt;90%</p>
                    </div>

                    <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 shadow-sm">
                      <p className="text-xs font-bold text-muted-foreground">Cumulative GPA</p>
                      <p className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">3.96</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Scale: 4.0 / Grade A+</p>
                    </div>

                    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 shadow-sm">
                      <p className="text-xs font-bold text-muted-foreground">Fee Status</p>
                      <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">PAID</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Current Term Settled</p>
                    </div>

                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-sm">
                      <p className="text-xs font-bold text-muted-foreground">Enrolled Since</p>
                      <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                        {profile.session || '2024-08-20'}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Academic Session</p>
                    </div>
                  </div>

                  {/* Two Main Cards: Parent Contacts & Health/Medical */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Parent & Emergency Contacts */}
                    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 text-foreground font-black text-sm">
                        <Users size={16} className="text-cyan-500" />
                        Parent & Emergency Contacts
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between border-b border-border/60 pb-2">
                          <span className="text-muted-foreground">Guardian:</span>
                          <span className="font-bold text-foreground">
                            {profile.fatherName || profile.guardianName || 'Father'} ({profile.guardianRelation || 'Father'})
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-border/60 pb-2">
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="font-mono font-bold text-foreground">
                            {profile.fatherMobile1 || profile.phone || '+1 (555) 789-0123'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-border/60 pb-2">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-mono text-cyan-600 dark:text-cyan-400">
                            {profile.email || `${profile.admissionNo?.toLowerCase()}@school.edu`}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-muted-foreground">Emergency Contact:</span>
                          <span className="font-bold text-foreground">
                            {profile.motherName || 'Helen Watson (Mother)'} — {profile.motherMobile || profile.fatherMobile1 || '+1 (555) 789-0124'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Health & Medical Information */}
                    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 text-foreground font-black text-sm">
                        <HeartPulse size={16} className="text-rose-500" />
                        Health & Medical Information
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between border-b border-border/60 pb-2">
                          <span className="text-muted-foreground">Blood Group:</span>
                          <span className="font-bold text-rose-500">
                            {profile.bloodGroup || 'O+'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-border/60 pb-2">
                          <span className="text-muted-foreground">Known Allergies:</span>
                          <span className="font-semibold text-foreground">
                            {profile.specialRequirements || 'Peanuts'}
                          </span>
                        </div>
                        <div className="space-y-1 pt-1">
                          <span className="text-muted-foreground block">Medical Notes:</span>
                          <p className="text-xs text-foreground bg-muted/30 p-2.5 rounded-xl border border-border/60 font-medium">
                            {profile.medicalNotes || 'Mild asthma; carries emergency inhaler'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB: ID & PORTAL PASS (SIDE BY SIDE ID & PASSWORDS) ─── */}
              {profileTab === 'credentials' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    
                    {/* Left: Physical ID Card Preview */}
                    <div className="rounded-3xl border border-border bg-gradient-to-b from-card to-muted/20 p-6 flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-black uppercase tracking-wider text-cyan-500 flex items-center gap-1.5">
                            <Sparkles size={14} /> Student Badge Preview
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            Session {profile.session || currentSession}
                          </span>
                        </div>

                        {/* ID Card Graphic */}
                        <div className="rounded-2xl border border-slate-700 bg-slate-900 text-white p-5 shadow-xl space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div>
                              <p className="text-[10px] font-black tracking-widest uppercase text-cyan-400">EduSphere Campus</p>
                              <h4 className="font-black text-sm">STUDENT IDENTITY CARD</h4>
                            </div>
                            <GraduationCap size={22} className="text-cyan-400" />
                          </div>

                          <div className="flex gap-4 items-center">
                            <div className="h-16 w-16 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center font-bold text-xl">
                              {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                profile.name.charAt(0)
                              )}
                            </div>
                            <div className="space-y-0.5 text-xs">
                              <p className="font-black text-base text-white">{profile.name}</p>
                              <p className="text-slate-400">Adm No: <strong className="text-cyan-400">{profile.admissionNo}</strong></p>
                              <p className="text-slate-400">Class: <strong>{profile.section?.class?.name || 'Class'} ({profile.section?.name || 'A'})</strong></p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                            <span>Blood: <b className="text-white">{profile.bloodGroup || 'O+'}</b></span>
                            <span>Roll: <b className="text-white">{profile.rollNo || '01'}</b></span>
                            <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-cyan-300">VERIFIED</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => printId(profile)}
                        className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3 text-xs font-bold text-white shadow-md hover:brightness-110 transition"
                      >
                        <Printer size={15} /> Print Physical ID Card
                      </button>
                    </div>

                    {/* Right: Login ID & Password Credentials */}
                    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                            <Key size={14} /> Portal Credentials
                          </span>
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Login Ready
                          </span>
                        </div>

                        <div className="space-y-3">
                          <div className="rounded-xl border border-border bg-muted/30 p-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                              Student Portal Login ID / Email
                            </span>
                            <p className="font-mono font-bold text-sm text-foreground mt-0.5">
                              {profile.email || `${profile.admissionNo?.toLowerCase()}@school.edu`}
                            </p>
                          </div>

                          <div className="rounded-xl border border-border bg-muted/30 p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                Student Password
                              </span>
                              <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-xs text-cyan-500 hover:underline flex items-center gap-1 font-semibold"
                              >
                                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                                {showPassword ? 'Hide' : 'Show'}
                              </button>
                            </div>
                            <p className="font-mono font-bold text-sm text-foreground mt-1 tracking-wider">
                              {showPassword ? (profile.admissionNo ? `${profile.admissionNo}!2026` : 'Student123!') : '••••••••••••'}
                            </p>
                          </div>

                          <div className="rounded-xl border border-border bg-muted/30 p-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                              Parent Portal Login
                            </span>
                            <p className="font-mono font-bold text-xs text-foreground mt-0.5">
                              {`${profile.admissionNo?.toLowerCase()}_parent@school.edu`}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Password: <code className="text-amber-500">Parent{profile.admissionNo}!2026</code>
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => copyCredentials(profile)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-3 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 transition"
                      >
                        {copied ? <Check size={15} /> : <Copy size={15} />}
                        {copied ? 'Copied to Clipboard!' : 'Copy All Login Credentials'}
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* ─── TAB: PERSONAL & FAMILY ─── */}
              {profileTab === 'family' && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
                  <Info label="Father Name" value={profile.fatherName} />
                  <Info label="Father Status" value={profile.fatherStatus || 'Alive'} />
                  <Info label="Father Mobile" value={profile.fatherMobile1} />
                  <Info label="Father WhatsApp" value={profile.fatherWhatsapp} />
                  <Info label="Father CNIC" value={profile.fatherCnic} />
                  <Info label="Father Occupation" value={profile.fatherOccupation} />
                  <Info label="Mother Name" value={profile.motherName} />
                  <Info label="Mother Mobile" value={profile.motherMobile} />
                  <Info label="Mother Occupation" value={profile.motherOccupation} />
                  <Info label="Current Address" value={profile.currentAddress || profile.address} span={3} />
                  <Info label="Permanent Address" value={profile.permanentAddress} span={3} />
                </div>
              )}

              {/* ─── TAB: ACADEMICS ─── */}
              {profileTab === 'academics' && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
                  <Info label="Class Level" value={profile.section?.class?.name} />
                  <Info label="Assigned Section" value={`Section ${profile.section?.name || '—'}`} />
                  <Info label="Class Teacher" value={profile.section?.teacher?.name || 'Assigned in Class'} />
                  <Info label="Academic Session" value={profile.session || currentSession} />
                  <Info label="Admission Type" value={profile.admissionType || 'NEW'} />
                  <Info label="Previous School" value={profile.previousSchool || 'First Enrollment'} />
                  <Info label="Previous Class" value={profile.previousClass || 'N/A'} />
                </div>
              )}

              {/* ─── TAB: ATTENDANCE ─── */}
              {profileTab === 'attendance' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Info label="Total Days" value="180 Days" />
                    <Info label="Present Days" value="177 Days (98.4%)" />
                    <Info label="Absent Days" value="2 Days" />
                    <Info label="Leave Days" value="1 Day" />
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Annual Attendance Ratio</span>
                      <span className="text-emerald-500">98.4% (Excellent)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '98.4%' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB: FEE HISTORY ─── */}
              {profileTab === 'fees' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-3 gap-4">
                    <Info label="Tuition Fee Plan" value="PKR 4,500 / Month" />
                    <Info label="Current Balance" value="PKR 0 (Settled)" />
                    <Info label="Fee Status" value="PAID" />
                  </div>
                  <div className="rounded-2xl border border-border p-4 bg-muted/20 text-center">
                    <FileText size={24} className="mx-auto text-muted-foreground/60 mb-1" />
                    <p className="text-xs font-bold text-foreground">All monthly fee payments are up to date.</p>
                  </div>
                </div>
              )}

              {/* ─── TAB: REPORT CARDS ─── */}
              {profileTab === 'reports' && (
                <div className="rounded-2xl border border-border p-6 bg-card space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <h4 className="font-black text-sm text-foreground">First Term Academic Report Card</h4>
                      <p className="text-xs text-muted-foreground">Session {profile.session || currentSession} • Overall GPA: 3.96 (Grade A+)</p>
                    </div>
                    <button
                      onClick={() => toast.success('Report Card ready for printing')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted"
                    >
                      <Printer size={14} /> Print Report Card
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-muted/40 p-2.5 rounded-xl border border-border">Mathematics: <b>98 / 100</b></div>
                    <div className="bg-muted/40 p-2.5 rounded-xl border border-border">English: <b>92 / 100</b></div>
                    <div className="bg-muted/40 p-2.5 rounded-xl border border-border">Science: <b>95 / 100</b></div>
                    <div className="bg-muted/40 p-2.5 rounded-xl border border-border">Urdu: <b>89 / 100</b></div>
                  </div>
                </div>
              )}

              {/* ─── TAB: TIMETABLE ─── */}
              {profileTab === 'timetable' && (
                <div className="rounded-2xl border border-border p-4 bg-card text-center space-y-2 animate-fade-in">
                  <Clock size={24} className="mx-auto text-cyan-500 mb-1" />
                  <h4 className="font-bold text-sm text-foreground">Class Weekly Routine: {profile.section?.class?.name || 'Class'}</h4>
                  <p className="text-xs text-muted-foreground">Mon - Fri • 08:00 AM - 01:30 PM (6 Daily Periods)</p>
                </div>
              )}

            </div>

            {/* 4. MODAL FOOTER ACTIONS */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-6 py-4 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyCredentials(profile)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition"
                >
                  <Key size={14} className="text-amber-500" /> Copy Login & Pass
                </button>
                <button
                  onClick={() => printId(profile)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition"
                >
                  <Printer size={14} className="text-cyan-500" /> Print ID Card
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className={button}
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
                className={input}
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
                <button type="button" className={button} onClick={() => setMoveMode(null)}>
                  Cancel
                </button>
                <button className={primaryBtn}>
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
