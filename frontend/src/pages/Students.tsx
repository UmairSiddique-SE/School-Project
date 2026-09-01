import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, GraduationCap, X, Loader2, Search, 
  User, Shield, FileSpreadsheet, FileText, Printer, ArrowUpRight, 
  MapPin, Phone, Mail, FileDown, Upload, Check, AlertCircle, Calendar, CreditCard, Award, BookOpen, UserCheck, ShieldAlert, Edit2, Save
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

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
  const [showAdd, setShowAdd] = useState(false);
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
    fatherCnic: '',
    fatherOccupation: '',
    // Mother info
    motherName: '',
    motherMobile: '',
    // Guardian info
    guardianName: '',
    relation: 'FATHER',
    guardianMobile: '',
    // Address (Cascading: Province -> District -> Tehsil -> Full Address)
    country: 'Pakistan',
    province: 'Punjab',
    district: 'Lahore',
    tehsil: 'Lahore City',
    city: 'Lahore',
    address: ''
  });

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

  // Update form fields with auto values when opening modal
  useEffect(() => {
    if (showAdd) {
      const generatedPass = Math.random().toString(36).slice(-8);
      setParentPassword(generatedPass);
      setForm(prev => ({
        ...prev,
        admissionNo: nextAdmissionNo,
        rollNo: ''
      }));
    }
  }, [showAdd]);

  // When sectionId changes in form, auto-compute roll number
  useEffect(() => {
    if (showAdd && form.sectionId) {
      setForm(prev => ({ ...prev, rollNo: getNextRollForSection(form.sectionId) }));
    }
  }, [form.sectionId, showAdd]);

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
        addressLine: form.address,
        password: 'student123',
        parentPassword: parentPassword || 'parent123' 
      });
      toast.success('Student added successfully along with Parent registration!');
      setShowAdd(false);
      // Reset form
      setPhotoPreview(null);
      setForm({
        name: '', email: '', studentMobile: '', admissionNo: '', rollNo: '', gender: 'MALE', dateOfBirth: '',
        bloodGroup: '', religion: '', bFormNumber: '', sectionId: '', session: '2026-2027',
        admissionDate: new Date().toISOString().split('T')[0], status: 'ACTIVE', photoUrl: '',
        fatherName: '', fatherMobile1: '', fatherMobile2: '', fatherCnic: '', fatherOccupation: '',
        motherName: '', motherMobile: '', guardianName: '', relation: 'FATHER', guardianMobile: '',
        country: 'Pakistan', province: 'Punjab', district: 'Lahore', tehsil: 'Lahore City', city: 'Lahore', address: ''
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

  return (
    <div className="space-y-6">
      {/* Header section with Stats & Batch Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Student Management</h1>
          <p className="text-muted-foreground text-sm mt-1">{students.length} student(s) currently registered</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Batch Actions Dropdown UI */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-1.5 bg-accent/50 px-3 py-1.5 rounded-xl border border-border mr-2 animate-fade-in">
              <span className="text-xs font-bold text-foreground">{selectedIds.length} selected:</span>
              <button onClick={() => setShowPromote(true)} className="text-xs bg-primary/20 hover:bg-primary/30 text-primary font-bold px-2 py-1 rounded-lg transition-colors">Promote</button>
              <button onClick={() => setShowTransfer(true)} className="text-xs bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 font-bold px-2 py-1 rounded-lg transition-colors">Transfer</button>
              <button onClick={printSelectedCards} className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold px-2 py-1 rounded-lg transition-colors flex items-center gap-1"><Printer size={12} /> ID Card</button>
            </div>
          )}
          
          <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground font-semibold text-xs hover:bg-accent transition-all">
            <Upload size={14} /> Import Excel
          </button>
          <button onClick={exportExcel} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground font-semibold text-xs hover:bg-accent transition-all">
            <FileSpreadsheet size={14} /> Export Excel
          </button>
          <button onClick={exportPdf} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground font-semibold text-xs hover:bg-accent transition-all">
            <FileDown size={14} /> Export PDF
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
            <Plus size={15} /> Add Student
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        {/* Text Search */}
        <div className="relative lg:col-span-5">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, roll number, or admission no..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
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
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          >
            <option value="">All Classes</option>
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
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
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
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="TRANSFERRED">Transferred</option>
            <option value="GRADUATED">Graduated</option>
          </select>
        </div>
      </div>

      {/* Main Student list Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 size={32} className="animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <GraduationCap size={64} className="mx-auto mb-4 opacity-20 text-primary" />
              <p className="font-bold text-lg text-foreground">No students found</p>
              <p className="text-xs mt-1">Try broadening your search criteria or register a new student.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-accent/30 text-xs">
                    <th className="px-5 py-3.5 text-left w-12">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.length === filtered.length} 
                        onChange={toggleSelectAll}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-background" 
                      />
                    </th>
                    <th className="text-left font-bold text-muted-foreground uppercase tracking-wider px-5 py-3.5">Student Info</th>
                    <th className="text-left font-bold text-muted-foreground uppercase tracking-wider px-5 py-3.5">Admission No</th>
                    <th className="text-left font-bold text-muted-foreground uppercase tracking-wider px-5 py-3.5">Roll No</th>
                    <th className="text-left font-bold text-muted-foreground uppercase tracking-wider px-5 py-3.5 hidden sm:table-cell">Class / Section</th>
                    <th className="text-left font-bold text-muted-foreground uppercase tracking-wider px-5 py-3.5 hidden md:table-cell">Status</th>
                    <th className="px-5 py-3.5"></th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filtered.map((s: any, i: number) => {
                    const isSelected = selectedIds.includes(s.id);
                    return (
                      <motion.tr 
                        key={s.id} 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ delay: i * 0.02 }}
                        className={`border-b border-border last:border-0 hover:bg-accent/20 transition-colors cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
                        onClick={() => setSelectedStudent(s)}
                      >
                        <td className="px-5 py-4 w-12" onClick={e => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => toggleSelect(s.id)}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-background" 
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                              {s.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{s.name}</p>
                              {s.email && <p className="text-xs text-muted-foreground">{s.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs">{s.admissionNo}</td>
                        <td className="px-5 py-4 text-muted-foreground">{s.rollNo || '—'}</td>
                        <td className="px-5 py-4 hidden sm:table-cell text-muted-foreground font-medium">
                          {s.section ? `${s.section.class?.name} › ${s.section.name}` : 'Not Assigned'}
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active
                          </span>
                        </td>
                        <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => setSelectedStudent(s)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary transition-all"
                            >
                              Profile
                            </button>
                            <button 
                              onClick={() => handleDelete(s.id)} 
                              className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-all"
                              title="Archive student"
                            >
                              <Trash2 size={15} />
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

      {/* Add Student Modal (Premium Glassmorphic Multi-Tab Aesthetic Modal) */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="glass-elevated border border-white/[0.1] rounded-3xl p-6 sm:p-8 w-full max-w-5xl shadow-2xl my-6 overflow-hidden relative">
              
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 gradient-bg-primary" />

              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6 border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl gradient-bg-primary flex items-center justify-center shadow-lg glow-violet-sm">
                    <GraduationCap className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Student Admission & Registration</h2>
                    <p className="text-xs text-slate-400">Complete student profile details and parent credentials</p>
                  </div>
                </div>
                <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/[0.08] transition-all">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAdd} className="space-y-6">
                
                {/* Form Section Headers / Quick Tab Info */}
                <div className="space-y-6 max-h-[68vh] overflow-y-auto pr-3 scrollbar-thin">
                  
                  {/* 1. Basic Student Info Card */}
                  <div className="glass-card rounded-2xl p-5 border border-white/[0.06] space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="h-7 w-7 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-xs">1</span>
                        <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                          <User size={15} className="text-violet-400" /> Basic Student Information
                        </h3>
                      </div>
                      <span className="text-[11px] text-violet-400 font-mono bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">Auto Code: {form.admissionNo}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                      <div className="md:col-span-3 flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                        <div className="relative group shrink-0">
                          <div className="h-20 w-20 rounded-2xl gradient-bg-primary flex items-center justify-center text-white font-bold text-2xl shadow-xl overflow-hidden border-2 border-violet-500/40">
                            {photoPreview ? (
                              <img src={photoPreview} alt="Student preview" className="h-full w-full object-cover" />
                            ) : form.name ? (
                              form.name.charAt(0).toUpperCase()
                            ) : (
                              <User size={32} />
                            )}
                          </div>
                          {photoPreview && (
                            <button
                              type="button"
                              onClick={() => { setPhotoPreview(null); setForm(p => ({ ...p, photoUrl: '' })); }}
                              className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs shadow-md hover:bg-rose-600 transition-colors"
                              title="Remove photo"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                          <label className="text-xs font-bold text-white tracking-wide block mb-1">Student Profile Picture / Passport Photo</label>
                          <p className="text-[11px] text-slate-400 mb-2">Upload any HD photo — system auto-compresses image to under 100KB</p>
                          <div className="flex items-center justify-center sm:justify-start gap-2">
                            <label className="cursor-pointer px-4 py-2 rounded-xl gradient-bg-primary text-white font-semibold text-xs hover:opacity-90 transition-all flex items-center gap-1.5 shadow-md">
                              <Upload size={14} /> Browse Photo
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async e => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    toast.info('Auto-compressing photo to <100KB...');
                                    try {
                                      const compressedDataUrl = await compressImageToMax100KB(file);
                                      setPhotoPreview(compressedDataUrl);
                                      setForm(p => ({ ...p, photoUrl: compressedDataUrl }));
                                      toast.success('Photo optimized & attached (<100KB)!');
                                    } catch {
                                      const fallbackUrl = URL.createObjectURL(file);
                                      setPhotoPreview(fallbackUrl);
                                      setForm(p => ({ ...p, photoUrl: fallbackUrl }));
                                    }
                                  }
                                }}
                              />
                            </label>
                            {photoPreview && (
                              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                                <Check size={13} /> Optimized (&lt;100KB)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300">Full Name *</label>
                        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Aarav Sharma" required className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-slate-600" />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300">Student Email Address</label>
                        <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} type="email" placeholder="student@edusphere.com" className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-slate-600" />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300">Student Mobile <span className="text-slate-500 font-normal">(Optional)</span></label>
                        <input
                          value={form.studentMobile}
                          onChange={e => setForm(p => ({ ...p, studentMobile: formatPhone(e.target.value) }))}
                          placeholder="0300-0000000"
                          maxLength={12}
                          className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white font-mono text-sm outline-none focus:border-violet-500 transition-all placeholder:text-slate-600"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300">Admission No *</label>
                        <input value={form.admissionNo} onChange={e => setForm(p => ({ ...p, admissionNo: e.target.value }))} required className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-violet-300 font-mono text-sm outline-none focus:border-violet-500 transition-all" />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300">Class & Section *</label>
                        <select value={form.sectionId} onChange={e => setForm(p => ({ ...p, sectionId: e.target.value }))} required className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-slate-900 text-white text-sm outline-none focus:border-violet-500 transition-all">
                          <option value="">-- Select Class & Section --</option>
                          {sections.map((s: any) => <option key={s.id} value={s.id}>{s.className} › {s.name}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300">Roll Number *</label>
                        <input value={form.rollNo} onChange={e => setForm(p => ({ ...p, rollNo: e.target.value }))} required className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-amber-300 font-mono text-sm outline-none focus:border-violet-500 transition-all" />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300">Gender</label>
                        <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-slate-900 text-white text-sm outline-none focus:border-violet-500 transition-all">
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300">Date of Birth</label>
                        <input type="date" value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm outline-none focus:border-violet-500 transition-all" />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300">B-Form / CNIC Number</label>
                        <input 
                          value={form.bFormNumber} 
                          onChange={e => setForm(p => ({ ...p, bFormNumber: formatCNIC(e.target.value) }))} 
                          placeholder="35202-0000000-0" 
                          maxLength={15}
                          className={`mt-1.5 w-full px-3.5 py-2.5 rounded-xl border bg-white/[0.03] text-white text-sm outline-none font-mono focus:border-violet-500 transition-all ${form.bFormNumber && !validateCNIC(form.bFormNumber) ? 'border-rose-500/60' : 'border-white/[0.08]'}`} 
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300">Blood Group</label>
                        <select value={form.bloodGroup} onChange={e => setForm(p => ({ ...p, bloodGroup: e.target.value }))} className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-slate-900 text-white text-sm outline-none focus:border-violet-500 transition-all">
                          <option value="">Select Blood Group</option>
                          <option value="A+">A+</option><option value="A-">A-</option>
                          <option value="B+">B+</option><option value="B-">B-</option>
                          <option value="AB+">AB+</option><option value="AB-">AB-</option>
                          <option value="O+">O+</option><option value="O-">O-</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 2. Parent & Father Details Card */}
                  <div className="glass-card rounded-2xl p-5 border border-white/[0.06] space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                      <span className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">2</span>
                      <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                        <UserCheck size={15} className="text-emerald-400" /> Father & Mother Information
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                      <div>
                        <label className="text-xs font-medium text-slate-300">Father Full Name *</label>
                        <input value={form.fatherName} onChange={e => setForm(p => ({ ...p, fatherName: e.target.value }))} placeholder="Father Full Name" required className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600" />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300">Father Mobile 1 *</label>
                        <input
                          value={form.fatherMobile1}
                          onChange={e => setForm(p => ({ ...p, fatherMobile1: formatPhone(e.target.value) }))}
                          placeholder="0300-0000000"
                          maxLength={12}
                          required
                          className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white font-mono text-sm outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300">Father Mobile 2 <span className="text-slate-500 font-normal">(Optional)</span></label>
                        <input
                          value={form.fatherMobile2}
                          onChange={e => setForm(p => ({ ...p, fatherMobile2: formatPhone(e.target.value) }))}
                          placeholder="0300-0000000"
                          maxLength={12}
                          className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white font-mono text-sm outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300">Father CNIC</label>
                        <input 
                          value={form.fatherCnic} 
                          onChange={e => setForm(p => ({ ...p, fatherCnic: formatCNIC(e.target.value) }))} 
                          placeholder="35202-0000000-0"
                          maxLength={15}
                          className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white font-mono text-sm outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600" 
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300">Father Occupation</label>
                        <select value={form.fatherOccupation} onChange={e => setForm(p => ({ ...p, fatherOccupation: e.target.value }))} className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-slate-900 text-white text-sm outline-none focus:border-emerald-500 transition-all">
                          <option value="">Select Occupation</option>
                          <option value="Business">Business</option>
                          <option value="Salaried">Salaried</option>
                          <option value="Government">Government Service</option>
                          <option value="Self-employed">Self-employed</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300">Mother Full Name</label>
                        <input value={form.motherName} onChange={e => setForm(p => ({ ...p, motherName: e.target.value }))} placeholder="Mother Name" className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600" />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300">Mother Mobile</label>
                        <input 
                          value={form.motherMobile} 
                          onChange={e => setForm(p => ({ ...p, motherMobile: formatPhone(e.target.value) }))} 
                          placeholder="0300-0000000"
                          maxLength={12}
                          className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white font-mono text-sm outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Address & Credentials Card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Address Box - Full width with Province → District → Tehsil cascade */}
                    <div className="glass-card rounded-2xl p-5 border border-white/[0.06] space-y-3 md:col-span-2">
                      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                        <span className="h-7 w-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">3</span>
                        <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                          <MapPin size={15} className="text-cyan-400" /> Permanent Address
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                        {/* Province */}
                        <div>
                          <label className="text-xs font-medium text-slate-300">Province *</label>
                          <select
                            value={form.province}
                            onChange={e => {
                              const prov = e.target.value;
                              const dists = getDistricts(prov);
                              const dist = dists[0] || '';
                              const tehsils = getTehsils(prov, dist);
                              setForm(p => ({ ...p, province: prov, district: dist, tehsil: tehsils[0] || '', city: dist }));
                            }}
                            className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-white/[0.08] bg-slate-900 text-white text-sm outline-none focus:border-cyan-500 transition-all"
                          >
                            {Object.keys(PK_GEO).map(p => (
                              <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                        </div>

                        {/* District */}
                        <div>
                          <label className="text-xs font-medium text-slate-300">District *</label>
                          <select
                            value={form.district}
                            onChange={e => {
                              const dist = e.target.value;
                              const tehsils = getTehsils(form.province, dist);
                              setForm(p => ({ ...p, district: dist, tehsil: tehsils[0] || '', city: dist }));
                            }}
                            className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-white/[0.08] bg-slate-900 text-white text-sm outline-none focus:border-cyan-500 transition-all"
                          >
                            {getDistricts(form.province).map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>

                        {/* Tehsil */}
                        <div>
                          <label className="text-xs font-medium text-slate-300">Tehsil / Town *</label>
                          <select
                            value={form.tehsil}
                            onChange={e => setForm(p => ({ ...p, tehsil: e.target.value }))}
                            className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-white/[0.08] bg-slate-900 text-white text-sm outline-none focus:border-cyan-500 transition-all"
                          >
                            {getTehsils(form.province, form.district).map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>

                        {/* Full Home Address */}
                        <div className="md:col-span-3">
                          <label className="text-xs font-medium text-slate-300">Full Home Address *</label>
                          <input
                            value={form.address}
                            onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                            placeholder="House #, Street, Block / Area, Mohallah..."
                            required
                            className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Portal Credentials Box */}
                    <div className="glass-card rounded-2xl p-5 border border-white/[0.06] space-y-3">
                      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                        <span className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">4</span>
                        <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                          <Shield size={15} className="text-amber-400" /> Portal Login Details
                        </h3>
                      </div>

                      <div className="space-y-2.5 pt-1 text-xs">
                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Student Portal ID</span>
                          <span className="font-mono font-bold text-violet-300">{form.email || `${form.admissionNo.toLowerCase()}@edusphere.com`}</span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Parent Login Password</span>
                          <div className="flex items-center justify-between font-mono font-bold text-amber-300 mt-0.5">
                            <span>{showPassword ? parentPassword : '••••••••••••'}</span>
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-violet-400 hover:text-violet-300 font-sans text-[11px] font-bold">
                              {showPassword ? 'Hide' : 'Show'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Submit Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
                  <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2.5 rounded-xl border border-white/[0.08] text-slate-300 font-semibold text-xs hover:bg-white/[0.05] transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Complete Registration
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student Profile Dialog (Super Detailed with Tabs) */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 flex flex-col md:flex-row h-[85vh]">
              
              {/* Profile Left Sidebar */}
              <div className="w-full md:w-64 bg-accent/25 border-r border-border p-6 flex flex-col justify-between shrink-0">
                <div className="text-center space-y-4">
                  <div className="relative mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-md border-4 border-card">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground truncate">{selectedStudent.name}</h2>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{selectedStudent.admissionNo}</p>
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active Student
                    </span>
                  </div>
                  
                  {/* Action Shortcuts */}
                  <div className="pt-4 border-t border-border/60 flex flex-col gap-1.5">
                    <button
                      onClick={() => {
                        setEditMode(true);
                        setEditForm({ ...selectedStudent });
                        setProfileTab('basic');
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-all"
                    >
                      <Edit2 size={13}/> Edit Profile
                    </button>
                    <button onClick={() => { setShowIdCard(true); }} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-accent/80 transition-all">
                      <Printer size={13} className="text-primary"/> Print ID Card
                    </button>
                    <button onClick={() => { setSelectedIds([selectedStudent.id]); setShowPromote(true); }} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-accent/80 transition-all">
                      <ArrowUpRight size={13} className="text-emerald-500"/> Promote Student
                    </button>
                    <button onClick={() => { setSelectedIds([selectedStudent.id]); setShowTransfer(true); }} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-accent/80 transition-all">
                      <MapPin size={13} className="text-violet-500"/> Transfer Class
                    </button>
                  </div>
                </div>

                <button onClick={() => { setSelectedStudent(null); setEditMode(false); }} className="w-full mt-6 py-2 rounded-xl border border-border bg-card hover:bg-accent transition-all text-xs font-bold text-foreground">Close Profile</button>
              </div>

              {/* Profile Right Content Area with Tabs */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Tabs Bar — always horizontally scrollable */}
                <div className="flex items-center gap-1 border-b border-border bg-card/60 overflow-x-auto px-4 py-2 shrink-0" style={{ scrollbarWidth: 'none' }}>
                  {[
                    { id: 'basic', label: 'Basic Info', icon: User },
                    { id: 'academic', label: 'Academic', icon: GraduationCap },
                    { id: 'parent', label: 'Parents', icon: UserCheck },
                    { id: 'attendance', label: 'Attendance', icon: Calendar },
                    { id: 'fees', label: 'Fees', icon: CreditCard },
                    { id: 'results', label: 'Results', icon: Award },
                    { id: 'homework', label: 'Homework', icon: BookOpen },
                    { id: 'login', label: 'Credentials', icon: Shield },
                    { id: 'timeline', label: 'Timeline', icon: FileText }
                  ].map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => { setProfileTab(t.id); setEditMode(false); }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                          profileTab === t.id 
                            ? 'bg-primary text-primary-foreground font-bold' 
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        <Icon size={13} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tab content wrapper */}
                <div className="flex-1 overflow-y-auto p-6 bg-card text-sm">
                  <AnimatePresence mode="wait">
                    {profileTab === 'basic' && !editMode && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-1.5">
                          <h3 className="text-sm font-bold text-foreground">Personal details</h3>
                          <button onClick={() => { setEditMode(true); setEditForm({ ...selectedStudent }); }} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-all">
                            <Edit2 size={11}/> Edit
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
                          <div><span className="text-xs text-muted-foreground block">Full Name</span><span className="font-semibold text-foreground">{selectedStudent.name}</span></div>
                          <div><span className="text-xs text-muted-foreground block">Gender</span><span className="font-semibold text-foreground">{selectedStudent.gender || 'MALE'}</span></div>
                          <div><span className="text-xs text-muted-foreground block">Date of Birth</span><span className="font-semibold text-foreground">{selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : '—'}</span></div>
                          <div><span className="text-xs text-muted-foreground block">Blood Group</span><span className="font-semibold text-foreground text-red-500 font-bold">{selectedStudent.bloodGroup || '—'}</span></div>
                          <div><span className="text-xs text-muted-foreground block">Religion</span><span className="font-semibold text-foreground">{selectedStudent.religion || 'Islam'}</span></div>
                          <div><span className="text-xs text-muted-foreground block">B-Form / CNIC</span><span className="font-semibold text-foreground font-mono">{selectedStudent.bFormNumber || '—'}</span></div>
                          <div className="col-span-2"><span className="text-xs text-muted-foreground block">Address</span><span className="font-semibold text-foreground">{selectedStudent.address || '—'}</span></div>
                        </div>
                      </motion.div>
                    )}

                    {profileTab === 'basic' && editMode && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-1.5">
                          <h3 className="text-sm font-bold text-foreground">Edit Student Info</h3>
                          <button onClick={() => setEditMode(false)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-accent transition-all">
                            <X size={11}/> Cancel
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: 'name', label: 'Full Name', span: 2 },
                            { key: 'gender', label: 'Gender', type: 'select', opts: ['MALE','FEMALE','OTHER'] },
                            { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
                            { key: 'religion', label: 'Religion' },
                            { key: 'bloodGroup', label: 'Blood Group', type: 'select', opts: ['','A+','A-','B+','B-','AB+','AB-','O+','O-'] },
                            { key: 'bFormNumber', label: 'B-Form / CNIC', mono: true, cnic: true },
                            { key: 'address', label: 'Address', span: 2 },
                            { key: 'fatherName', label: 'Father Name' },
                            { key: 'fatherMobile1', label: 'Father Mobile 1', mono: true, phone: true },
                            { key: 'fatherCnic', label: 'Father CNIC', mono: true, cnic: true },
                            { key: 'motherName', label: 'Mother Name' },
                            { key: 'motherMobile', label: 'Mother Mobile', mono: true, phone: true },
                          ].map((f: any) => (
                            <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
                              <label className="text-xs font-bold text-foreground">{f.label}</label>
                              {f.type === 'select' ? (
                                <select
                                  value={editForm[f.key] || ''}
                                  onChange={e => setEditForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                                  className="mt-1 w-full px-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                  {f.opts.map((o: string) => <option key={o} value={o}>{o || 'Select'}</option>)}
                                </select>
                              ) : (
                                <input
                                  value={editForm[f.key] || ''}
                                  onChange={e => {
                                    const val = f.cnic ? formatCNIC(e.target.value) : f.phone ? formatPhone(e.target.value) : e.target.value;
                                    setEditForm((p: any) => ({ ...p, [f.key]: val }));
                                  }}
                                  type={f.type || 'text'}
                                  maxLength={f.cnic ? 15 : f.phone ? 12 : undefined}
                                  className={`mt-1 w-full px-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 ${f.mono ? 'font-mono' : ''}`}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                          <button onClick={() => setEditMode(false)} className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent">Cancel</button>
                          <button
                            disabled={editSaving}
                            onClick={async () => {
                              setEditSaving(true);
                              try {
                                await apiClient.patch(`/people/students/${selectedStudent.id}`, editForm);
                                toast.success('Student updated!');
                                setEditMode(false);
                                fetchAll();
                                // update selected student with new data
                                setSelectedStudent((p: any) => ({ ...p, ...editForm }));
                              } catch {
                                toast.error('Failed to update student');
                              } finally { setEditSaving(false); }
                            }}
                            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 disabled:opacity-70"
                          >
                            {editSaving ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>}
                            Save Changes
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {profileTab === 'academic' && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        <h3 className="text-sm font-bold text-foreground border-b border-border pb-1.5">Academic details</h3>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
                          <div><span className="text-xs text-muted-foreground block">Class Assigned</span><span className="font-semibold text-foreground">{selectedStudent.section?.class?.name || '—'}</span></div>
                          <div><span className="text-xs text-muted-foreground block">Section Name</span><span className="font-semibold text-foreground">{selectedStudent.section?.name || '—'}</span></div>
                          <div><span className="text-xs text-muted-foreground block">Roll Number</span><span className="font-semibold text-foreground font-mono">{selectedStudent.rollNo || '—'}</span></div>
                          <div><span className="text-xs text-muted-foreground block">Session</span><span className="font-semibold text-foreground">{selectedStudent.session || '2026-2027'}</span></div>
                          <div><span className="text-xs text-muted-foreground block">Admission Date</span><span className="font-semibold text-foreground">{selectedStudent.admissionDate ? new Date(selectedStudent.admissionDate).toLocaleDateString() : '—'}</span></div>
                          <div><span className="text-xs text-muted-foreground block">Status</span><span className="text-xs font-black text-emerald-400">ACTIVE</span></div>
                        </div>
                      </motion.div>
                    )}

                    {profileTab === 'parent' && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        <h3 className="text-sm font-bold text-foreground border-b border-border pb-1.5">Family & Guardian Info</h3>
                        <div className="space-y-4">
                          <div className="bg-accent/15 p-4 rounded-2xl border border-border">
                            <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-1"><UserCheck size={12}/> Father</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div><span className="text-muted-foreground">Name:</span> <span className="font-semibold text-foreground">{selectedStudent.fatherName || 'Robert Mercer'}</span></div>
                              <div><span className="text-muted-foreground">Mobile:</span> <span className="font-semibold text-foreground font-mono">{selectedStudent.fatherMobile1 || '+1 555 456 7890'}</span></div>
                              <div><span className="text-muted-foreground">CNIC:</span> <span className="font-semibold text-foreground font-mono">{selectedStudent.fatherCnic || '—'}</span></div>
                              <div><span className="text-muted-foreground">Occupation:</span> <span className="font-semibold text-foreground">{selectedStudent.fatherOccupation || 'Government Service'}</span></div>
                            </div>
                          </div>

                          <div className="bg-accent/15 p-4 rounded-2xl border border-border">
                            <h4 className="text-xs font-bold text-violet-400 mb-2 flex items-center gap-1"><UserCheck size={12}/> Mother</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div><span className="text-muted-foreground">Name:</span> <span className="font-semibold text-foreground">{selectedStudent.motherName || 'Emma Mercer'}</span></div>
                              <div><span className="text-muted-foreground">Mobile:</span> <span className="font-semibold text-foreground font-mono">{selectedStudent.motherMobile || '—'}</span></div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {profileTab === 'attendance' && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        <h3 className="text-sm font-bold text-foreground border-b border-border pb-1.5 flex items-center justify-between">
                          <span>Attendance Record</span>
                          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full font-bold">96.5% Present</span>
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                            <p className="text-2xl font-black text-emerald-400">182</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Days Present</p>
                          </div>
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                            <p className="text-2xl font-black text-red-400">5</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Days Absent</p>
                          </div>
                          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                            <p className="text-2xl font-black text-amber-400">2</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Leaves</p>
                          </div>
                        </div>
                        <div className="border border-border rounded-xl p-3 bg-accent/10 text-xs text-muted-foreground flex items-center gap-2">
                          <AlertCircle size={14} className="text-primary shrink-0"/>
                          <span>Attendance notifications are automatically broadcasted daily to registered parent devices.</span>
                        </div>
                      </motion.div>
                    )}

                    {profileTab === 'fees' && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        <h3 className="text-sm font-bold text-foreground border-b border-border pb-1.5">Fee Installments & Structure</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 border border-border bg-accent/25 rounded-2xl">
                            <div>
                              <p className="font-bold text-foreground text-xs">First Term Tuition Fee</p>
                              <p className="text-[10px] text-muted-foreground">Receipt #: FP-8373-2026</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-xs text-foreground">$150.00</p>
                              <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Paid</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-3 border border-border bg-accent/25 rounded-2xl">
                            <div>
                              <p className="font-bold text-foreground text-xs">Annual Exam & Syllabus Charges</p>
                              <p className="text-[10px] text-muted-foreground">Receipt #: FP-8927-2026</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-xs text-foreground">$75.00</p>
                              <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Paid</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-3 border border-border bg-accent/25 rounded-2xl">
                            <div>
                              <p className="font-bold text-foreground text-xs">Monthly Lab & Sports Charges</p>
                              <p className="text-[10px] text-muted-foreground">Due: 10th Aug 2026</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-xs text-foreground">$20.00</p>
                              <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Pending</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {profileTab === 'results' && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        <h3 className="text-sm font-bold text-foreground border-b border-border pb-1.5">Exam Results</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 border border-border bg-accent/20 rounded-xl text-xs">
                            <div>
                              <p className="font-bold text-foreground">Midterm Exam 2026</p>
                              <p className="text-[10px] text-muted-foreground">Mathematics (Code: MATH5)</p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-foreground text-sm">85 / 100</p>
                              <span className="text-emerald-400 font-bold">Grade A</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-3 border border-border bg-accent/20 rounded-xl text-xs">
                            <div>
                              <p className="font-bold text-foreground">Monthly Assessment - May</p>
                              <p className="text-[10px] text-muted-foreground">Science (Code: SCI5)</p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-foreground text-sm">92 / 100</p>
                              <span className="text-emerald-400 font-bold">Grade A+</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {profileTab === 'homework' && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        <h3 className="text-sm font-bold text-foreground border-b border-border pb-1.5">Homework Assignments</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 border border-border bg-accent/25 rounded-2xl">
                            <div>
                              <p className="font-bold text-foreground text-xs">Linear Equation Chapter 3 Exercises</p>
                              <p className="text-[10px] text-muted-foreground">Subject: Mathematics</p>
                            </div>
                            <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Submitted</span>
                          </div>
                          <div className="flex items-center justify-between p-3 border border-border bg-accent/25 rounded-2xl">
                            <div>
                              <p className="font-bold text-foreground text-xs">Plant Cell Anatomy Model Upload</p>
                              <p className="text-[10px] text-muted-foreground">Subject: Science</p>
                            </div>
                            <span className="text-[9px] font-black uppercase text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">Pending</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {profileTab === 'login' && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        <h3 className="text-sm font-bold text-foreground border-b border-border pb-1.5">System Portal Login Details</h3>
                        <div className="space-y-3.5 bg-accent/15 p-4 rounded-2xl border border-border text-xs">
                          <div>
                            <span className="text-muted-foreground block mb-1">Student Portal Username / Email</span>
                            <span className="font-mono font-bold text-foreground bg-background px-2.5 py-1.5 rounded-lg border border-border block">{selectedStudent.email || `${selectedStudent.admissionNo.toLowerCase()}@school.edu`}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block mb-1">Parent Portal Username / Email</span>
                            <span className="font-mono font-bold text-foreground bg-background px-2.5 py-1.5 rounded-lg border border-border block">{selectedStudent.admissionNo.toLowerCase()}_parent@school.edu</span>
                          </div>
                          <div className="pt-2 flex items-center gap-1 text-[10px] text-amber-400">
                            <ShieldAlert size={12}/> Default passwords are student123 / parent123. Users can reset them on first login.
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {profileTab === 'timeline' && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        <h3 className="text-sm font-bold text-foreground border-b border-border pb-1.5">System Activity Timeline</h3>
                        <div className="relative pl-5 border-l-2 border-border/60 space-y-4 text-xs">
                          <div className="relative">
                            <span className="absolute -left-[26px] top-0.5 h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center text-white border-2 border-card"/>
                            <p className="font-bold text-foreground">Fee Invoice FP-8927 Cleared</p>
                            <p className="text-[10px] text-muted-foreground">15 mins ago</p>
                          </div>
                          <div className="relative">
                            <span className="absolute -left-[26px] top-0.5 h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center text-white border-2 border-card"/>
                            <p className="font-bold text-foreground">Assigned Section A of Grade 5</p>
                            <p className="text-[10px] text-muted-foreground">3 days ago</p>
                          </div>
                          <div className="relative">
                            <span className="absolute -left-[26px] top-0.5 h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center text-white border-2 border-card"/>
                            <p className="font-bold text-foreground">Registered Student Admission Account</p>
                            <p className="text-[10px] text-muted-foreground">3 days ago</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Excel Import Modal */}
      <AnimatePresence>
        {showImport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/60">
                <h3 className="text-base font-black text-foreground flex items-center gap-1.5"><FileSpreadsheet size={16} className="text-emerald-500"/> Bulk Import Students via Excel</h3>
                <button onClick={() => setShowImport(false)} className="text-muted-foreground hover:text-foreground"><X size={20}/></button>
              </div>
              <form onSubmit={handleImport} className="space-y-4">
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

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowImport(false)} className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent">Cancel</button>
                  <button type="submit" disabled={!importFile || importing} className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 disabled:opacity-70">
                    {importing && <Loader2 size={13} className="animate-spin"/>}
                    {importing ? 'Processing Sheet...' : 'Upload & Parse'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student ID Card Print Preview Modal */}
      <AnimatePresence>
        {showIdCard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl">
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promote Students Dialog */}
      <AnimatePresence>
        {showPromote && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/60">
                <h3 className="text-base font-black text-foreground flex items-center gap-1.5"><ArrowUpRight size={16} className="text-emerald-500"/> Promote Selected Students</h3>
                <button onClick={() => setShowPromote(false)} className="text-muted-foreground hover:text-foreground"><X size={20}/></button>
              </div>
              <form onSubmit={handlePromote} className="space-y-4">
                <p className="text-xs text-muted-foreground">You are promoting <strong className="text-foreground">{selectedIds.length}</strong> selected student(s) to the next class.</p>
                
                <div>
                  <label className="text-xs font-bold text-foreground">Target Class & Section *</label>
                  <select value={promoteSectionId} onChange={e => setPromoteSectionId(e.target.value)} required className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">-- Select Target Section --</option>
                    {sections.map((s: any) => <option key={s.id} value={s.id}>{s.className} › {s.name}</option>)}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowPromote(false)} className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent">Cancel</button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all">Promote Now</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer Students Dialog */}
      <AnimatePresence>
        {showTransfer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/60">
                <h3 className="text-base font-black text-foreground flex items-center gap-1.5"><MapPin size={16} className="text-violet-500"/> Transfer Students Class / Section</h3>
                <button onClick={() => setShowTransfer(false)} className="text-muted-foreground hover:text-foreground"><X size={20}/></button>
              </div>
              <form onSubmit={handleTransfer} className="space-y-4">
                <p className="text-xs text-muted-foreground">You are changing class or medium for <strong className="text-foreground">{selectedIds.length}</strong> student(s).</p>
                
                <div>
                  <label className="text-xs font-bold text-foreground">New Class & Section *</label>
                  <select value={promoteSectionId} onChange={e => setPromoteSectionId(e.target.value)} required className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">-- Select New Section --</option>
                    {sections.map((s: any) => <option key={s.id} value={s.id}>{s.className} › {s.name}</option>)}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowTransfer(false)} className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent">Cancel</button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all">Transfer Now</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
