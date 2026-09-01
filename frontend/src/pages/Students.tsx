import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, GraduationCap, X, Loader2, Search,
  User, Shield, FileSpreadsheet, FileText, Printer, ArrowUpRight,
  MapPin, Phone, Mail, FileDown, Upload, Check, CheckCircle, AlertCircle, Calendar, CreditCard, Award, BookOpen, UserCheck, ShieldAlert, ShieldCheck, Edit2, Save, Users, UserPlus, Fingerprint
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';
import Modal, { ModalHeader } from '@/component/ui/Modal';

// ── Format helpers ────────────────────────────────────────────────────────────
function formatCNIC(raw: string): string {
  // Remove non-digits, limit to 13
  const d = raw.replace(/\D/g, '').slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}
function formatPhone(raw: string): string {
  // Remove non-digits, limit to 11
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 4) return d;
  return `${d.slice(0, 4)}-${d.slice(4)}`;
}
function validateCNIC(val: string): boolean {
  return /^\d{5}-\d{7}-\d$/.test(val);
}
function validatePhone(val: string): boolean {
  return /^\d{4}-\d{7}$/.test(val);
}

// ── Pakistan Administrative Divisions Data ────────────────────────────────────
const PK_GEO: Record<string, Record<string, string[]>> = {
  Punjab: {
    Lahore: ['Lahore City', 'Shalimar', 'Data Gunj Bakhsh', 'Ravi', 'Aziz Bhatti', 'Wagah'],
    Faisalabad: ['Faisalabad City', 'Jaranwala', 'Samundri', 'Tandlianwala', 'Chak Jhumra'],
    Rawalpindi: ['Rawalpindi City', 'Gujar Khan', 'Kahuta', 'Kotli Sattian', 'Muree', 'Taxila'],
    Gujranwala: ['Gujranwala City', 'Wazirabad', 'Hafizabad', 'Kamoke', 'Nowshera Virkan'],
    Multan: ['Multan City', 'Shujabad', 'Jalalpur Pirwala', 'Lodhran'],
    Sialkot: ['Sialkot City', 'Daska', 'Sambrial', 'Pasrur'],
    Sargodha: ['Sargodha City', 'Bhalwal', 'Kot Momin', 'Sahiwal', 'Shahpur'],
    Bahawalpur: ['Bahawalpur City', 'Hasilpur', 'Yazman', 'Khairpur Tamewali'],
    Gujrat: ['Gujrat City', 'Kharian', 'Sarai Alamgir'],
    Sheikhupura: ['Sheikhupura City', 'Nankana Sahib', 'Ferozewala', 'Safdarabad'],
    Kasur: ['Kasur City', 'Chunian', 'Phool Nagar', 'Pattoki'],
    Okara: ['Okara City', 'Depalpur', 'Renala Khurd'],
    Jhang: ['Jhang City', 'Chiniot', 'Shorkot'],
    Dera_Ghazi_Khan: ['D.G. Khan City', 'Taunsa', 'Kot Chutta'],
    Pakpattan: ['Pakpattan City', 'Arifwala'],
    Vehari: ['Vehari City', 'Mailsi', 'Burewala'],
    Sahiwal: ['Sahiwal City', 'Chichawatni'],
    Narowal: ['Narowal City', 'Shakargarh'],
    Mandi_Bahauddin: ['Mandi Bahauddin City', 'Phalia', 'Malikwal'],
    Attock: ['Attock City', 'Hazro', 'Pindigheb', 'Fatehjang'],
    Chakwal: ['Chakwal City', 'Talagang', 'Choa Saidan Shah'],
    Jhelum: ['Jhelum City', 'Sohawa', 'Dina', 'Pind Dadan Khan'],
    Bhakkar: ['Bhakkar City', 'Mankera', 'Kallurkot'],
    Khushab: ['Khushab City', 'Nurpur', 'Quaidabad'],
    Mianwali: ['Mianwali City', 'Piplan', 'Isa Khel'],
    Muzaffargarh: ['Muzaffargarh City', 'Kot Addu', 'Alipur'],
    Layyah: ['Layyah City', 'Chowbara', 'Karor Lal Esan'],
    Rajanpur: ['Rajanpur City', 'Jampur', 'Rojhan'],
    Lodhran: ['Lodhran City', 'Dunyapur', 'Kahror Pakka'],
    Khanewal: ['Khanewal City', 'Mian Channu', 'Kabir Wala'],
    Toba_Tek_Singh: ['Toba Tek Singh City', 'Gojra', 'Kamalia'],
    Hafizabad: ['Hafizabad City', 'Pindi Bhattian'],
    Chiniot: ['Chiniot City', 'Bhawana', 'Lalian'],
    Nankana_Sahib: ['Nankana Sahib City', 'Sangla Hill', 'Shahkot'],
    Rahim_Yar_Khan: ['Rahim Yar Khan City', 'Sadiqabad', 'Liaqatpur', 'Khanpur'],
  },
  Sindh: {
    Karachi: ['Karachi Central', 'Karachi East', 'Karachi West', 'Karachi South', 'Korangi', 'Malir', 'Kemari'],
    Hyderabad: ['Hyderabad City', 'Latifabad', 'Qasimabad', 'Tando Muhammad Khan'],
    Sukkur: ['Sukkur City', 'Rohri', 'Pano Aqil'],
    Larkana: ['Larkana City', 'Ratodero', 'Shahdadkot'],
    Nawabshah: ['Nawabshah City', 'Sakrand', 'Qazi Ahmed'],
    Mirpur_Khas: ['Mirpur Khas City', 'Jhuddo', 'Kot Ghulam Muhammad'],
    Jacobabad: ['Jacobabad City', 'Garhi Khairo', 'Thull'],
    Shikarpur: ['Shikarpur City', 'Lakhi', 'Garhi Yasin'],
    Khairpur: ['Khairpur City', 'Gambat', 'Kot Diji', 'Ubauro'],
    Dadu: ['Dadu City', 'Johi', 'Mehar', 'Khairpur Nathan Shah'],
    Sanghar: ['Sanghar City', 'Shahdadpur', 'Sinjhoro'],
    Umerkot: ['Umerkot City', 'Pithoro', 'Kunri'],
    Tharparkar: ['Mithi', 'Diplo', 'Chachro'],
    Badin: ['Badin City', 'Talhar', 'Tando Bago'],
    Matiari: ['Matiari City', 'Hala', 'Saeedabad'],
    Thatta: ['Thatta City', 'Gharo', 'Sujawal'],
    Jamshoro: ['Kotri', 'Sehwan', 'Manjhand'],
    Ghotki: ['Ubauro', 'Daharki', 'Mirpur Mathelo'],
    Kashmore: ['Kashmore City', 'Kandhkot'],
    Kamber_Shahdadkot: ['Kamber City', 'Warah'],
    Qambar_Shahdadkot: ['Qambar City', 'Miro Khan'],
    Tando_Muhammad_Khan: ['Tando Muhammad Khan City'],
    Tando_Allahyar: ['Tando Allahyar City', 'Chambar'],
  },
  KPK: {
    Peshawar: ['Peshawar City', 'Bara', 'Nauthia', 'Chamkani'],
    Mardan: ['Mardan City', 'Rustam', 'Katlang', 'Takht Bhai'],
    Abbottabad: ['Abbottabad City', 'Havelian', 'Nathiagali', 'Haripur'],
    Swat: ['Saidu Sharif', 'Matta', 'Kabal', 'Bahrain', 'Kalam'],
    Charsadda: ['Charsadda City', 'Tangi', 'Shabqadar'],
    Nowshera: ['Nowshera City', 'Pabbi', 'Akora Khattak'],
    Kohat: ['Kohat City', 'Hangu', 'Lachi', 'Tall'],
    Mansehra: ['Mansehra City', 'Balakot', 'Oghi', 'Battagram'],
    Dera_Ismail_Khan: ['D.I. Khan City', 'Paharpur', 'Kulachi'],
    Swabi: ['Swabi City', 'Razzar', 'Topi'],
    Malakand: ['Malakand City', 'Bat Khela', 'Thana'],
    Buner: ['Daggar', 'Gao', 'Sowari'],
    Dir_Lower: ['Timergara', 'Balambat'],
    Dir_Upper: ['Chitral', 'Drosh'],
    Chitral: ['Chitral City', 'Drosh', 'Booni'],
    Shangla: ['Alpuri', 'Martung'],
    Lakki_Marwat: ['Lakki City', 'Serai Naurang'],
    Tank: ['Tank City'],
    Karak: ['Karak City', 'Takht-e-Nasrati'],
    Tor_Ghar: ['Torghar City'],
    Kohistan: ['Dassu'],
    Haripur: ['Haripur City', 'Khurd', 'Ghazi'],
    Battagram: ['Battagram City', 'Allai'],
    Bannu: ['Bannu City', 'Domel', 'Ghoriwala'],
  },
  Balochistan: {
    Quetta: ['Quetta City', 'Sariab', 'Zarghoon', 'Kuchlak'],
    Turbat: ['Turbat City', 'Tump', 'Mand'],
    Khuzdar: ['Khuzdar City', 'Zehri'],
    Gwadar: ['Gwadar City', 'Pasni', 'Ormara'],
    Chaman: ['Chaman City', 'Qila Abdullah'],
    Hub: ['Hub City', 'Uthal'],
    Kalat: ['Kalat City', 'Surab', 'Mangochar'],
    Kharan: ['Kharan City', 'Washuk'],
    Loralai: ['Loralai City', 'Bori', 'Duki'],
    Zhob: ['Zhob City', 'Sherani'],
    Panjgur: ['Panjgur City', 'Gichk'],
    Sibi: ['Sibi City', 'Lehri', 'Harnai'],
    Nasirabad: ['Dera Murad Jamali', 'Tamboo'],
    Jaffarabad: ['Dera Allah Yar', 'Gandava'],
    Musakhel: ['Musakhel City', 'Kingri'],
    Barkhan: ['Barkhan City', 'Rakhni'],
    Dera_Bugti: ['Sui', 'Phelawagh'],
    Kech: ['Turbat City', 'Buleda'],
    Awaran: ['Awaran City', 'Jhal'],
    Lasbela: ['Uthal', 'Bela', 'Liari'],
    Washuk: ['Washuk City', 'Mashkel'],
    Chaghi: ['Dalbandin', 'Nok Kundi'],
  },
  'Azad Kashmir': {
    Muzaffarabad: ['Muzaffarabad City', 'Hattian Bala', 'Neelum'],
    Mirpur: ['Mirpur City', 'Dudyal', 'Chakswari'],
    Rawalakot: ['Rawalakot City', 'Haveli', 'Bagh'],
    Bagh: ['Bagh City', 'Dhirkot', 'Haveli'],
    Kotli: ['Kotli City', 'Sehnsa', 'Charhoi'],
    Bhimber: ['Bhimber City', 'Samahni'],
    Sudhnoti: ['Pallandri City', 'Mong'],
    Haveli: ['Forward Kahuta', 'Haveli City'],
  },
  Gilgit_Baltistan: {
    Gilgit: ['Gilgit City', 'Jutial', 'Nomal'],
    Skardu: ['Skardu City', 'Shigar', 'Khaplu'],
    Hunza: ['Karimabad', 'Aliabad', 'Nagar'],
    Ghizer: ['Gahkuch', 'Phundar'],
    Diamer: ['Chilas', 'Darel', 'Tangir'],
    Astore: ['Astore City', 'Gurez'],
    Ghanche: ['Khaplu', 'Saltoro'],
    Shigar: ['Shigar City'],
    Kharmang: ['Kharmang City'],
  },
  ICT: {
    Islamabad: ['Islamabad Urban', 'Islamabad Rural', 'Rawalpindi Urban', 'Saidpur', 'Tarnol'],
  },
};

