import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRightLeft, ArrowUpRight, Camera, CheckSquare, Download, FileUp, GraduationCap,
  ImagePlus, Loader2, Pencil, Plus, Printer, RefreshCw, Search, Trash2,
  UserCheck, UserRound, Users, X, BookOpen, ShieldCheck, Mail, Phone, MapPin, AlertCircle, User
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

type Student = any;
type Teacher = { id: string; name: string; email?: string };
type Section = { id: string; name: string; capacity?: number; teacher?: Teacher | null; className: string; classId: string };
type FacilityAvailability = { transport: boolean; hostel: boolean };

type FormState = {
  name: string;
  dateOfBirth: string;
  gender: string;
  religion: string;
  bFormNumber: string;
  email: string;
  phone: string;
  admissionType: 'NEW' | 'TRANSFER';
  sectionId: string;
  session: string;
  previousSchool: string;
  previousClass: string;
  leavingCertificateUrl: string;
  previousAcademicRecord: string;
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
const guardianRelations = ['UNCLE', 'AUNT', 'GRANDPARENT', 'SIBLING', 'OTHER'];
const fatherOccupations = ['Business', 'Government Job', 'Private Job', 'Self Employed', 'Farmer', 'Overseas', 'Driver', 'Shopkeeper', 'Labour', 'Doctor', 'Engineer', 'Teacher', 'Other'];
const motherOccupations = ['Housewife', 'Government Job', 'Private Job', 'Business', 'Self Employed', 'Teacher', 'Doctor', 'Engineer', 'Other'];

const emptyForm = (): FormState => ({
  name: '', dateOfBirth: '', gender: 'MALE', religion: 'Muslim', bFormNumber: '', email: '', phone: '',
  admissionType: 'NEW', sectionId: '', session: currentSession,
  previousSchool: '', previousClass: '', leavingCertificateUrl: '', previousAcademicRecord: '',
  fatherName: '', fatherStatus: 'ALIVE', fatherMobile1: '', fatherWhatsapp: '', fatherCnic: '', fatherOccupation: '',
  motherName: '', motherMobile: '', motherOccupation: '',
  guardianName: '', guardianRelation: '', guardianMobile: '',
  currentAddress: '', permanentAddress: '',
  transportRequired: false, hostelRequired: false, avatarUrl: '',
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
  const [facilities, setFacilities] = useState<FacilityAvailability>({ transport: false, hostel: false });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'add'>('list');
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<Student | null>(null);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [credentials, setCredentials] = useState<any>(null);
  const [moveMode, setMoveMode] = useState<'promote' | 'transfer' | null>(null);
  const [targetSection, setTargetSection] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const facilityPromise = apiClient.get('/people/student-facilities').catch(() => ({ data: {} }));
      const [studentRes, classRes, facilityRes] = await Promise.all([
        apiClient.get('/people/students'),
        apiClient.get('/classes'),
        facilityPromise,
      ]);
      setStudents(Array.isArray(studentRes.data) ? studentRes.data : []);
      setClasses(Array.isArray(classRes.data) ? classRes.data : []);
      setFacilities({
        transport: Boolean(facilityRes.data?.transport),
        hostel: Boolean(facilityRes.data?.hostel),
      });
      setSelectedIds([]);
    } catch (error: any) {
      setStudents([]);
      setClasses([]);
      toast.error(error?.response?.data?.message || 'Unable to load student database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const sections: Section[] = useMemo(() => {
    return classes.flatMap((item: any) =>
      (item.sections || []).map((section: any) => ({
        ...section,
        className: item.name,
        classId: item.id,
      }))
    );
  }, [classes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((student) =>
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
  }, [students, search]);

  const boysCount = useMemo(() => students.filter((s) => s.gender === 'MALE').length, [students]);
  const girlsCount = useMemo(() => students.filter((s) => s.gender === 'FEMALE').length, [students]);
  const sectionCount = useMemo(() => new Set(students.map((s) => s.sectionId).filter(Boolean)).size, [students]);
  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openCreate = () => {
    setEditing(null);
    setCredentials(null);
    setForm(emptyForm());
    setView('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (student: Student) => {
    setEditing(student);
    setCredentials(null);
    const parent = student.parents?.[0]?.parent;
    setForm({
      ...emptyForm(),
      ...student,
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
      sectionId: student.sectionId || '',
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
      return toast.error('Student name and Class / Section are required');
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
        name: form.name.trim(),
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
        setCredentials(response.data?.credentials || null);
        toast.success(`Student admitted — ${response.data?.student?.admissionNo || 'Admission created'}`);
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
    if (!window.confirm('Archive this student? Existing school records will remain stored.')) return;
    try {
      await apiClient.delete(`/people/students/${id}`);
      setProfile(null);
      await load();
      toast.success('Student archived');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to archive student');
    }
  };

  const move = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!moveMode || !targetSection || !selectedIds.length) return;
    try {
      await apiClient.post(`/people/students/${moveMode}`, {
        studentIds: selectedIds,
        sectionId: targetSection,
        ...(moveMode === 'promote' ? { session: currentSession } : {}),
      });
      toast.success(`${selectedIds.length} student(s) ${moveMode === 'promote' ? 'promoted' : 'transferred'}`);
      setMoveMode(null);
      setTargetSection('');
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Unable to ${moveMode} students`);
    }
  };

  const exportCsv = () => {
    const rows = [
      ['Admission No', 'Name', 'Class', 'Section', 'Roll No', 'Religion', 'Admission Type', 'Previous School', 'Previous Class', 'Father Name', 'Father Mobile'],
      ...students.map((student) => [
        student.admissionNo,
        student.name,
        student.section?.class?.name,
        student.section?.name,
        student.rollNo,
        student.religion,
        student.admissionType,
        student.previousSchool,
        student.previousClass,
        student.fatherName,
        student.fatherMobile1,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'edusphere-students.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Students exported to CSV');
  };

  const importCsv = async (file: File) => {
    setImporting(true);
    try {
      const rows = parseCsv(await file.text());
      if (!rows.length) throw new Error('CSV contains no student rows');
      let created = 0;
      for (const row of rows) {
        if (!row.name || !row.sectionid) continue;
        await apiClient.post('/people/students', {
          name: row.name,
          sectionId: row.sectionid,
          email: row.email || undefined,
          studentMobile: row.studentmobile || row.phone || undefined,
          fatherName: row.fathername || undefined,
          fatherMobile1: row.fathermobile1 || row.fathermobile || undefined,
          dateOfBirth: row.dateofbirth || row.dob || undefined,
          gender: String(row.gender || 'MALE').toUpperCase(),
          religion: row.religion || 'Muslim',
          bFormNumber: row.bformnumber || row.cnic || undefined,
          session: row.session || currentSession,
          admissionType: row.admissiontype === 'TRANSFER' ? 'TRANSFER' : 'NEW',
          previousSchool: row.previousschool || undefined,
          previousClass: row.previousclass || undefined,
          previousAcademicRecord: row.previousacademicrecord || undefined,
          parentPassword: `${row.name.replace(/\s+/g, '').slice(0, 5)}${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}!A9`,
        });
        created += 1;
      }
      await load();
      toast.success(`${created} student(s) imported`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Student import failed');
    } finally {
      setImporting(false);
    }
  };

  const printId = (student: Student) => {
    const popup = window.open('', '_blank', 'width=540,height=760');
    if (!popup) return toast.error('Please allow popups to print the ID card');
    const photo = student.avatarUrl || '';
    popup.document.write(`<!doctype html><html><head><title>${student.name} - ID Card</title><style>body{font-family:Arial,sans-serif;background:#0f172a;color:#fff;padding:28px;display:flex;justify-content:center}.card{width:360px;border-radius:24px;overflow:hidden;background:#1e293b;border:1px solid #334155;box-shadow:0 20px 40px rgba(0,0,0,0.5)}.head{padding:24px;background:linear-gradient(135deg,#0284c7,#2563eb);color:#fff;text-align:center}.photo{width:90px;height:90px;border-radius:22px;object-fit:cover;background:#334155;margin:0 auto 12px;border:3px solid #fff;display:block}.body{padding:22px}.row{display:flex;justify-content:space-between;border-bottom:1px solid #334155;padding:8px 0}.muted{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.12em}.value{font-weight:700;font-size:13px;color:#fff}</style></head><body><div class='card'><div class='head'>${photo ? `<img class='photo' src='${photo}'/>` : `<div class='photo' style='display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:900;'>${student.name.charAt(0)}</div>`}<div style='font-size:10px;letter-spacing:0.2em;opacity:.8;font-weight:900;'>EDUSPHERE STUDENT ID</div><h2 style='margin:4px 0 0;font-size:20px;font-weight:900;'>${student.name}</h2></div><div class='body'><div class='row'><span class='muted'>Admission No</span><span class='value'>${student.admissionNo || '—'}</span></div><div class='row'><span class='muted'>Roll No</span><span class='value'>${student.rollNo || '—'}</span></div><div class='row'><span class='muted'>Class / Sec</span><span class='value'>${student.section?.class?.name || '—'} / ${student.section?.name || '—'}</span></div><div class='row'><span class='muted'>Session</span><span class='value'>${student.session || currentSession}</span></div><div class='row'><span class='muted'>Father</span><span class='value'>${student.fatherName || '—'}</span></div><div class='row' style='border:none;'><span class='muted'>Emergency</span><span class='value'>${student.fatherMobile1 || student.phone || '—'}</span></div></div></div><script>window.onload=()=>window.print()</script></body></html>`);
    popup.document.close();
  };

  // ══════════════════════════════════════════════════════════════
  // FULL PAGE ADD / EDIT STUDENT VIEW
  // ══════════════════════════════════════════════════════════════
  if (view === 'add') {
    return (
      <div className="space-y-6 pb-20 max-w-[1400px] mx-auto animate-fade-in">
        {/* Soft Cyan Aesthetic Header with Back Button */}
        <div className="overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-sky-500/5 to-card p-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center border border-cyan-500/25 shadow-inner">
                <GraduationCap size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    {editing ? 'STUDENT PROFILE UPDATE' : 'NEW STUDENT ADMISSION'}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">Session {form.session}</span>
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
                {/* LEFT SIDE PHOTO UPLOAD */}
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

                {/* RIGHT FORM FIELDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 w-full">
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

                  <Field label="Class / Section Assignment" required>
                    <select
                      required
                      className={input}
                      value={form.sectionId}
                      onChange={(e) => update('sectionId', e.target.value)}
                    >
                      <option value="">Select class / section *</option>
                      {sections.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.className} — Section {sec.name}
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

                  <Field label="Student Email (Optional)">
                    <input
                      type="email"
                      className={input}
                      placeholder="student@school.edu"
                      disabled={Boolean(editing)}
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                    />
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
                </div>
              </div>
            </div>
          </div>

          {/* 2. FATHER & GUARDIAN INFORMATION */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-cyan-500 mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              2. FATHER & GUARDIAN INFORMATION
            </h3>
            <div className="rounded-2xl border border-border bg-muted/15 p-6 space-y-5">
              {/* Father Primary Information */}
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
                    className={`${input} font-bold text-cyan-600 dark:text-cyan-400`}
                    value={form.fatherStatus}
                    onChange={(e) => update('fatherStatus', e.target.value as 'ALIVE' | 'DECEASED')}
                  >
                    <option value="ALIVE">Alive (حـیات)</option>
                    <option value="DECEASED">Deceased (مرحوم)</option>
                  </select>
                </Field>

                <Field label="Father Mobile Number" required={form.fatherStatus === 'ALIVE'}>
                  <input
                    required={form.fatherStatus === 'ALIVE'}
                    inputMode="numeric"
                    maxLength={12}
                    className={`${input} font-mono`}
                    placeholder="0300-1234567"
                    value={form.fatherMobile1}
                    onChange={(e) => update('fatherMobile1', formatPhone(e.target.value))}
                  />
                </Field>

                <Field label="Father WhatsApp (Optional)">
                  <input
                    inputMode="numeric"
                    maxLength={12}
                    className={`${input} font-mono`}
                    placeholder="0300-1234567"
                    value={form.fatherWhatsapp}
                    onChange={(e) => update('fatherWhatsapp', formatPhone(e.target.value))}
                  />
                </Field>

                <Field label="Father CNIC (Optional)">
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
                    <option value="">Select occupation</option>
                    {fatherOccupations.map((occ) => (
                      <option key={occ} value={occ}>{occ}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Conditional Guardian Details — Displayed ONLY if Father is Deceased */}
              {form.fatherStatus === 'DECEASED' && (
                <div className="pt-5 border-t border-amber-500/20 bg-amber-500/[0.04] p-5 rounded-2xl border space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-500">
                      Guardian Details (Required because Father is Deceased)
                    </h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Please provide the legal guardian contact details for school communication and student verification.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <Field label="Guardian Full Name" required>
                      <input
                        required
                        className={input}
                        placeholder="Guardian Full Name"
                        value={form.guardianName}
                        onChange={(e) => update('guardianName', e.target.value)}
                      />
                    </Field>

                    <Field label="Relation with Student" required>
                      <select
                        required
                        className={input}
                        value={form.guardianRelation}
                        onChange={(e) => update('guardianRelation', e.target.value)}
                      >
                        <option value="">Select relation *</option>
                        {guardianRelations.map((rel) => (
                          <option key={rel} value={rel}>{rel}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Guardian Mobile Number" required>
                      <input
                        required
                        inputMode="numeric"
                        maxLength={12}
                        className={`${input} font-mono`}
                        placeholder="0300-1234567"
                        value={form.guardianMobile}
                        onChange={(e) => update('guardianMobile', formatPhone(e.target.value))}
                      />
                    </Field>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. ACADEMIC & ADMISSION DETAILS */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-cyan-500 mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              3. ACADEMIC & ADMISSION DETAILS
            </h3>
            <div className="rounded-2xl border border-border bg-muted/15 p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Admission Type">
                  <select
                    className={input}
                    value={form.admissionType}
                    onChange={(e) => update('admissionType', e.target.value as 'NEW' | 'TRANSFER')}
                  >
                    <option value="NEW">Fresh New Admission</option>
                    <option value="TRANSFER">Transfer Student</option>
                  </select>
                </Field>

                <Field label="Academic Session">
                  <input className={input} value={form.session} onChange={(e) => update('session', e.target.value)} />
                </Field>

                <Field label="Sequential Roll Number">
                  <input className={`${input} bg-muted text-muted-foreground font-mono`} readOnly value={editing?.rollNo || 'Auto-generated on save'} />
                </Field>
              </div>

              {form.admissionType === 'TRANSFER' && (
                <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Previous School Name" required>
                    <input
                      required
                      className={input}
                      placeholder="Previous School Name"
                      value={form.previousSchool}
                      onChange={(e) => update('previousSchool', e.target.value)}
                    />
                  </Field>
                  <Field label="Previous Class" required>
                    <input
                      required
                      className={input}
                      placeholder="e.g. Class 8"
                      value={form.previousClass}
                      onChange={(e) => update('previousClass', e.target.value)}
                    />
                  </Field>
                  <Field label="Leaving Certificate URL">
                    <input
                      className={input}
                      placeholder="Document link"
                      value={form.leavingCertificateUrl}
                      onChange={(e) => update('leavingCertificateUrl', e.target.value)}
                    />
                  </Field>
                  <Field label="Previous Academic Summary">
                    <input
                      className={input}
                      placeholder="Previous grades / percentage"
                      value={form.previousAcademicRecord}
                      onChange={(e) => update('previousAcademicRecord', e.target.value)}
                    />
                  </Field>
                </div>
              )}
            </div>
          </div>

          {/* 4. RESIDENTIAL ADDRESS & CAMPUS SERVICES */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-cyan-500 mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              4. RESIDENTIAL ADDRESS & CAMPUS SERVICES
            </h3>
            <div className="rounded-2xl border border-border bg-muted/15 p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Current Residential Address" required>
                  <textarea
                    required
                    rows={2}
                    className={input}
                    placeholder="House No, Street, Area, City"
                    value={form.currentAddress}
                    onChange={(e) => update('currentAddress', e.target.value)}
                  />
                </Field>
                <Field label="Permanent Family Address">
                  <textarea
                    rows={2}
                    className={input}
                    placeholder="Permanent Address"
                    value={form.permanentAddress}
                    onChange={(e) => update('permanentAddress', e.target.value)}
                  />
                </Field>
              </div>

              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.transportRequired}
                    onChange={(e) => update('transportRequired', e.target.checked)}
                    className="h-4 w-4 rounded border-border text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>Require School Bus / Transport</span>
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.hostelRequired}
                    onChange={(e) => update('hostelRequired', e.target.checked)}
                    className="h-4 w-4 rounded border-border text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>Require School Hostel Facility</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              type="button"
              className={button}
              onClick={() => setView('list')}
            >
              <ArrowLeft size={16} /> Cancel & Return
            </button>
            <button className={primaryBtn} disabled={saving || compressing}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              {editing ? 'Save Changes' : '+ Complete Admission'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // LIST VIEW WITH AESTHETIC CARDS (Total Students, Boys, Girls, Sections)
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 pb-12 max-w-[1500px] mx-auto">
      {/* ── Top Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-500">PEOPLE MANAGEMENT</p>
          <h1 className="mt-1 text-3xl sm:text-4xl font-black tracking-tight text-foreground">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">Live database records — registered campus students.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button className={button} onClick={() => void load()} title="Refresh database">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className={button} onClick={exportCsv} title="Export CSV spreadsheet">
            <Download size={15} /> Export CSV
          </button>
          <label className={`${button} cursor-pointer`}>
            <FileUp size={15} />
            {importing ? 'Importing…' : 'Import CSV'}
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={importing}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importCsv(file);
                event.currentTarget.value = '';
              }}
            />
          </label>
          <button className={primaryBtn} onClick={openCreate}>
            <Plus size={16} /> Add Student
          </button>
        </div>
      </div>

      {/* ── 4 Soft Gradient KPI Stat Cards (Total Students, Boys, Girls, Sections) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL STUDENTS (Cyan) */}
        <div className="relative overflow-hidden rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/[0.08] via-card/80 to-card p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-cyan-500">TOTAL STUDENTS</p>
              <h3 className="mt-2 text-3xl font-black text-foreground">{students.length}</h3>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shadow-sm">
              <GraduationCap size={22} strokeWidth={2.2} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span>Enrolled in campus</span>
          </div>
        </div>

        {/* BOYS (Blue/Cyan) */}
        <div className="relative overflow-hidden rounded-3xl border border-blue-500/25 bg-gradient-to-br from-blue-500/[0.08] via-card/80 to-card p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-blue-500">BOYS (MALE)</p>
              <h3 className="mt-2 text-3xl font-black text-foreground">{boysCount}</h3>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-sm">
              <User size={22} strokeWidth={2.2} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <span>Male student cohort</span>
          </div>
        </div>

        {/* GIRLS (Rose/Pink) */}
        <div className="relative overflow-hidden rounded-3xl border border-rose-500/25 bg-gradient-to-br from-rose-500/[0.08] via-card/80 to-card p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-rose-500">GIRLS (FEMALE)</p>
              <h3 className="mt-2 text-3xl font-black text-foreground">{girlsCount}</h3>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-sm">
              <User size={22} strokeWidth={2.2} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            <span>Female student cohort</span>
          </div>
        </div>

        {/* ACTIVE SECTIONS (Purple) */}
        <div className="relative overflow-hidden rounded-3xl border border-purple-500/25 bg-gradient-to-br from-purple-500/[0.08] via-card/80 to-card p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-purple-500">SECTIONS</p>
              <h3 className="mt-2 text-3xl font-black text-foreground">{sectionCount || 1}</h3>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20 shadow-sm">
              <BookOpen size={22} strokeWidth={2.2} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            <span>Across {classes.length || 1} class grades</span>
          </div>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className={`${input} pl-11 py-3`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, admission no, class, section or roll no..."
            />
          </div>
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 shrink-0 bg-cyan-500/10 p-1.5 rounded-xl border border-cyan-500/20">
              <span className="text-[10px] font-black uppercase text-cyan-500 px-2">{selectedIds.length} Selected:</span>
              <button className={button} onClick={() => setMoveMode('promote')}>
                <ArrowUpRight size={14} /> Promote
              </button>
              <button className={button} onClick={() => setMoveMode('transfer')}>
                <ArrowRightLeft size={14} /> Transfer
              </button>
              <button
                className={button}
                onClick={() =>
                  selectedIds
                    .map((id) => students.find((student) => student.id === id))
                    .filter(Boolean)
                    .forEach((student) => printId(student))
                }
              >
                <Printer size={14} /> Print ID
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Students Table ── */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead className="border-b border-border bg-muted/40 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="px-5 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => setSelectedIds(allSelected ? [] : filtered.map((s) => s.id))}
                    className="h-4 w-4 rounded border-border text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                  />
                </th>
                <th className="px-5 py-4">STUDENT</th>
                <th className="px-5 py-4">ADMISSION</th>
                <th className="px-5 py-4">CLASS / SECTION</th>
                <th className="px-5 py-4">ROLL</th>
                <th className="px-5 py-4">FATHER CONTACT</th>
                <th className="px-5 py-4">STATUS</th>
                <th className="px-5 py-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center">
                    <Loader2 className="mx-auto animate-spin text-cyan-500" size={32} />
                    <p className="mt-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Loading live student database…</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center text-sm text-muted-foreground">
                    <p className="font-bold text-foreground text-base">No students found in the live database.</p>
                    <p className="text-xs text-muted-foreground mt-1">Adjust search parameters or click '+ Add Student' above.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-cyan-500/[0.03] transition-colors cursor-pointer"
                    onClick={() => setProfile(student)}
                  >
                    <td className="px-5 py-4 w-12" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(student.id)}
                        onChange={() =>
                          setSelectedIds((current) =>
                            current.includes(student.id) ? current.filter((id) => id !== student.id) : [...current, student.id]
                          )
                        }
                        className="h-4 w-4 rounded border-border text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 text-white font-black flex items-center justify-center shadow-md text-sm border border-white/10">
                          {student.avatarUrl ? (
                            <img src={student.avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            String(student.name || 'S').charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-foreground hover:text-cyan-500 transition-colors truncate">{student.name}</div>
                          <div className="text-[11px] text-muted-foreground font-medium">
                            {student.religion || 'Muslim'} {student.gender ? `• ${student.gender}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-xs text-cyan-500">
                      <span className="bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        {student.admissionNo || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-foreground">{student.section?.class?.name || '—'}</div>
                      <div className="text-xs text-muted-foreground">Section {student.section?.name || '—'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 font-mono font-bold text-xs flex items-center justify-center">
                        {student.rollNo || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs font-bold text-foreground">
                        {student.fatherName || student.parents?.[0]?.parent?.fatherName || student.parents?.[0]?.parent?.name || '—'}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {student.fatherMobile1 || student.parents?.[0]?.parent?.fatherMobile1 || student.parents?.[0]?.parent?.phone || student.phone || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                          student.admissionType === 'TRANSFER'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}
                      >
                        {student.admissionType === 'TRANSFER' ? 'Transfer' : 'Active'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="h-8 w-8 rounded-lg border border-border bg-background hover:bg-cyan-600 hover:text-white transition-all flex items-center justify-center text-muted-foreground"
                          onClick={() => setProfile(student)}
                          title="View Profile"
                        >
                          <UserRound size={14} />
                        </button>
                        <button
                          className="h-8 w-8 rounded-lg border border-border bg-background hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center text-muted-foreground"
                          onClick={() => openEdit(student)}
                          title="Edit Student"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="h-8 w-8 rounded-lg border border-border bg-background hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center text-muted-foreground"
                          onClick={() => void archive(student.id)}
                          title="Archive"
                        >
                          <Trash2 size={14} />
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

      {/* ── Student Profile Dossier Modal ── */}
      {profile && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl custom-scrollbar">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
              <h2 className="font-black text-foreground text-lg">Student Profile Dossier</h2>
              <button onClick={() => setProfile(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-5 rounded-2xl bg-muted/40 p-5 border border-border">
                <div className="h-16 w-16 overflow-hidden rounded-2xl bg-cyan-600 text-lg font-black text-white flex items-center justify-center border border-white/20 shadow-md">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Student" className="h-full w-full object-cover" />
                  ) : (
                    String(profile.name || 'S').charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-xl text-foreground">{profile.name}</h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Active Student
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    Admission: <span className="text-cyan-500 font-bold">{profile.admissionNo || '—'}</span> • Roll: <span className="text-amber-500 font-bold">{profile.rollNo || '—'}</span> • {profile.section?.class?.name || '—'} / Section {profile.section?.name || '—'}
                  </p>
                </div>
              </div>

              {/* Profile Info Grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Info label="Admission No" value={profile.admissionNo} />
                <Info label="Roll No" value={profile.rollNo} />
                <Info label="Class / Section" value={`${profile.section?.class?.name || '—'} / ${profile.section?.name || '—'}`} />
                <Info label="Gender / Religion" value={`${profile.gender || '—'} • ${profile.religion || 'Muslim'}`} />
                <Info label="B-Form / CNIC" value={profile.bFormNumber} />
                <Info label="Student Mobile" value={profile.phone} />
                <Info label="Father Name" value={profile.fatherName || profile.parents?.[0]?.parent?.fatherName || profile.parents?.[0]?.parent?.name} />
                <Info label="Father Mobile" value={profile.fatherMobile1 || profile.parents?.[0]?.parent?.fatherMobile1 || profile.parents?.[0]?.parent?.phone} />
                <Info label="Father CNIC" value={profile.fatherCnic || profile.parents?.[0]?.parent?.fatherCnic} />
                <Info label="Mother Name" value={profile.motherName || profile.parents?.[0]?.parent?.motherName} />
                <Info label="Mother Mobile" value={profile.motherMobile || profile.parents?.[0]?.parent?.motherMobile} />
                <Info label="Previous School" value={profile.previousSchool} />
                <Info label="Current Address" value={profile.currentAddress || profile.address || profile.parents?.[0]?.parent?.addressLine} span={3} />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                <button className={button} onClick={() => printId(profile)}>
                  <Printer size={15} /> Print ID Card
                </button>
                <button
                  className={button}
                  onClick={() => {
                    const p = profile;
                    setProfile(null);
                    openEdit(p);
                  }}
                >
                  <Pencil size={15} /> Edit Record
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3.5 py-2 text-sm font-bold text-white hover:bg-rose-500 transition-all"
                  onClick={() => void archive(profile.id)}
                >
                  <Trash2 size={15} /> Archive Student
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
    <div className={`rounded-xl border border-border bg-muted/25 p-3 ${span === 3 ? 'sm:col-span-2 lg:col-span-3' : ''}`}>
      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-foreground">{String(value ?? '—') || '—'}</p>
    </div>
  );
}