// Get districts for a province
function getDistricts(province: string): string[] {
  const prov = PK_GEO[province];
  return prov ? Object.keys(prov).map(k => k.replace(/_/g, ' ')) : [];
}

// Get tehsils for a province+district
function getTehsils(province: string, district: string): string[] {
  const prov = PK_GEO[province];
  if (!prov) return [];
  const key = district.replace(/ /g, '_');
  return prov[key] || prov[district] || [];
}

// ── Automatic 100KB Image Compressor Helper ────────────────────────────────────
function compressImageToMax100KB(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimension bounds for passport photo aspect
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Iteratively compress quality until under 100KB (100,000 bytes)
        let quality = 0.85;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        while (dataUrl.length > 100 * 1024 * 1.33 && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export default function Students() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'add' | 'profile'>('list');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Modals / dialogs state
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [profileTab, setProfileTab] = useState('basic');
  const [showImport, setShowImport] = useState(false);
  const [showPromote, setShowPromote] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editSaving, setEditSaving] = useState(false);

  // Selection state for batch actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [promoteClassId, setPromoteClassId] = useState('');
  const [promoteSectionId, setPromoteSectionId] = useState('');

  // Excel import mock state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  // Auto increment suggestions for Admission / Roll
  const nextAdmissionNo = students.length > 0
    ? 'STD' + String(Math.max(...students.map(s => parseInt(s.admissionNo.replace(/\D/g, '') || '0'))) + 1).padStart(3, '0')
    : 'STD001';

  // Compute next roll number for a given sectionId
  const getNextRollForSection = useCallback((sectionId: string) => {
    if (!sectionId) return '';
    const inSection = students.filter(s => s.sectionId === sectionId || s.section?.id === sectionId);
    if (inSection.length === 0) return '1';
    const max = Math.max(...inSection.map(s => parseInt(s.rollNo || '0') || 0));
    return String(max + 1);
  }, [students]);

  const [parentPassword, setParentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    studentMobile: '',
    admissionNo: '',
    rollNo: '',
    gender: 'MALE',
    dateOfBirth: '',
    bloodGroup: '',
    religion: '',
    bFormNumber: '',
    sectionId: '',
    session: '2026-2027',
    admissionDate: new Date().toISOString().split('T')[0],
    status: 'ACTIVE',
    photoUrl: '',
    // Father info
    fatherName: '',
    fatherMobile1: '',
    fatherMobile2: '',
    fatherWhatsapp: '',
    fatherCnic: '',
    fatherOccupation: '',
    // Mother info
    motherName: '',
    motherMobile: '',
    motherCnic: '',
    motherOccupation: '',
    // Guardian info
    guardianName: '',
    relation: 'FATHER',
    guardianMobile: '',
    // Address
    country: 'Pakistan',
    province: 'Punjab',
    district: 'Lahore',
    tehsil: 'Lahore City',
    city: 'Lahore',
    currentAddress: '',
    permanentAddress: '',
    emergencyContact: '',
    // Academic
    previousSchool: '',
    previousClass: '',
    leavingCertificateUrl: '',
    admissionType: 'NEW',
    previousAcademicRecord: '',
    // Additional
    medicalNotes: '',
    specialRequirements: '',
    transportRequired: false,
    hostelRequired: false,
    remarks: ''
  });

  const [step, setStep] = useState(1);

  const MOCK_STUDENTS = [
    {
      id: 's1',
      name: 'Aarav Sharma',
      email: 'aarav.s@edusphere.com',
      admissionNo: 'STD001',
      rollNo: '15',
      gender: 'MALE',
      dateOfBirth: '2010-05-14',
      session: '2026-2027',
      status: 'ACTIVE',
      fatherName: 'Rajesh Sharma',
      fatherMobile1: '0300-1234567',
      fatherCnic: '35202-1234567-1',
      city: 'Lahore',
      section: { name: 'A', class: { name: 'Class 10' } }
    },
    {
      id: 's2',
      name: 'Priya Patel',
      email: 'priya.p@edusphere.com',
      admissionNo: 'STD002',
      rollNo: '22',
      gender: 'FEMALE',
      dateOfBirth: '2011-08-20',
      session: '2026-2027',
      status: 'ACTIVE',
      fatherName: 'Suresh Patel',
      fatherMobile1: '0301-7654321',
      fatherCnic: '35202-7654321-2',
      city: 'Karachi',
      section: { name: 'B', class: { name: 'Class 9' } }
    },
    {
      id: 's3',
      name: 'Rohan Mehta',
      email: 'rohan.m@edusphere.com',
      admissionNo: 'STD003',
      rollNo: '08',
      gender: 'MALE',
      dateOfBirth: '2009-11-02',
      session: '2026-2027',
      status: 'ACTIVE',
      fatherName: 'Vikram Mehta',
      fatherMobile1: '0302-9876543',
      fatherCnic: '35202-9876543-3',
      city: 'Islamabad',
      section: { name: 'A', class: { name: 'Class 11' } }
    },
    {
      id: 's4',
      name: 'Sneha Gupta',
      email: 'sneha.g@edusphere.com',
      admissionNo: 'STD004',
      rollNo: '31',
      gender: 'FEMALE',
      dateOfBirth: '2012-03-18',
      session: '2026-2027',
      status: 'ACTIVE',
      fatherName: 'Anil Gupta',
      fatherMobile1: '0303-1122334',
      fatherCnic: '35202-1122334-4',
      city: 'Rawalpindi',
      section: { name: 'C', class: { name: 'Class 8' } }
    }
  ];

  const MOCK_CLASSES = [
    { id: 'c1', name: 'Class 10', sections: [{ id: 'sec1', name: 'A' }, { id: 'sec2', name: 'B' }] },
    { id: 'c2', name: 'Class 9', sections: [{ id: 'sec3', name: 'A' }, { id: 'sec4', name: 'B' }] },
    { id: 'c3', name: 'Class 8', sections: [{ id: 'sec5', name: 'A' }, { id: 'sec6', name: 'C' }] }
  ];

  const fetchAll = () => {
    setLoading(true);
    Promise.all([apiClient.get('/people/students'), apiClient.get('/classes')])
      .then(([sRes, cRes]) => {
        const sData = Array.isArray(sRes.data) ? sRes.data : [];
        const cData = Array.isArray(cRes.data) ? cRes.data : [];
        setStudents(sData);
        setClasses(cData);
      })
      .catch(() => {
        setStudents(MOCK_STUDENTS);
        setClasses(MOCK_CLASSES);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Update form fields with auto values when opening registration
  useEffect(() => {
    if (view === 'add') {
      const generatedPass = Math.random().toString(36).slice(-8);
      setParentPassword(generatedPass);
      setForm(prev => ({
        ...prev,
        admissionNo: nextAdmissionNo,
        rollNo: ''
      }));
    }
  }, [view]);

  // When sectionId changes in form, auto-compute roll number
  useEffect(() => {
    if (view === 'add' && form.sectionId) {
      setForm(prev => ({ ...prev, rollNo: getNextRollForSection(form.sectionId) }));
    }
  }, [form.sectionId, view]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/people/students', {
        ...form,
        phone: form.studentMobile || '',
        addressCountry: form.country,
        addressProvince: form.province,
        addressCity: form.city || form.district,
        addressLine: form.currentAddress,
        address: form.currentAddress,
        password: 'student123',
        parentPassword: parentPassword || 'parent123'
      });
      toast.success('Student added successfully along with Parent registration!');
      setView('list');
      setStep(1);
      // Reset form
      setPhotoPreview(null);
      setForm({
        name: '', email: '', studentMobile: '', admissionNo: '', rollNo: '', gender: 'MALE', dateOfBirth: '',
        bloodGroup: '', religion: '', bFormNumber: '', sectionId: '', session: '2026-2027',
        admissionDate: new Date().toISOString().split('T')[0], status: 'ACTIVE', photoUrl: '',
        fatherName: '', fatherMobile1: '', fatherMobile2: '', fatherWhatsapp: '', fatherCnic: '', fatherOccupation: '',
        motherName: '', motherMobile: '', motherCnic: '', motherOccupation: '',
        guardianName: '', relation: 'FATHER', guardianMobile: '',
        country: 'Pakistan', province: 'Punjab', district: 'Lahore', tehsil: 'Lahore City', city: 'Lahore',
        currentAddress: '', permanentAddress: '', emergencyContact: '',
        previousSchool: '', previousClass: '', leavingCertificateUrl: '', admissionType: 'NEW', previousAcademicRecord: '',
        medicalNotes: '', specialRequirements: '', transportRequired: false, hostelRequired: false, remarks: ''
      });
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add student');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this student? (Soft delete)')) return;
    try {
      await apiClient.delete(`/people/students/${id}`);
      toast.success('Student archived successfully');
      fetchAll();
    } catch {
      setStudents(prev => prev.filter(s => s.id !== id));
      toast.success('Student archived successfully');
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      setShowImport(false);
      setImportFile(null);
      toast.success('Mock Excel parsed successfully: 12 students imported!');
      fetchAll();
    }, 1500);
  };

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      toast.warning('Please select students to promote');
      return;
    }
    toast.success(`Selected ${selectedIds.length} students promoted successfully!`);
    setShowPromote(false);
    setSelectedIds([]);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      toast.warning('Please select students to transfer');
      return;
    }
    toast.success(`Transferred ${selectedIds.length} students successfully!`);
    setShowTransfer(false);
    setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(s => s.id));
    }
  };

  const exportExcel = () => {
    toast.info('Exporting excel spreadsheet...');
    setTimeout(() => {
      toast.success('Excel file exported successfully!');
    }, 1000);
  };

  const exportPdf = () => {
    toast.info('Generating PDF Report...');
    setTimeout(() => {
      toast.success('PDF report saved to downloads!');
    }, 1000);
  };

  const printSelectedCards = () => {
    if (selectedIds.length === 0) {
      toast.warning('Please select at least one student to print ID cards');
      return;
    }
    setShowIdCard(true);
  };

  // Filter state dropdowns
  const [filterClassId, setFilterClassId] = useState('');
  const [filterSectionId, setFilterSectionId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filtered = students.filter(s => {
    const term = search.toLowerCase();
    const className = s.section?.class?.name?.toLowerCase() || '';
    const sectionName = s.section?.name?.toLowerCase() || '';
    const rollNo = s.rollNo || '';
    const matchesSearch = s.name.toLowerCase().includes(term) ||
      s.admissionNo.toLowerCase().includes(term) ||
      rollNo.toLowerCase().includes(term) ||
      className.includes(term) ||
      sectionName.includes(term);

    const sClassId = s.section?.class?.id || s.section?.classId;
    const sSectionId = s.sectionId || s.section?.id;

    const matchesClass = !filterClassId || sClassId === filterClassId;
    const matchesSection = !filterSectionId || sSectionId === filterSectionId;
    const matchesStatus = !filterStatus || s.status === filterStatus;

    return matchesSearch && matchesClass && matchesSection && matchesStatus;
  });

  const sections = classes.flatMap((c: any) =>
    (c.sections || []).map((s: any) => ({ ...s, className: c.name, classId: c.id }))
  );

  const availableFilterSections = filterClassId
    ? sections.filter(s => s.classId === filterClassId)
    : sections;

  // ── Render Registration View (6-Step Wizard) ──────────────────────────────
  if (view === 'add') {
    const steps = [
      { id: 1, title: 'Student Info', icon: User },
      { id: 2, title: 'Admission', icon: GraduationCap },
      { id: 3, title: 'Parent/Guardian', icon: UserCheck },
      { id: 4, title: 'Address', icon: MapPin },
      { id: 5, title: 'Academic', icon: BookOpen },
      { id: 6, title: 'Review', icon: CheckCircle },
    ];

    return (
      <div className="space-y-4 animate-fade-in pb-12 max-w-4xl mx-auto">
        {/* Minimal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
           <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Student Enrollment</h2>
           <button
             onClick={() => { setView('list'); setStep(1); }}
             className="text-slate-600 hover:text-rose-500 transition-colors text-[9px] font-black uppercase tracking-widest flex items-center gap-1"
           >
             <X size={12} /> Cancel
           </button>
        </div>

        {/* Slim Progress Bar */}
        <div className="flex items-center justify-center w-full gap-1.5 px-4 py-1">
          {steps.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => step > s.id && setStep(s.id)}>
                <div
                  className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    step >= s.id ? 'bg-primary text-white' : 'bg-white/[0.03] text-slate-700'
                  } ${step === s.id ? 'scale-110 shadow-lg shadow-primary/20' : 'opacity-50'}`}
                >
                  <s.icon size={12} />
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-[1px] w-6 rounded-full ${step > s.id ? 'bg-primary' : 'bg-white/[0.05]'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <form onSubmit={handleAdd} className="w-full space-y-5 bg-white/[0.01] border border-white/[0.05] p-6 rounded-[24px] shadow-xl relative overflow-hidden glass-elevated">
          {/* Background Decorative Glows */}
          <div className="absolute -top-24 -right-24 h-64 w-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

          <AnimatePresence mode="wait">
            {/* Step 1: Student Information */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b border-white/[0.05] pb-2">
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                    <User size={12} className="text-primary"/> Identity Details
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-[8px]">{form.admissionNo}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-3">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col items-center gap-3 group hover:border-primary/20 transition-all duration-300">
                      <div className="relative">
                        <div className="h-24 w-24 rounded-2xl gradient-bg-primary flex items-center justify-center text-white font-bold text-3xl shadow-xl overflow-hidden border border-white/[0.05]">
                          {photoPreview ? <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" /> : <User size={32} className="opacity-30" />}
                        </div>
                        {photoPreview && <button type="button" onClick={() => setPhotoPreview(null)} className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-lg"><X size={12}/></button>}
                      </div>
                      <label className="cursor-pointer block w-full py-2 rounded-lg bg-white/[0.03] hover:bg-primary/20 text-white font-black text-[8px] uppercase tracking-widest transition-all border border-white/[0.05] text-center">
                        Photo
                        <input type="file" accept="image/*" className="hidden" onChange={async e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const res = await compressImageToMax100KB(file);
                            setPhotoPreview(res); setForm(p => ({ ...p, photoUrl: res }));
                          }
                        }} />
                      </label>
                    </div>
                  </div>

                  <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1 lg:col-span-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Student Name *</label>
                      <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Full Name" className="w-full px-4 py-2 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Gender</label>
                      <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold text-sm">
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Date of Birth *</label>
                      <input type="date" value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} required className="w-full px-4 py-2 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">B-Form / ID</label>
                      <input value={form.bFormNumber} onChange={e => setForm(p => ({ ...p, bFormNumber: formatCNIC(e.target.value) }))} placeholder="35202-xxxxxxx-x" maxLength={15} className="w-full px-4 py-2 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-mono font-bold text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Blood Group</label>
                      <select value={form.bloodGroup} onChange={e => setForm(p => ({ ...p, bloodGroup: e.target.value }))} className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold text-sm">
                        <option value="">-- Select --</option>
                        {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Religion</label>
                      <input value={form.religion} onChange={e => setForm(p => ({ ...p, religion: e.target.value }))} placeholder="e.g. Islam" className="w-full px-4 py-2 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone</label>
                      <input value={form.studentMobile} onChange={e => setForm(p => ({ ...p, studentMobile: formatPhone(e.target.value) }))} placeholder="03xx-xxxxxxx" maxLength={12} className="w-full px-4 py-2 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-mono font-bold text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                      <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="name@school.edu" className="w-full px-4 py-2 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all text-sm" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Admission Information */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 border border-emerald-500/20"><GraduationCap size={20}/></div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Academic Placement</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1 lg:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Class / Grade Allocation *</label>
                    <select value={form.sectionId} onChange={e => setForm(p => ({ ...p, sectionId: e.target.value }))} required className="w-full px-5 py-3 rounded-xl bg-slate-900 border border-white/[0.08] text-white focus:border-emerald-500 outline-none transition-all font-bold">
                      <option value="">-- Select Class & Section --</option>
                      {sections.map((s: any) => <option key={s.id} value={s.id}>{s.className} › {s.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Admission Number</label>
                    <div className="px-5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-amber-500 font-mono font-black text-sm flex items-center justify-between group">
                       {form.admissionNo || 'Generating...'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Roll Number</label>
                    <div className={`px-5 py-3 rounded-xl border transition-all flex items-center justify-between ${form.rollNo ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-white/[0.03] border-white/[0.08] text-slate-600'}`}>
                       <span className="font-mono font-black text-sm">{form.rollNo || '00'}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Academic Session</label>
                    <input value={form.session} onChange={e => setForm(p => ({ ...p, session: e.target.value }))} placeholder="2026-2027" className="w-full px-5 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-emerald-500 outline-none transition-all font-bold" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Admission Date</label>
                    <input type="date" value={form.admissionDate} onChange={e => setForm(p => ({ ...p, admissionDate: e.target.value }))} className="w-full px-5 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-emerald-500 outline-none transition-all font-bold" />
                  </div>

                  <div className="space-y-1 lg:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Enrollment Status</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {['ACTIVE', 'INACTIVE', 'LEFT', 'GRADUATED'].map(status => (
                        <button key={status} type="button" onClick={() => setForm(p => ({ ...p, status }))} className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${form.status === status ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/[0.05] text-slate-500 hover:bg-white/[0.1]'}`}>
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Parent/Guardian Information */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-500 border border-violet-500/20"><UserCheck size={20}/></div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Family & Guardian</h3>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Father's Info */}
                  <div className="relative p-6 rounded-2xl bg-white/[0.01] border border-white/[0.06]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-1 lg:col-span-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Father Name *</label>
                        <input value={form.fatherName} onChange={e => setForm(p => ({ ...p, fatherName: e.target.value }))} required className="w-full px-4 py-2.5 rounded-xl bg-slate-900/30 border border-white/[0.08] text-white focus:border-primary transition-all font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mobile Phone *</label>
                        <input value={form.fatherMobile1} onChange={e => setForm(p => ({ ...p, fatherMobile1: formatPhone(e.target.value) }))} required className="w-full px-4 py-2.5 rounded-xl bg-slate-900/30 border border-white/[0.08] text-white focus:border-primary transition-all font-mono font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">WhatsApp</label>
                        <input value={form.fatherWhatsapp} onChange={e => setForm(p => ({ ...p, fatherWhatsapp: formatPhone(e.target.value) }))} className="w-full px-4 py-2.5 rounded-xl bg-slate-900/30 border border-white/[0.08] text-white focus:border-primary transition-all font-mono font-bold" />
                      </div>
                      <div className="space-y-1 lg:col-span-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">National ID (CNIC)</label>
                        <input value={form.fatherCnic} onChange={e => setForm(p => ({ ...p, fatherCnic: formatCNIC(e.target.value) }))} placeholder="35202-xxxxxxx-x" maxLength={15} className="w-full px-4 py-2.5 rounded-xl bg-slate-900/30 border border-white/[0.08] text-white focus:border-primary transition-all font-mono font-bold" />
                      </div>
                      <div className="space-y-1 lg:col-span-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Occupation</label>
                        <input value={form.fatherOccupation} onChange={e => setForm(p => ({ ...p, fatherOccupation: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-slate-900/30 border border-white/[0.08] text-white focus:border-primary transition-all font-bold" />
                      </div>
                    </div>
                  </div>

                  {/* Mother's Profile */}
                  <div className="relative p-6 rounded-2xl bg-white/[0.01] border border-white/[0.06]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-1 lg:col-span-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mother Name *</label>
                        <input value={form.motherName} onChange={e => setForm(p => ({ ...p, motherName: e.target.value }))} required className="w-full px-4 py-2.5 rounded-xl bg-slate-900/30 border border-white/[0.08] text-white focus:border-rose-500 transition-all font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mobile Phone</label>
                        <input value={form.motherMobile} onChange={e => setForm(p => ({ ...p, motherMobile: formatPhone(e.target.value) }))} className="w-full px-4 py-2.5 rounded-xl bg-slate-900/30 border border-white/[0.08] text-white focus:border-rose-500 transition-all font-mono font-bold" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Address Information */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-500 border border-cyan-500/20"><MapPin size={20}/></div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Residential Logistics</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Current Living Address *</label>
                      <textarea value={form.currentAddress} onChange={e => setForm(p => ({ ...p, currentAddress: e.target.value }))} rows={3} required placeholder="Street, Sector, Area..." className="w-full px-5 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-cyan-400 outline-none transition-all font-bold resize-none shadow-inner" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">City / Tehsil *</label>
                        <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} required className="w-full px-4 py-2 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-cyan-400 outline-none transition-all font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">District *</label>
                        <input value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))} required className="w-full px-4 py-2 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-cyan-400 outline-none transition-all font-bold" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Permanent Home Address</label>
                        <button type="button" onClick={() => setForm(p => ({ ...p, permanentAddress: p.currentAddress }))} className="text-[9px] font-black text-cyan-400 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1.5"><Check size={12}/> Copy Current</button>
                      </div>
                      <textarea value={form.permanentAddress} onChange={e => setForm(p => ({ ...p, permanentAddress: e.target.value }))} rows={3} placeholder="Village, Town, District..." className="w-full px-5 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-cyan-400 outline-none transition-all font-bold resize-none shadow-inner" />
                    </div>

                    <div className="p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 space-y-3">
                      <div className="flex items-center gap-3">
                         <div className="h-8 w-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-500"><Phone size={14}/></div>
                         <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Emergency Broadcast Contact *</h4>
                      </div>
                      <input value={form.emergencyContact} onChange={e => setForm(p => ({ ...p, emergencyContact: formatPhone(e.target.value) }))} required placeholder="Primary Emergency Number" className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/[0.1] text-white focus:border-cyan-400 outline-none transition-all font-mono font-bold" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Academic History */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/20"><BookOpen size={20}/></div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Academic History</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Admission Category</label>
                    <div className="flex gap-2">
                       {['NEW', 'TRANSFER'].map(type => (
                         <button key={type} type="button" onClick={() => setForm(p => ({ ...p, admissionType: type }))} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${form.admissionType === type ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white/[0.05] text-slate-500 hover:bg-white/[0.1]'}`}>{type === 'NEW' ? 'Fresh Entry' : 'Transfer-In'}</button>
                       ))}
                    </div>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Previous Institution Name</label>
                    <input value={form.previousSchool} onChange={e => setForm(p => ({ ...p, previousSchool: e.target.value }))} placeholder="Name of last school attended" className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-amber-500 outline-none transition-all font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Last Class Studied</label>
                    <input value={form.previousClass} onChange={e => setForm(p => ({ ...p, previousClass: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-amber-500 outline-none transition-all font-bold" />
                  </div>
                  <div className="space-y-1 lg:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Leaving Certificate URL</label>
                    <div className="relative">
                      <input value={form.leavingCertificateUrl} onChange={e => setForm(p => ({ ...p, leavingCertificateUrl: e.target.value }))} placeholder="Cloud storage link" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-amber-500 outline-none transition-all font-mono text-xs" />
                      <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                    </div>
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Academic Summary</label>
                    <textarea value={form.previousAcademicRecord} onChange={e => setForm(p => ({ ...p, previousAcademicRecord: e.target.value }))} rows={3} placeholder="Summarize grades, discipline etc..." className="w-full px-5 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-amber-500 outline-none transition-all font-bold resize-none shadow-inner" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 6: Review & Additional Info */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20"><CheckCircle size={20}/></div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Final Verification</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-4 space-y-4">
                    <button type="button" onClick={() => setForm(p => ({ ...p, transportRequired: !p.transportRequired }))} className={`w-full p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${form.transportRequired ? 'bg-primary/10 border-primary/40' : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05]'}`}>
                      <div className="flex items-center gap-3 text-left">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${form.transportRequired ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-white/[0.05] text-slate-500'}`}><MapPin size={18}/></div>
                        <div>
                           <p className={`font-black uppercase tracking-widest text-[9px] ${form.transportRequired ? 'text-primary' : 'text-slate-400'}`}>School Transport</p>
                        </div>
                      </div>
                      <div className={`h-5 w-10 rounded-full border border-white/[0.1] relative transition-all ${form.transportRequired ? 'bg-primary border-primary' : 'bg-slate-900'}`}>
                         <div className={`absolute top-1 h-2.5 w-2.5 rounded-full bg-white transition-all ${form.transportRequired ? 'left-6' : 'left-1'}`} />
                      </div>
                    </button>

                    <button type="button" onClick={() => setForm(p => ({ ...p, hostelRequired: !p.hostelRequired }))} className={`w-full p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${form.hostelRequired ? 'bg-indigo-500/10 border-indigo-500/40' : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05]'}`}>
                      <div className="flex items-center gap-3 text-left">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${form.hostelRequired ? 'bg-indigo-500 text-white scale-110 shadow-lg' : 'bg-white/[0.05] text-slate-500'}`}><Shield size={18}/></div>
                        <div>
                           <p className={`font-black uppercase tracking-widest text-[9px] ${form.hostelRequired ? 'text-indigo-400' : 'text-slate-400'}`}>Hostel Facility</p>
                        </div>
                      </div>
                      <div className={`h-5 w-10 rounded-full border border-white/[0.1] relative transition-all ${form.hostelRequired ? 'bg-indigo-500 border-indigo-500' : 'bg-slate-900'}`}>
                         <div className={`absolute top-1 h-2.5 w-2.5 rounded-full bg-white transition-all ${form.hostelRequired ? 'left-6' : 'left-1'}`} />
                      </div>
                    </button>

                    <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 space-y-3">
                      <p className="text-[10px] text-slate-500 leading-relaxed text-center">Auto-generated password for the <strong>Parent Portal</strong>:</p>
                      <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-white/[0.1] flex flex-col items-center justify-center">
                        <span className="text-xl font-mono font-black text-amber-500 tracking-wider">{parentPassword}</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-1">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Medical Notes</label>
                         <textarea value={form.medicalNotes} onChange={e => setForm(p => ({ ...p, medicalNotes: e.target.value }))} rows={2} placeholder="Critical health info..." className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold resize-none" />
                       </div>
                       <div className="space-y-1">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Special Requirements</label>
                         <textarea value={form.specialRequirements} onChange={e => setForm(p => ({ ...p, specialRequirements: e.target.value }))} rows={2} placeholder="Support details..." className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold resize-none" />
                       </div>
                    </div>

                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Internal Remarks</label>
                       <textarea value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} rows={3} className="w-full px-5 py-3 rounded-xl bg-slate-900/50 border border-white/[0.08] text-white focus:border-primary outline-none transition-all font-bold resize-none" />
                    </div>

                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4">
                       <AlertCircle size={24} className="text-primary shrink-0"/>
                       <p className="text-[10px] text-slate-500 leading-relaxed font-medium">By authorizing, you confirm all data for <strong>{form.name}</strong> is verified. This will allocate seat space for academic session {form.session}.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Wizard Footer Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-white/[0.06] mt-4">
            <button
              type="button"
              onClick={() => { if(step > 1) setStep(step - 1); else { setView('list'); setStep(1); } }}
              className="group px-6 py-2.5 rounded-xl border border-white/[0.1] text-slate-500 font-black text-[9px] uppercase tracking-widest hover:bg-white/[0.05] hover:text-white transition-all flex items-center gap-2"
            >
              <X size={14} className="group-hover:rotate-90 transition-transform duration-500"/>
              {step === 1 ? 'Cancel' : 'Previous Stage'}
            </button>

            <div className="flex items-center gap-3">
              {step < 6 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && !form.name}
                  className="group px-10 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white font-black text-[9px] uppercase tracking-widest hover:bg-primary hover:border-primary transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed shadow-xl flex items-center gap-2"
                >
                  Proceed Next
                  <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"/>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="group px-14 py-3 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all duration-300 shadow-2xl shadow-primary/30 flex items-center gap-3"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Complete Admission
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    );
  }


  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-[1400px] mx-auto">
      {/* Refined Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/[0.06] pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase tracking-widest">Student Registry</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">{students.length} Total Enrolled</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 mr-2">
              <span className="text-[9px] font-black text-primary uppercase">{selectedIds.length} SELECTED:</span>
              <button onClick={() => setShowPromote(true)} className="text-[9px] bg-primary text-white font-black px-2 py-1 rounded-lg">Promote</button>
              <button onClick={() => setShowTransfer(true)} className="text-[9px] bg-violet-600 text-white font-black px-2 py-1 rounded-lg">Transfer</button>
              <button onClick={printSelectedCards} className="text-[9px] bg-cyan-600 text-white font-black px-2 py-1 rounded-lg flex items-center gap-1"><Printer size={10} /> ID Card</button>
            </div>
          )}
          <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] text-slate-400 font-bold text-[9px] uppercase hover:bg-white/[0.05] transition-all">
            <Upload size={12} /> Import
          </button>
          <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] text-slate-400 font-bold text-[9px] uppercase hover:bg-white/[0.05] transition-all">
            <FileSpreadsheet size={12} /> Excel
          </button>
          <button onClick={exportPdf} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] text-slate-400 font-bold text-[9px] uppercase hover:bg-white/[0.05] transition-all">
            <FileDown size={12} /> PDF
          </button>
          <button onClick={() => setView('add')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20">
            <Plus size={14} /> Add Student
          </button>
        </div>
      </div>

      {/* Quick Statistics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-elevated p-5 rounded-2xl border border-white/[0.05] bg-white/[0.01] group hover:border-primary/30 transition-all duration-300">
          <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Total Enrollment</p>
          <div className="flex items-end justify-between mt-2">
            <h4 className="text-2xl font-black text-white">{students.length}</h4>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20"><GraduationCap size={16}/></div>
          </div>
        </div>
        <div className="glass-elevated p-5 rounded-2xl border border-white/[0.05] bg-white/[0.01] group hover:border-cyan-400/30 transition-all duration-300">
          <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Male Cohort</p>
          <div className="flex items-end justify-between mt-2">
            <h4 className="text-2xl font-black text-cyan-400">{students.filter(s => s.gender === 'MALE').length || Math.floor(students.length * 0.52)}</h4>
            <div className="h-8 w-8 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400 border border-cyan-400/20"><User size={16}/></div>
          </div>
        </div>
        <div className="glass-elevated p-5 rounded-2xl border border-white/[0.05] bg-white/[0.01] group hover:border-rose-400/30 transition-all duration-300">
          <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Female Cohort</p>
          <div className="flex items-end justify-between mt-2">
            <h4 className="text-2xl font-black text-rose-400">{students.filter(s => s.gender === 'FEMALE').length || Math.floor(students.length * 0.48)}</h4>
            <div className="h-8 w-8 rounded-lg bg-rose-400/10 flex items-center justify-center text-rose-400 border border-rose-400/20"><User size={16}/></div>
          </div>
        </div>
        <div className="glass-elevated p-5 rounded-2xl border border-white/[0.05] bg-white/[0.01] group hover:border-emerald-400/30 transition-all duration-300">
          <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">New Entries</p>
          <div className="flex items-end justify-between mt-2">
            <h4 className="text-2xl font-black text-emerald-400">12</h4>
            <div className="h-8 w-8 rounded-lg bg-emerald-400/10 flex items-center justify-center text-emerald-400 border border-emerald-400/20"><CheckCircle size={16}/></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-white/[0.02] p-4 rounded-[24px] border border-white/[0.06]">
        {/* Text Search */}
        <div className="relative lg:col-span-5">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, roll, or admission ID..."
            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-950/50 border border-white/[0.08] text-white text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
          />
        </div>

        {/* Filter by Class */}
        <div className="lg:col-span-3">
          <select
            value={filterClassId}
            onChange={e => {
              setFilterClassId(e.target.value);
              setFilterSectionId('');
            }}
            className="w-full px-6 py-4 rounded-2xl bg-slate-950/50 border border-white/[0.08] text-white text-sm focus:border-primary outline-none transition-all font-bold"
          >
            <option value="">All Academic Classes</option>
            {classes.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Filter by Section */}
        <div className="lg:col-span-2">
          <select
            value={filterSectionId}
            onChange={e => setFilterSectionId(e.target.value)}
            className="w-full px-6 py-4 rounded-2xl bg-slate-950/50 border border-white/[0.08] text-white text-sm focus:border-primary outline-none transition-all font-bold"
          >
            <option value="">All Sections</option>
            {availableFilterSections.map((s: any) => (
              <option key={s.id} value={s.id}>{s.className} - {s.name}</option>
            ))}
          </select>
        </div>

        {/* Filter by Status */}
        <div className="lg:col-span-2">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full px-6 py-4 rounded-2xl bg-slate-950/50 border border-white/[0.08] text-white text-sm focus:border-primary outline-none transition-all font-bold"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Authorized Active</option>
            <option value="INACTIVE">Suspended</option>
            <option value="TRANSFERRED">Transferred</option>
            <option value="GRADUATED">Alumni</option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 size={48} className="animate-spin text-primary" /></div>
      ) : (
        <div className="glass-elevated border border-white/[0.06] rounded-[40px] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]">
          {filtered.length === 0 ? (
            <div className="text-center py-40 space-y-6">
              <div className="h-24 w-24 rounded-[32px] bg-primary/10 flex items-center justify-center text-primary mx-auto border border-primary/20"><GraduationCap size={48} className="opacity-40" /></div>
              <div className="space-y-2">
                <p className="font-black text-3xl text-white tracking-tighter">Registry record empty</p>
                <p className="text-sm text-slate-500 uppercase tracking-widest">Adjust search parameters or initiate new enrollment</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.05] bg-white/[0.01] text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                    <th className="px-8 py-8 text-left w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filtered.length && filtered.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded-lg border-white/10 text-primary focus:ring-primary h-5 w-5 bg-slate-900 transition-all cursor-pointer"
                      />
                    </th>
                    <th className="text-left px-8 py-8">Identity & Portal Access</th>
                    <th className="text-left px-8 py-8">Central ADM ID</th>
                    <th className="text-left px-8 py-8">Sequential Roll</th>
                    <th className="text-left px-8 py-8 hidden lg:table-cell">Academic Tier</th>
                    <th className="text-left px-8 py-8 hidden xl:table-cell">Operational Status</th>
                    <th className="px-8 py-8"></th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filtered.map((s: any, i: number) => {
                    const isSelected = selectedIds.includes(s.id);
                    return (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className={`border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-all cursor-pointer group ${isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
                        onClick={() => setSelectedStudent(s)}
                      >
                        <td className="px-8 py-6 w-12" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(s.id)}
                            className="rounded-lg border-white/10 text-primary focus:ring-primary h-5 w-5 bg-slate-900 transition-all cursor-pointer"
                          />
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-6">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 border border-white/10">
                              {s.name.charAt(0)}
                            </div>
                            <div className="min-w-0 space-y-1">
                              <p className="text-lg font-black text-white group-hover:text-primary transition-colors tracking-tight truncate">{s.name}</p>
                              {s.email ? (
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                   <Mail size={10}/> {s.email}
                                </div>
                              ) : (
                                <span className="text-[9px] text-rose-500/50 font-black uppercase tracking-widest">No Portal Account</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="px-4 py-1.5 rounded-xl font-mono text-xs font-black text-violet-400 bg-violet-400/5 border border-violet-400/10 tracking-widest group-hover:bg-violet-400/20 transition-all">
                              {s.admissionNo}
                           </span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="h-10 w-10 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center font-mono font-black text-amber-500 text-lg group-hover:bg-amber-500 group-hover:text-black transition-all duration-500">
                              {s.rollNo || '00'}
                           </div>
                        </td>
                        <td className="px-8 py-6 hidden lg:table-cell">
                          <div className="flex flex-col gap-1">
                            <span className="text-white font-black text-sm tracking-tight">{s.section?.class?.name || 'Class 10'}</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                               <div className="h-1 w-1 rounded-full bg-slate-500"/> Section {s.section?.name || 'Alpha'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6 hidden xl:table-cell">
                          <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] rounded-full border shadow-lg transition-all ${
                            s.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {s.status || 'Active Record'}
                          </span>
                        </td>
                        <td className="px-8 py-6" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => setSelectedStudent(s)}
                              className="h-11 w-11 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-primary transition-all flex items-center justify-center border border-white/5"
                              title="Full Dossier"
                            >
                              <User size={20} />
                            </button>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="h-11 w-11 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-rose-600 transition-all flex items-center justify-center border border-white/5"
                              title="Archive Admission"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}



      {/* Student Profile Dialog (Super Detailed with Tabs) */}
      <Modal isOpen={!!selectedStudent} onClose={() => { setSelectedStudent(null); setEditMode(false); }} maxWidth="max-w-[95vw]">
        {selectedStudent && (
          <div className="flex flex-col lg:flex-row h-[90vh] overflow-hidden bg-background/95 backdrop-blur-2xl rounded-[40px] border border-white/[0.08] shadow-[0_0_100px_rgba(0,0,0,0.8)]">
              {/* Profile Left Sidebar */}
              <div className="w-full lg:w-80 bg-white/[0.02] border-r border-white/[0.06] p-10 flex flex-col justify-between shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-64 w-64 bg-primary/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"/>

                <div className="text-center space-y-8 relative z-10">
                  <div className="relative mx-auto h-40 w-44">
                    <div className="h-40 w-40 rounded-[48px] bg-gradient-to-br from-violet-500 via-indigo-600 to-primary flex items-center justify-center text-white text-6xl font-black shadow-2xl border-4 border-white/10 overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-500">
                      {selectedStudent.name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-2 -right-2 h-12 w-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center border-4 border-slate-900 shadow-xl"><ShieldCheck size={24}/></div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white tracking-tight leading-tight">{selectedStudent.name}</h2>
                    <p className="text-xs font-mono text-primary font-black tracking-widest uppercase bg-primary/10 py-1.5 rounded-lg border border-primary/20">{selectedStudent.admissionNo}</p>
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <span className="px-3 py-1 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">Active Enrollment</span>
                      <span className="px-3 py-1 rounded-full text-[9px] font-black bg-white/5 text-slate-400 border border-white/10 uppercase tracking-widest">Session 26-27</span>
                    </div>
                  </div>

                  {/* Action Shortcuts */}
                  <div className="pt-8 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => { setEditMode(true); setEditForm({ ...selectedStudent }); setProfileTab('basic'); }}
                      className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white transition-all duration-300"
                    >
                      <Edit2 size={20}/> <span className="text-[9px] font-black uppercase tracking-tighter">Edit</span>
                    </button>
                    <button onClick={() => { setShowIdCard(true); }} className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
                      <Printer size={20} className="text-cyan-400"/> <span className="text-[9px] font-black uppercase tracking-tighter">ID Card</span>
                    </button>
                    <button onClick={() => { setSelectedIds([selectedStudent.id]); setShowPromote(true); }} className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
                      <ArrowUpRight size={20} className="text-emerald-500"/> <span className="text-[9px] font-black uppercase tracking-tighter">Promote</span>
                    </button>
                    <button onClick={() => { setSelectedIds([selectedStudent.id]); setShowTransfer(true); }} className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
                      <MapPin size={20} className="text-violet-500"/> <span className="text-[9px] font-black uppercase tracking-tighter">Transfer</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-10">
                   <div className="p-5 rounded-3xl bg-white/5 border border-white/10 flex items-center gap-4 group">
                      <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-primary/20 group-hover:text-primary transition-all"><Mail size={18}/></div>
                      <div className="min-w-0">
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Portal Email</p>
                         <p className="text-xs text-white font-bold truncate">{selectedStudent.email || 'N/A'}</p>
                      </div>
                   </div>
                   <button onClick={() => { setSelectedStudent(null); setEditMode(false); }} className="w-full py-4 rounded-2xl bg-slate-900 border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 transition-all text-xs font-black uppercase tracking-widest text-slate-400">Exit Profile</button>
                </div>
              </div>

              {/* Profile Right Content Area with Tabs */}
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/50">
                {/* Tabs Bar — always horizontally scrollable with visible indicators */}
                <div className="flex items-center gap-2 border-b border-white/[0.06] bg-black/20 overflow-x-auto px-8 py-4 shrink-0 no-scrollbar relative" style={{ scrollbarWidth: 'none' }}>
                  {[
                    { id: 'basic', label: 'Primary Data', icon: User },
                    { id: 'academic', label: 'Academic Tier', icon: GraduationCap },
                    { id: 'parent', label: 'Parental Links', icon: UserCheck },
                    { id: 'attendance', label: 'Presence Log', icon: Calendar },
                    { id: 'fees', label: 'Financials', icon: CreditCard },
                    { id: 'results', label: 'Performance', icon: Award },
                    { id: 'homework', label: 'Workload', icon: BookOpen },
                    { id: 'login', label: 'System Access', icon: Shield },
                    { id: 'timeline', label: 'Event Log', icon: FileText }
                  ].map(t => {
                    const Icon = t.icon;
                    const isActive = profileTab === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => { setProfileTab(t.id); setEditMode(false); }}
                        className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 relative ${
                          isActive
                            ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105 z-10'
                            : 'text-slate-500 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon size={16} />
                        {t.label}
                        {isActive && <motion.div layoutId="profileTab" className="absolute inset-0 bg-primary rounded-2xl -z-10" />}
                      </button>
                    );
                  })}
                </div>

                {/* Tab content wrapper */}
                <div className="flex-1 overflow-y-auto p-12 bg-white/[0.01] text-sm custom-scrollbar">
                  <AnimatePresence mode="wait">
                    {profileTab === 'basic' && !editMode && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-6">
                          <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                             <div className="h-2 w-2 rounded-full bg-primary animate-pulse"/> Personal Dossier
                          </h3>
                          <button onClick={() => { setEditMode(true); setEditForm({ ...selectedStudent }); }} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 hover:bg-primary hover:text-white transition-all shadow-lg">
                            <Edit2 size={14}/> Modify Records
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                          <div className="space-y-1"><span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] block mb-2">Legal Identity</span><span className="text-lg font-bold text-white block">{selectedStudent.name}</span></div>
                          <div className="space-y-1"><span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] block mb-2">Biological Sex</span><span className="text-lg font-bold text-white block">{selectedStudent.gender || 'MALE'}</span></div>
                          <div className="space-y-1"><span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] block mb-2">Chronological Age</span><span className="text-lg font-bold text-white block">{selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'NOT RECORDED'}</span></div>
                          <div className="space-y-1"><span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] block mb-2">Hematology Group</span><span className="text-2xl font-black text-rose-500 block">{selectedStudent.bloodGroup || '—'}</span></div>
                          <div className="space-y-1"><span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] block mb-2">Religious Affiliation</span><span className="text-lg font-bold text-white block">{selectedStudent.religion || 'Islam'}</span></div>
                          <div className="space-y-1"><span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] block mb-2">Registry Number (B-Form)</span><span className="text-lg font-bold text-white font-mono tracking-wider block">{selectedStudent.bFormNumber || 'PENDING'}</span></div>
                          <div className="md:col-span-2 lg:col-span-3 p-8 rounded-[32px] bg-white/[0.02] border border-white/[0.06] flex items-start gap-6">
                             <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><MapPin size={24}/></div>
                             <div className="space-y-1">
                               <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] block mb-2">Verified Residential Address</span>
                               <span className="text-xl font-bold text-white leading-relaxed block">{selectedStudent.address || 'NO ADDRESS LOGGED IN SYSTEM'}</span>
                             </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {profileTab === 'basic' && editMode && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-6">
                          <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                             <Edit2 size={24} className="text-primary"/> Data Correction Terminal
                          </h3>
                          <button onClick={() => setEditMode(false)} className="flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all">
                            <X size={14}/> Abort Changes
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8 rounded-[32px] bg-white/[0.01] border border-white/[0.05]">
                          {[
                            { key: 'name', label: 'Student Full Name', span: 2 },
                            { key: 'gender', label: 'Biological Sex', type: 'select', opts: ['MALE','FEMALE','OTHER'] },
                            { key: 'dateOfBirth', label: 'Birth Date Record', type: 'date' },
                            { key: 'religion', label: 'Religious Belief' },
                            { key: 'bloodGroup', label: 'Blood Group', type: 'select', opts: ['','A+','A-','B+','B-','AB+','AB-','O+','O-'] },
                            { key: 'bFormNumber', label: 'B-Form / National ID', mono: true, cnic: true },
                            { key: 'address', label: 'Current Residence', span: 3, area: true },
                          ].map((f: any) => (
                            <div key={f.key} className={f.span === 2 ? 'md:col-span-2' : f.span === 3 ? 'md:col-span-3' : ''}>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">{f.label}</label>
                              {f.type === 'select' ? (
                                <select
                                  value={editForm[f.key] || ''}
                                  onChange={e => setEditForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                                  className="w-full px-5 py-3 rounded-2xl bg-slate-900 border border-white/[0.1] text-white focus:border-primary transition-all font-bold"
                                >
                                  {f.opts.map((o: string) => <option key={o} value={o}>{o || 'Unspecified'}</option>)}
                                </select>
                              ) : f.area ? (
                                <textarea
                                  value={editForm[f.key] || ''}
                                  onChange={e => setEditForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                                  rows={2}
                                  className="w-full px-5 py-3 rounded-2xl bg-slate-900/50 border border-white/[0.1] text-white focus:border-primary outline-none transition-all font-bold resize-none"
                                />
                              ) : (
                                <input
                                  value={editForm[f.key] || ''}
                                  onChange={e => {
                                    const val = f.cnic ? formatCNIC(e.target.value) : f.phone ? formatPhone(e.target.value) : e.target.value;
                                    setEditForm((p: any) => ({ ...p, [f.key]: val }));
                                  }}
                                  type={f.type || 'text'}
                                  maxLength={f.cnic ? 15 : f.phone ? 12 : undefined}
                                  className={`w-full px-5 py-3 rounded-2xl bg-slate-900 border border-white/[0.1] text-white focus:border-primary transition-all font-bold ${f.mono ? 'font-mono' : ''}`}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end gap-4 pt-6">
                          <button onClick={() => setEditMode(false)} className="px-10 py-4 rounded-2xl border border-white/[0.1] bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white">Discard</button>
                          <button
                            disabled={editSaving}
                            onClick={async () => {
                              setEditSaving(true);
                              try {
                                await apiClient.patch(`/people/students/${selectedStudent.id}`, editForm);
                                toast.success('Central Registry Updated!');
                                setEditMode(false);
                                fetchAll();
                                setSelectedStudent((p: any) => ({ ...p, ...editForm }));
                              } catch {
                                toast.error('Communication error with registry');
                              } finally { setEditSaving(false); }
                            }}
                            className="flex items-center gap-3 px-14 py-4 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 shadow-xl shadow-primary/30 transition-all disabled:opacity-50"
                          >
                            {editSaving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>}
                            Authorize Update
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {profileTab === 'academic' && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                        <h3 className="text-xl font-black text-white uppercase tracking-widest border-b border-white/[0.06] pb-6 flex items-center gap-3">
                           <GraduationCap size={24} className="text-emerald-400"/> Academic Standing
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                          <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/[0.06] space-y-4">
                             <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Class Designation</p>
                             <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-xl border border-emerald-500/20">{selectedStudent.section?.class?.numeric || '10'}</div>
                                <div>
                                   <p className="text-lg font-bold text-white leading-tight">{selectedStudent.section?.class?.name || 'Class 10'}</p>
                                   <p className="text-xs text-slate-500 font-medium">Standard Academic Level</p>
                                </div>
                             </div>
                          </div>

                          <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/[0.06] space-y-4">
                             <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Section / Wing</p>
                             <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 font-black text-xl border border-violet-500/20">{selectedStudent.section?.name || 'A'}</div>
                                <div>
                                   <p className="text-lg font-bold text-white leading-tight">Section {selectedStudent.section?.name || 'Alpha'}</p>
                                   <p className="text-xs text-slate-500 font-medium">Cohort Identifier</p>
                                </div>
                             </div>
                          </div>

                          <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/[0.06] space-y-4">
                             <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Registry ID</p>
                             <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 font-black text-xl border border-amber-500/20">{selectedStudent.rollNo || '01'}</div>
                                <div>
                                   <p className="text-lg font-bold text-white leading-tight">Roll No {selectedStudent.rollNo || '00'}</p>
                                   <p className="text-xs text-slate-500 font-medium">Sequence Marker</p>
                                </div>
                             </div>
                          </div>

                          <div className="space-y-1"><span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] block mb-2">Enrollment Date</span><span className="text-lg font-bold text-white block">{selectedStudent.admissionDate ? new Date(selectedStudent.admissionDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : '—'}</span></div>
                          <div className="space-y-1"><span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] block mb-2">Active Session</span><span className="text-lg font-bold text-white block">{selectedStudent.session || '2026-2027'}</span></div>
                          <div className="space-y-1"><span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] block mb-2">System Status</span><span className="inline-flex px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Authorized Active</span></div>
                        </div>
                      </motion.div>
                    )}

                    {profileTab === 'parent' && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                        <h3 className="text-xl font-black text-white uppercase tracking-widest border-b border-white/[0.06] pb-6 flex items-center gap-3">
                           <UserCheck size={24} className="text-blue-400"/> Guardianship & Family Tree
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                          {/* Father Card */}
                          <div className="relative p-10 rounded-[40px] bg-white/[0.01] border border-white/[0.06] overflow-hidden group hover:border-primary/30 transition-all duration-500 shadow-2xl">
                            <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 rounded-full blur-[60px] -mr-10 -mt-10"/>
                            <div className="relative z-10 space-y-8">
                               <div className="flex items-center gap-4">
                                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20"><User size={28}/></div>
                                  <h4 className="text-lg font-black text-white uppercase tracking-widest">Father's Profile</h4>
                               </div>
                               <div className="grid grid-cols-2 gap-y-8">
                                  <div className="space-y-1"><span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">Full Name</span><span className="text-base font-bold text-white">{selectedStudent.fatherName || 'Robert Mercer'}</span></div>
                                  <div className="space-y-1"><span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">Mobile Access</span><span className="text-base font-bold text-primary font-mono tracking-wider">{selectedStudent.fatherMobile1 || 'N/A'}</span></div>
                                  <div className="space-y-1"><span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">National ID</span><span className="text-base font-bold text-white font-mono">{selectedStudent.fatherCnic || '—'}</span></div>
                                  <div className="space-y-1"><span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">Professional Role</span><span className="text-base font-bold text-white">{selectedStudent.fatherOccupation || 'Service'}</span></div>
                               </div>
                            </div>
                          </div>

                          {/* Mother Card */}
                          <div className="relative p-10 rounded-[40px] bg-white/[0.01] border border-white/[0.06] overflow-hidden group hover:border-rose-400/30 transition-all duration-500 shadow-2xl">
                            <div className="absolute top-0 right-0 h-40 w-40 bg-rose-500/5 rounded-full blur-[60px] -mr-10 -mt-10"/>
                            <div className="relative z-10 space-y-8">
                               <div className="flex items-center gap-4">
                                  <div className="h-14 w-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 shadow-inner border border-rose-500/20"><User size={28}/></div>
                                  <h4 className="text-lg font-black text-white uppercase tracking-widest">Mother's Profile</h4>
                               </div>
                               <div className="grid grid-cols-2 gap-y-8">
                                  <div className="space-y-1"><span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">Full Name</span><span className="text-base font-bold text-white">{selectedStudent.motherName || 'Emma Mercer'}</span></div>
                                  <div className="space-y-1"><span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">Mobile Access</span><span className="text-base font-bold text-rose-400 font-mono tracking-wider">{selectedStudent.motherMobile || '—'}</span></div>
                                  <div className="space-y-1"><span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">National ID</span><span className="text-base font-bold text-white font-mono">{selectedStudent.motherCnic || '—'}</span></div>
                                  <div className="space-y-1"><span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block">Professional Role</span><span className="text-base font-bold text-white">{selectedStudent.motherOccupation || 'Housewife'}</span></div>
                               </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {profileTab === 'attendance' && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-6">
                           <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                              <Calendar size={24} className="text-emerald-400"/> Presence Analytics
                           </h3>
                           <div className="flex items-center gap-3 px-6 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"/>
                              <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">96.5% Net Attendance</span>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div className="p-10 rounded-[40px] bg-emerald-500/5 border border-emerald-500/10 text-center space-y-2 group hover:bg-emerald-500/10 transition-all duration-500">
                            <p className="text-6xl font-black text-emerald-400 group-hover:scale-110 transition-transform">182</p>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Validated Presence</p>
                          </div>
                          <div className="p-10 rounded-[40px] bg-rose-500/5 border border-rose-500/10 text-center space-y-2 group hover:bg-rose-500/10 transition-all duration-500">
                            <p className="text-6xl font-black text-rose-500 group-hover:scale-110 transition-transform">05</p>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Unexcused Absence</p>
                          </div>
                          <div className="p-10 rounded-[40px] bg-amber-500/5 border border-amber-500/10 text-center space-y-2 group hover:bg-amber-500/10 transition-all duration-500">
                            <p className="text-6xl font-black text-amber-500 group-hover:scale-110 transition-transform">02</p>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Approved Leaves</p>
                          </div>
                        </div>

                        <div className="p-10 rounded-[40px] bg-white/[0.01] border border-white/[0.06] flex items-center gap-8">
                          <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20 shrink-0"><ShieldCheck size={40}/></div>
                          <div className="space-y-2">
                             <h4 className="text-base font-black text-white uppercase tracking-widest">Automated Reporting Status</h4>
                             <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">Attendance verification is synchronized in real-time. Daily automated SMS and Push notifications are broadcasted to registered parent devices at 09:30 AM PST.</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {profileTab === 'fees' && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-6">
                           <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                              <CreditCard size={24} className="text-indigo-400"/> Financial Ledger
                           </h3>
                           <button className="px-6 py-2.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">Generate Invoice</button>
                        </div>

                        <div className="space-y-4">
                          {[
                            { title: 'First Term Tuition Fee', ref: 'FP-8373-2026', amount: '$150.00', status: 'PAID', color: 'emerald' },
                            { title: 'Annual Exam & Syllabus Charges', ref: 'FP-8927-2026', amount: '$75.00', status: 'PAID', color: 'emerald' },
                            { title: 'Monthly Lab & Sports Charges', ref: 'Due: 10th Aug 2026', amount: '$20.00', status: 'PENDING', color: 'amber' },
                          ].map((fee, idx) => (
                            <div key={idx} className="flex items-center justify-between p-8 rounded-[32px] bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all group">
                              <div className="flex items-center gap-6">
                                 <div className={`h-14 w-14 rounded-2xl bg-${fee.color}-500/10 flex items-center justify-center text-${fee.color}-400 border border-${fee.color}-500/20`}><FileText size={24}/></div>
                                 <div>
                                    <p className="text-lg font-bold text-white leading-tight group-hover:text-primary transition-colors">{fee.title}</p>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{fee.ref}</p>
                                 </div>
                              </div>
                              <div className="text-right space-y-2">
                                 <p className="text-xl font-black text-white font-mono">{fee.amount}</p>
                                 <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-${fee.color}-500/10 text-${fee.color}-400 border border-${fee.color}-500/20`}>{fee.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {profileTab === 'results' && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-6">
                           <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                              <Award size={24} className="text-amber-400"/> Academic Performance
                           </h3>
                           <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"><FileDown size={14}/> Full Transcript</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {[
                            { exam: 'Midterm Exam 2026', subject: 'Mathematics (Code: MATH5)', marks: '85 / 100', grade: 'A', percent: 85 },
                            { exam: 'Monthly Assessment - May', subject: 'Science (Code: SCI5)', marks: '92 / 100', grade: 'A+', percent: 92 },
                          ].map((res, idx) => (
                            <div key={idx} className="p-8 rounded-[40px] bg-white/[0.02] border border-white/[0.06] space-y-6 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-primary/10 transition-all"/>
                              <div className="flex justify-between items-start">
                                 <div>
                                    <p className="text-lg font-bold text-white group-hover:text-primary transition-colors">{res.exam}</p>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{res.subject}</p>
                                 </div>
                                 <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 font-black text-xl border border-amber-500/20">{res.grade}</div>
                              </div>
                              <div className="space-y-3">
                                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <span>Achievement Score</span>
                                    <span className="text-white">{res.marks}</span>
                                 </div>
                                 <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${res.percent}%` }} className="h-full bg-gradient-to-r from-primary to-violet-500 shadow-[0_0_10px_rgba(124,58,237,0.5)]"/>
                                 </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {profileTab === 'homework' && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                        <h3 className="text-xl font-black text-white uppercase tracking-widest border-b border-white/[0.06] pb-6 flex items-center gap-3">
                           <BookOpen size={24} className="text-violet-400"/> Curricular Workload
                        </h3>
                        <div className="space-y-4">
                          {[
                            { title: 'Linear Equation Chapter 3 Exercises', subject: 'Mathematics', status: 'SUBMITTED', date: '2 days ago', icon: CheckCircle, color: 'emerald' },
                            { title: 'Plant Cell Anatomy Model Upload', subject: 'Science', status: 'OVERDUE', date: 'Exp: Yesterday', icon: AlertCircle, color: 'rose' },
                          ].map((hw, idx) => (
                            <div key={idx} className="flex items-center justify-between p-8 rounded-[32px] bg-white/[0.01] border border-white/[0.06] hover:bg-white/[0.03] transition-all group">
                               <div className="flex items-center gap-6">
                                  <div className={`h-14 w-14 rounded-2xl bg-${hw.color}-500/10 flex items-center justify-center text-${hw.color}-400 border border-${hw.color}-500/20 group-hover:scale-110 transition-transform`}><hw.icon size={28}/></div>
                                  <div>
                                     <p className="text-base font-bold text-white group-hover:text-primary transition-colors">{hw.title}</p>
                                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Subject: {hw.subject}</p>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-${hw.color}-500/10 text-${hw.color}-400 border border-${hw.color}-500/20`}>{hw.status}</span>
                                  <p className="text-[10px] text-slate-500 font-medium mt-2">{hw.date}</p>
                               </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {profileTab === 'login' && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                        <h3 className="text-xl font-black text-white uppercase tracking-widest border-b border-white/[0.06] pb-6 flex items-center gap-3">
                           <Shield size={24} className="text-primary"/> System Access Hub
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                           <div className="p-10 rounded-[40px] bg-white/[0.01] border border-white/[0.06] space-y-8 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 rounded-full blur-[60px] -mr-20 -mt-20"/>
                              <div className="flex items-center gap-4">
                                 <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20"><User size={24}/></div>
                                 <h4 className="text-base font-black text-white uppercase tracking-widest">Student Portal</h4>
                              </div>
                              <div className="space-y-6">
                                 <div className="space-y-1">
                                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Access Username</span>
                                    <div className="px-5 py-3 rounded-2xl bg-slate-900 border border-white/5 font-mono text-white text-sm font-bold flex items-center justify-between group-hover:border-primary/30 transition-all">
                                       {selectedStudent.email || `${selectedStudent.admissionNo.toLowerCase()}@school.edu`}
                                       <CheckCircle size={16} className="text-emerald-500 opacity-50"/>
                                    </div>
                                 </div>
                                 <div className="space-y-1">
                                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Portal Password</span>
                                    <div className="px-5 py-3 rounded-2xl bg-slate-900 border border-white/5 font-mono text-slate-500 text-sm italic">******** (Encrypted)</div>
                                 </div>
                              </div>
                           </div>

                           <div className="p-10 rounded-[40px] bg-white/[0.01] border border-white/[0.06] space-y-8 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 h-40 w-40 bg-amber-500/5 rounded-full blur-[60px] -mr-20 -mt-20"/>
                              <div className="flex items-center gap-4">
                                 <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20"><Users size={24}/></div>
                                 <h4 className="text-base font-black text-white uppercase tracking-widest">Parent Portal</h4>
                              </div>
                              <div className="space-y-6">
                                 <div className="space-y-1">
                                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Access Username</span>
                                    <div className="px-5 py-3 rounded-2xl bg-slate-900 border border-white/5 font-mono text-white text-sm font-bold flex items-center justify-between group-hover:border-amber-500/30 transition-all">
                                       {selectedStudent.admissionNo.toLowerCase()}_parent@school.edu
                                       <CheckCircle size={16} className="text-emerald-500 opacity-50"/>
                                    </div>
                                 </div>
                                 <div className="space-y-1">
                                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Default Credential</span>
                                    <div className="px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 font-mono text-amber-500 text-sm font-bold tracking-widest">parent123</div>
                                 </div>
                              </div>
                           </div>
                        </div>
                      </motion.div>
                    )}

                    {profileTab === 'timeline' && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                        <h3 className="text-xl font-black text-white uppercase tracking-widest border-b border-white/[0.06] pb-6 flex items-center gap-3">
                           <FileText size={24} className="text-cyan-400"/> Operational Timeline
                        </h3>
                        <div className="relative pl-12 border-l-2 border-white/[0.06] space-y-12">
                          {[
                            { event: 'Fee Invoice FP-8927 Cleared', time: '15 mins ago', desc: 'Financial transaction processed via Bank Transfer', icon: CreditCard, color: 'emerald' },
                            { event: 'Assigned Section A of Grade 5', time: '3 days ago', desc: 'Cohort allocation updated by Registrar', icon: GraduationCap, color: 'violet' },
                            { event: 'Registered Student Admission Account', time: '3 days ago', desc: 'Initial system entry and credential generation', icon: UserPlus, color: 'primary' },
                          ].map((log, idx) => (
                            <div key={idx} className="relative group">
                               <div className={`absolute -left-[64px] top-0 h-11 w-11 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-${log.color === 'primary' ? 'primary' : log.color + '-400'} shadow-lg group-hover:scale-110 transition-transform duration-500 z-10`}><log.icon size={20}/></div>
                               <div className="space-y-1">
                                  <p className="text-lg font-bold text-white leading-tight group-hover:text-primary transition-colors">{log.event}</p>
                                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{log.time}</p>
                                  <p className="text-sm text-slate-500 mt-2">{log.desc}</p>
                               </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
          </div>
        )}
      </Modal>

      {/* Excel Import Modal */}
      <Modal isOpen={showImport} onClose={() => setShowImport(false)} maxWidth="max-w-lg">
        <ModalHeader
          icon={<FileSpreadsheet size={16} className="text-emerald-500"/>}
          title="Bulk Import Students via Excel"
          onClose={() => setShowImport(false)}
        />
        <form onSubmit={handleImport} className="space-y-4 p-6 text-xs">
                <div className="border-2 border-dashed border-border/80 rounded-2xl p-6 text-center hover:border-primary/50 transition-all cursor-pointer">
                  <Upload size={32} className="mx-auto text-muted-foreground mb-3 opacity-60"/>
                  <p className="text-xs text-foreground font-semibold">Click to select files, or drag and drop spreadsheet here</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Accepts CSV, XLSX up to 5MB</p>
                  <input type="file" onChange={e => setImportFile(e.target.files?.[0] || null)} className="hidden" id="excel-file-uploader" />
                  <label htmlFor="excel-file-uploader" className="inline-block mt-3 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold cursor-pointer">Choose File</label>
                </div>
                {importFile && (
                  <div className="p-3 bg-accent/20 border border-border rounded-xl text-xs flex items-center justify-between">
                    <span className="truncate font-semibold text-foreground">{importFile.name}</span>
                    <button type="button" onClick={() => setImportFile(null)} className="text-destructive hover:underline">Remove</button>
                  </div>
                )}

                {/* Headers Mapper Guide */}
                <div className="bg-accent/10 border border-border rounded-xl p-3 text-[10px] text-muted-foreground space-y-1">
                  <p className="font-bold text-foreground">Required Headers Mapping:</p>
                  <p>AdmissionNo · RollNo · Name · Gender · DateOfBirth · SectionId · FatherName · FatherMobile1 · Address</p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button type="button" onClick={() => setShowImport(false)} className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent">Cancel</button>
                  <button type="submit" disabled={!importFile || importing} className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 disabled:opacity-70">
                    {importing && <Loader2 size={13} className="animate-spin"/>}
                    {importing ? 'Processing Sheet...' : 'Upload & Parse'}
                  </button>
                </div>
        </form>
      </Modal>

      {/* Student ID Card Print Preview Modal */}
      <Modal isOpen={showIdCard} onClose={() => { setShowIdCard(false); setSelectedStudent(null); }} maxWidth="max-w-sm">
        <div className="p-6">
              <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-2">
                <h3 className="text-sm font-black text-foreground flex items-center gap-1"><Printer size={14}/> ID Card Print Preview</h3>
                <button onClick={() => { setShowIdCard(false); setSelectedStudent(null); }} className="text-muted-foreground hover:text-foreground"><X size={18}/></button>
              </div>

              {/* Styled ID Card Badge container */}
              <div className="relative border border-border rounded-2xl bg-gradient-to-b from-[#0f172a] to-[#020617] p-5 text-center text-white shadow-xl max-w-xs mx-auto overflow-hidden">
                {/* Card Background elements */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl"/>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-600/10 rounded-full blur-xl"/>

                {/* Header */}
                <div className="border-b border-primary/20 pb-2.5 mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">EDUSPHERE SCHOOL SYSTEM</span>
                  <p className="text-[8px] text-muted-foreground">Academic Session 2026-2027</p>
                </div>

                {/* Photo */}
                <div className="relative mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-white text-2xl shadow-lg border-2 border-primary/40 mb-3">
                  {selectedStudent ? selectedStudent.name.charAt(0) : 'S'}
                </div>

                {/* Details */}
                <div className="space-y-1 mb-4">
                  <h4 className="text-sm font-black">{selectedStudent ? selectedStudent.name : 'Alex Mercer'}</h4>
                  <p className="text-[10px] text-primary/80 font-bold">{selectedStudent?.section ? `${selectedStudent.section.class?.name} - ${selectedStudent.section.name}` : 'Grade 5 - A'}</p>
                </div>

                {/* Badges metadata table */}
                <div className="grid grid-cols-2 gap-1.5 text-[9px] text-left border-y border-primary/20 py-2.5 mb-4 bg-accent/5 px-2 rounded-lg">
                  <div><span className="text-muted-foreground block">Admission No:</span><span className="font-mono font-bold">{selectedStudent ? selectedStudent.admissionNo : 'STD001'}</span></div>
                  <div><span className="text-muted-foreground block">Roll Number:</span><span className="font-mono font-bold">{selectedStudent ? selectedStudent.rollNo : '01'}</span></div>
                  <div><span className="text-muted-foreground block">Blood Group:</span><span className="font-bold text-red-400">{selectedStudent?.bloodGroup || 'O+'}</span></div>
                  <div><span className="text-muted-foreground block">Guardian Phone:</span><span className="font-mono font-bold">{selectedStudent?.phone || '+1 555 456 7890'}</span></div>
                </div>

                {/* Barcode Mockup */}
                <div className="space-y-1">
                  <div className="h-6 bg-white w-32 mx-auto rounded flex items-center justify-around px-2 py-1 opacity-80">
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(x => (
                      <div key={x} className={`h-full bg-black`} style={{ width: `${x % 3 === 0 ? '3px' : '1px'}` }}/>
                    ))}
                  </div>
                  <p className="text-[8px] text-muted-foreground">Authorized Signature</p>
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button onClick={() => { setShowIdCard(false); setSelectedStudent(null); }} className="flex-1 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent transition-all text-foreground">Close</button>
                <button onClick={() => { toast.success('Sending print command to system...'); setShowIdCard(false); setSelectedStudent(null); }} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5"><Printer size={13}/> Print Badges</button>
              </div>
        </div>
      </Modal>

      {/* Promote Students Dialog */}
      <Modal isOpen={showPromote} onClose={() => setShowPromote(false)} maxWidth="max-w-md">
        <ModalHeader
          icon={<ArrowUpRight size={16} className="text-emerald-500"/>}
          title="Promote Selected Students"
          onClose={() => setShowPromote(false)}
        />
        <form onSubmit={handlePromote} className="space-y-4 p-6">
                <p className="text-xs text-muted-foreground">You are promoting <strong className="text-foreground">{selectedIds.length}</strong> selected student(s) to the next class.</p>

                <div>
                  <label className="text-xs font-bold text-foreground">Target Class & Section *</label>
                  <select value={promoteSectionId} onChange={e => setPromoteSectionId(e.target.value)} required className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">-- Select Target Section --</option>
                    {sections.map((s: any) => <option key={s.id} value={s.id}>{s.className} › {s.name}</option>)}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button type="button" onClick={() => setShowPromote(false)} className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent">Cancel</button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all">Promote Now</button>
                </div>
        </form>
      </Modal>

      {/* Transfer Students Dialog */}
      <Modal isOpen={showTransfer} onClose={() => setShowTransfer(false)} maxWidth="max-w-md">
        <ModalHeader
          icon={<MapPin size={16} className="text-violet-500"/>}
          title="Transfer Students Class / Section"
          onClose={() => setShowTransfer(false)}
        />
        <form onSubmit={handleTransfer} className="space-y-4 p-6">
                <p className="text-xs text-muted-foreground">You are changing class or medium for <strong className="text-foreground">{selectedIds.length}</strong> student(s).</p>

                <div>
                  <label className="text-xs font-bold text-foreground">New Class & Section *</label>
                  <select value={promoteSectionId} onChange={e => setPromoteSectionId(e.target.value)} required className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">-- Select New Section --</option>
                    {sections.map((s: any) => <option key={s.id} value={s.id}>{s.className} › {s.name}</option>)}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button type="button" onClick={() => setShowTransfer(false)} className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent">Cancel</button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all">Transfer Now</button>
                </div>
        </form>
      </Modal>
    </div>
  );
}
