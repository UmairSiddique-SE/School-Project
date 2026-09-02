import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  ArrowLeft, Building2, Check, ChevronDown, ChevronRight, Eye, EyeOff,
  Globe2, ImagePlus, Loader2, LockKeyhole, Mail, MapPin, Phone, School,
  ShieldCheck, UserRound, Sparkles,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import apiClient from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';

/* ── Pakistan Location Hierarchy ── */
const PAKISTAN_LOCATIONS: Record<string, Record<string, string[]>> = {
  Punjab: {
    Lahore: ['Lahore City', 'Cantonment', 'Model Town', 'Gulberg', 'DHA', 'Raiwind', 'Shalimar'],
    Faisalabad: ['Faisalabad City', 'Jaranwala', 'Samundri', 'Tandlianwala', 'Chak Jhumra'],
    Rawalpindi: ['Rawalpindi City', 'Murree', 'Kahuta', 'Taxila', 'Gujar Khan'],
    Gujranwala: ['Gujranwala City', 'Wazirabad', 'Kamoke', 'Nowshera Virkan'],
    Multan: ['Multan City', 'Shujabad', 'Lodhran', 'Jalapur Pirwala'],
    Bahawalpur: ['Bahawalpur City', 'Ahmadpur East', 'Hasilpur', 'Yazman'],
    Sialkot: ['Sialkot City', 'Daska', 'Sambrial', 'Pasrur'],
    Sargodha: ['Sargodha City', 'Bhalwal', 'Kot Momin', 'Sahiwal (Sargodha)'],
    Sahiwal: ['Sahiwal City', 'Okara', 'Pakpattan', 'Chichawatni'],
    Sheikhupura: ['Sheikhupura City', 'Muridke', 'Ferozewala', 'Nankana Sahib'],
    Kasur: ['Kasur City', 'Chunian', 'Pattoki', 'Kot Radha Kishan'],
    Dera_Ghazi_Khan: ['D.G. Khan City', 'Taunsa Sharif', 'Rajanpur', 'Kot Chutta'],
    Mianwali: ['Mianwali City', 'Piplan', 'Wan Bachran'],
    Khushab: ['Joharabad', 'Noorpur', 'Hadali', 'Quaidabad'],
    Muzaffargarh: ['Muzaffargarh City', 'Kot Addu', 'Alipur', 'Jatoi'],
    Attock: ['Attock City', 'Hazro', 'Fateh Jang', 'Pindigheb'],
    Chakwal: ['Chakwal City', 'Talagang', 'Choa Saidan Shah'],
    Jhelum: ['Jhelum City', 'Pind Dadan Khan', 'Sohawa'],
    Hafizabad: ['Hafizabad City', 'Pindi Bhattian', 'Kolo Tarar'],
    Narowal: ['Narowal City', 'Shakargarh', 'Zafarwal'],
    Gujrat: ['Gujrat City', 'Kharian', 'Sarai Alamgir'],
    Mandi_Bahauddin: ['Mandi Bahauddin City', 'Phalia', 'Malakwal'],
    Chiniot: ['Chiniot City', 'Bhawana', 'Lalian'],
    Toba_Tek_Singh: ['Toba Tek Singh City', 'Gojra', 'Kamalia', 'Rajana'],
    Vehari: ['Vehari City', 'Burewala', 'Mailsi'],
    Bhakkar: ['Bhakkar City', 'Mankera', 'Darya Khan'],
    Layyah: ['Layyah City', 'Chaubara', 'Karor Lal Esan'],
    Lodhran: ['Lodhran City', 'Kehror Pakka', 'Dunyapur'],
    Nankana_Sahib: ['Nankana Sahib City', 'Shahkot', 'Sangla Hill'],
    Pakpattan: ['Pakpattan City', 'Arifwala', 'Depalpur'],
    Okara: ['Okara City', 'Renala Khurd', 'Depalpur'],
    Rajanpur: ['Rajanpur City', 'Rojhan', 'Jampur'],
  },
  Sindh: {
    Karachi: ['Karachi Central', 'Karachi East', 'Karachi West', 'Karachi South', 'Malir', 'Korangi', 'Keamari', 'Bin Qasim'],
    Hyderabad: ['Hyderabad City', 'Latifabad', 'Qasimabad', 'Kotri'],
    Sukkur: ['Sukkur City', 'Rohri', 'Salehpat', 'Pano Aqil'],
    Larkana: ['Larkana City', 'Ratodero', 'Dokri', 'Bakrani'],
    Jacobabad: ['Jacobabad City', 'Thull', 'Garhi Khairo'],
    Shikarpur: ['Shikarpur City', 'Khanpur (Sindh)', 'Lakhi'],
    Khairpur: ['Khairpur City', 'Kot Diji', 'Gambat', 'Faiz Ganj'],
    Nawabshah: ['Nawabshah City', 'Sakrand', 'Daur', 'Qazi Ahmed'],
    Mirpur_Khas: ['Mirpur Khas City', 'Digri', 'Umerkot', 'Kot Ghulam Muhammad'],
    Sanghar: ['Sanghar City', 'Shahdadpur', 'Sinjhoro', 'Jam Nawaz Ali'],
    Dadu: ['Dadu City', 'Mehar', 'Khairpur Nathan Shah', 'Johi'],
    Matiari: ['Hala', 'Matiari City', 'Saeedabad'],
    Tando_Allah_Yar: ['Tando Allah Yar City', 'Chamber', 'Tando Ghulam Ali'],
    Tando_Muhammad_Khan: ['Tando Muhammad Khan City', 'Bulri Shah Karim'],
    Badin: ['Badin City', 'Talhar', 'Tando Bago', 'Matli'],
    Thatta: ['Thatta City', 'Mirpur Sakro', 'Ghorabari', 'Sujawal'],
    Ghotki: ['Ghotki City', 'Ubauro', 'Daharki', 'Mirpur Mathelo'],
    Kashmore: ['Kandhkot', 'Kashmore City', 'Tangwani'],
    Naushahro_Feroze: ['Naushahro Feroze City', 'Moro', 'Kandiaro'],
    Kambar_Shahdadkot: ['Kambar City', 'Shahdadkot', 'Qubo Saeed Khan'],
    Jamshoro: ['Sehwan Sharif', 'Manjhand', 'Kotri (Jamshoro)'],
    Umerkot: ['Umerkot City', 'Kunri', 'Pithoro', 'Samaro'],
    Sujawal: ['Sujawal City', 'Jati', 'Shah Bandar'],
  },
  'Khyber Pakhtunkhwa': {
    Peshawar: ['Peshawar City', 'Hayatabad', 'Bara', 'Chamkani'],
    Mardan: ['Mardan City', 'Takht Bhai', 'Katlang'],
    Swat: ['Mingora', 'Saidu Sharif', 'Kabal', 'Matta', 'Bahrain'],
    Abbottabad: ['Abbottabad City', 'Havelian', 'Mansehra Road', 'Lora'],
    Mansehra: ['Mansehra City', 'Oghi', 'Balakot', 'Shinkiari'],
    Nowshera: ['Nowshera City', 'Pabbi', 'Jehangira'],
    Charsadda: ['Charsadda City', 'Shabqadar', 'Tangi'],
    Kohat: ['Kohat City', 'Lachi', 'Gumbat'],
    Bannu: ['Bannu City', 'Domel', 'Miryan'],
    Dera_Ismail_Khan: ['D.I. Khan City', 'Kulachi', 'Paroa'],
    Haripur: ['Haripur City', 'Ghazi', 'Khanpur (KPK)'],
    Malakand: ['Malakand City', 'Batkhela', 'Thana'],
    Swabi: ['Swabi City', 'Topi', 'Lahor (KPK)', 'Gadoon'],
    Lakki_Marwat: ['Lakki City', 'Serai Naurang'],
    Tank: ['Tank City', 'Kulachi (Tank)'],
    Buner: ['Daggar', 'Sowari', 'Sultanpur'],
    Dir_Upper: ['Timergara', 'Wari', 'Sheringal'],
    Dir_Lower: ['Timergara (Lower)', 'Adenzai', 'Balambat'],
    Shangla: ['Alpuri', 'Bisham', 'Chakesar'],
    Kohistan_Upper: ['Dassu', 'Pattan', 'Kandia'],
    Battagram: ['Battagram City', 'Allai', 'Oghi (Battagram)'],
    Tor_Ghar: ['Behrain', 'Darora'],
    Chitral: ['Chitral City', 'Drosh', 'Ayun'],
    Kurram: ['Parachinar', 'Sadda', 'Alizai'],
    North_Waziristan: ['Miranshah', 'Mir Ali', 'Razmak'],
    South_Waziristan: ['Wana', 'Sararogha'],
    Bajaur: ['Khar', 'Nawagai', 'Salarzai'],
    Mohmand: ['Ghalanai', 'Ekka Ghund'],
    Khyber: ['Landi Kotal', 'Jamrud', 'Ali Masjid'],
    Orakzai: ['Kalaya', 'Hangu Road'],
  },
  Balochistan: {
    Quetta: ['Quetta City', 'Sariab', 'Samungli', 'Brewery Road'],
    Gwadar: ['Gwadar City', 'Ormara', 'Jiwani', 'Pasni'],
    Turbat: ['Turbat City', 'Mand', 'Hoshab'],
    Khuzdar: ['Khuzdar City', 'Wadh', 'Naal'],
    Kalat: ['Kalat City', 'Surab', 'Mangochar'],
    Chaman: ['Chaman City', 'Khanozai', 'Gulistan'],
    Loralai: ['Loralai City', 'Barkhan', 'Duki'],
    Zhob: ['Zhob City', 'Muslim Bagh', 'Sherani'],
    Sibi: ['Sibi City', 'Dera Bugti', 'Baap'],
    Nasirabad: ['Dera Murad Jamali', 'Tamboo', 'Loti'],
    Jaffarabad: ['Usta Muhammad', 'Sohbatpur', 'Gandakha'],
    Lasbela: ['Hub', 'Bela', 'Uthal'],
    Panjgur: ['Panjgur City', 'Gichk', 'Paroom'],
    Awaran: ['Awaran City', 'Jhal Jhao', 'Mashkel'],
    Kech: ['Turbat (Kech)', 'Tump', 'Buleda'],
    Nushki: ['Nushki City', 'Dhadar'],
    Chaghi: ['Dalbandin', 'Taftan'],
    Washuk: ['Kharan', 'Nag'],
    Harnai: ['Harnai City', 'Shahrag'],
    Bolan: ['Mach', 'Bhag', 'Dadhar'],
    Mastung: ['Mastung City', 'Dasht'],
    Ziarat: ['Ziarat City', 'Kawas'],
    Musakhel: ['Kingri', 'Thal (Balochistan)'],
    Sherani: ['Sherani City', 'Drazinda'],
    Lehri: ['Lehri City', 'Sibi Junction'],
    Kohlu: ['Kohlu City', 'Tamboo (Kohlu)'],
    Barkhan: ['Barkhan City', 'Rakhni'],
  },
  'Azad Kashmir': {
    Muzaffarabad: ['Muzaffarabad City', 'Chattar Katas', 'Nauseri'],
    Mirpur: ['Mirpur City', 'Chakswari', 'Dadyal', 'Alibeg'],
    Rawalakot: ['Rawalakot City', 'Banjosa', 'Hajira'],
    Bhimber: ['Bhimber City', 'Samahni', 'Barnala'],
    Kotli: ['Kotli City', 'Sehnsa', 'Fatehpur'],
    Bagh: ['Bagh City', 'Dhirkot', 'Sudhanoti'],
    Haveli: ['Forward Kahuta', 'Kahuta (AJK)'],
    Neelum: ['Athmuqam', 'Sharda', 'Kel'],
    Hattian: ['Hattian Bala', 'Domel (AJK)'],
    Jhelum_Valley: ['Chakothi', 'Karot', 'Doonian'],
  },
  Gilgit_Baltistan: {
    Gilgit: ['Gilgit City', 'Jutial', 'Sakwar'],
    Skardu: ['Skardu City', 'Shigar', 'Khaplu'],
    Hunza: ['Karimabad', 'Aliabad', 'Gulmit'],
    Nagar: ['Nagar City', 'Hispar', 'Hopar'],
    Diamer: ['Chilas', 'Darel', 'Tangir'],
    Ghanche: ['Khaplu (Ghanche)', 'Daghoni'],
    Ghizer: ['Gahkuch', 'Phander', 'Yasin'],
    Astore: ['Astore City', 'Rama', 'Minimarg'],
  },
  'Islamabad Capital Territory': {
    Islamabad: ['F-Sector', 'G-Sector', 'I-Sector', 'E-Sector', 'Bhara Kahu', 'Tarnol', 'Saidpur', 'Golra Sharif', 'Fateh Jhang'],
  },
};

const PROVINCES = Object.keys(PAKISTAN_LOCATIONS);

type FormState = {
  schoolName: string;
  schoolSlug: string;
  logoUrl: string;
  province: string;
  district: string;
  tehsil: string;
  address: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminPassword: string;
};

const initial: FormState = {
  schoolName: '',
  schoolSlug: '',
  logoUrl: '',
  province: '',
  district: '',
  tehsil: '',
  address: '',
  adminName: '',
  adminEmail: '',
  adminPhone: '',
  adminPassword: '',
};

export default function RegisterSchool() {
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const districts = form.province ? Object.keys(PAKISTAN_LOCATIONS[form.province] || {}) : [];
  const tehsils = form.province && form.district ? PAKISTAN_LOCATIONS[form.province]?.[form.district] || [] : [];

  const subdomain = useMemo(
    () => (form.schoolSlug ? `${form.schoolSlug}.edusphere.com` : 'your-school.edusphere.com'),
    [form.schoolSlug]
  );

  const strength =
    form.adminPassword.length >= 12
      ? 'Strong password'
      : form.adminPassword
      ? `${12 - form.adminPassword.length} more characters needed`
      : 'Use at least 12 characters';

  const set = (key: keyof FormState, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const onLogo = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      toast.error('Use a PNG, JPG, or WEBP image below 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set('logoUrl', String(reader.result));
    reader.readAsDataURL(file);
  };

  const onSchoolName = (value: string) => {
    const autoSlug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setForm((p) => ({
      ...p,
      schoolName: value,
      schoolSlug: p.schoolSlug || autoSlug,
    }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.logoUrl) {
      toast.error('Please upload your school logo.');
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.schoolSlug)) {
      toast.error('Use lowercase letters, numbers and hyphens for your school URL.');
      return;
    }
    if (!form.province || !form.district || !form.tehsil) {
      toast.error('Please select Province, District and Tehsil.');
      return;
    }

    setSaving(true);
    try {
      const fullAddress = [form.address, `Tehsil ${form.tehsil}`, `District ${form.district}`, form.province]
        .filter(Boolean)
        .join(', ');

      const payload = {
        schoolName: form.schoolName,
        schoolSlug: form.schoolSlug,
        schoolType: 'SCHOOL',
        logoUrl: form.logoUrl,
        country: 'Pakistan',
        city: form.district || form.province,
        schoolAddress: fullAddress,
        schoolPhone: form.adminPhone,
        adminName: form.adminName,
        adminEmail: form.adminEmail,
        adminPhone: form.adminPhone,
        adminPassword: form.adminPassword,
      };

      const { data } = await apiClient.post('/auth/register-school', payload);
      login(data.accessToken, data.user);
      toast.success('Your institution is ready. Welcome to EduSphere!');
      navigate(`/${data.user.schoolSlug}/dashboard`, { replace: true });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Registration could not be completed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070b1a] text-white">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="absolute bottom-0 -right-20 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-7 md:py-11">
        <header className="flex items-center justify-between mb-8">
          <Link
            to="/landing"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Back to website
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
            <ShieldCheck size={16} /> Secure onboarding
          </div>
        </header>

        <div className="grid lg:grid-cols-[.75fr_1.25fr] gap-7 items-start">
          {/* Left Sidebar Info */}
          <aside className="rounded-3xl border border-white/10 bg-[#0c1227]/80 p-7 lg:sticky lg:top-8 shadow-2xl backdrop-blur-md">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 grid place-items-center shadow-lg shadow-violet-600/25">
              <School size={24} />
            </div>
            <p className="mt-6 text-violet-300 text-xs font-bold tracking-[.15em]">EDUSPHERE ERP</p>
            <h1 className="mt-2 text-3xl font-black leading-tight">Build your school workspace.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Everything you need to start running your institution in one secure place.
            </p>

            <ol className="mt-8 space-y-5">
              {[
                ['1', 'School Information', 'School name, logo & web URL'],
                ['2', 'School Location', 'Province, district & tehsil selection'],
                ['3', 'Admin Account & Login', 'Admin name, Gmail ID & secure password'],
              ].map(([number, title, copy], i) => (
                <li key={title} className="flex gap-3">
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      i === 0 ? 'bg-violet-500 text-white' : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    {number}
                  </span>
                  <span>
                    <strong className="block text-sm">{title}</strong>
                    <small className="text-slate-500">{copy}</small>
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-8 rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4 text-xs leading-5 text-emerald-100/80">
              <Check size={15} className="inline mr-2 text-emerald-400" />
              Private & secure workspace configured specifically for your school.
            </div>
          </aside>

          {/* Registration Form */}
          <form onSubmit={submit} className="space-y-6">
            {/* ── 1. School Information ── */}
            <section className="register-card rounded-3xl border border-white/10 bg-[#0c1227]/90 p-6 sm:p-7 shadow-xl">
              <SectionHead
                icon={Building2}
                title="1. School Information"
                text="Tell us how your institution should appear."
              />

              <div className="grid md:grid-cols-[170px_1fr] gap-5 mt-6">
                {/* Logo Upload */}
                <label className="group min-h-40 rounded-2xl border-2 border-dashed border-white/15 bg-white/[.025] hover:border-violet-400 cursor-pointer flex flex-col items-center justify-center overflow-hidden transition-all">
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="School logo preview" className="w-full h-36 object-contain p-3" />
                  ) : (
                    <>
                      <ImagePlus size={25} className="text-violet-400 group-hover:scale-110 transition-transform" />
                      <b className="text-sm mt-2">Upload logo *</b>
                      <span className="text-[11px] text-slate-500 mt-1">PNG, JPG or WEBP · 2 MB max</span>
                    </>
                  )}
                  <input required className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={onLogo} />
                </label>

                {/* School Name & URL */}
                <div className="space-y-4">
                  <div>
                    <Label>School Name *</Label>
                    <input
                      required
                      value={form.schoolName}
                      onChange={(e) => onSchoolName(e.target.value)}
                      placeholder="e.g. Beacon House Grammar School"
                      className="register-input mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>School URL (Subdomain) *</Label>
                    <div className="flex mt-1.5">
                      <span className="grid place-items-center rounded-l-xl border border-r-0 border-white/10 bg-white/[.05] px-3">
                        <Building2 size={16} className="text-slate-400" />
                      </span>
                      <input
                        required
                        value={form.schoolSlug}
                        onChange={(e) => set('schoolSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="beacon-house"
                        className="register-input rounded-l-none"
                      />
                    </div>
                    <p className="mt-2 text-xs text-emerald-300">
                      <Globe2 size={13} className="inline mr-1" />
                      Your address: <b>{subdomain}</b>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── 2. School Location ── */}
            <section className="register-card rounded-3xl border border-white/10 bg-[#0c1227]/90 p-6 sm:p-7 shadow-xl">
              <SectionHead
                icon={MapPin}
                title="2. School Location"
                text="Select province, district and tehsil of your institution."
              />

              <div className="grid sm:grid-cols-3 gap-4 mt-6">
                {/* Province */}
                <div>
                  <Label>Select Province *</Label>
                  <div className="relative mt-1.5">
                    <select
                      required
                      value={form.province}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, province: e.target.value, district: '', tehsil: '' }))
                      }
                      className="register-input appearance-none pr-8 cursor-pointer"
                    >
                      <option value="" className="bg-slate-900">Select Province</option>
                      {PROVINCES.map((prov) => (
                        <option key={prov} value={prov} className="bg-slate-900">
                          {prov}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* District */}
                <div>
                  <Label>Select District *</Label>
                  <div className="relative mt-1.5">
                    <select
                      required
                      value={form.district}
                      disabled={!form.province}
                      onChange={(e) => setForm((p) => ({ ...p, district: e.target.value, tehsil: '' }))}
                      className="register-input appearance-none pr-8 cursor-pointer disabled:opacity-40"
                    >
                      <option value="" className="bg-slate-900">
                        {form.province ? 'Select District' : 'Select province first'}
                      </option>
                      {districts.map((dist) => (
                        <option key={dist} value={dist} className="bg-slate-900">
                          {dist.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Tehsil */}
                <div>
                  <Label>Select Tehsil *</Label>
                  <div className="relative mt-1.5">
                    <select
                      required
                      value={form.tehsil}
                      disabled={!form.district}
                      onChange={(e) => set('tehsil', e.target.value)}
                      className="register-input appearance-none pr-8 cursor-pointer disabled:opacity-40"
                    >
                      <option value="" className="bg-slate-900">
                        {form.district ? 'Select Tehsil' : 'Select district first'}
                      </option>
                      {tehsils.map((teh) => (
                        <option key={teh} value={teh} className="bg-slate-900">
                          {teh}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Street Address */}
                <div className="sm:col-span-3">
                  <Label>Complete Street Address *</Label>
                  <textarea
                    required
                    value={form.address}
                    onChange={(e) => set('address', e.target.value)}
                    placeholder="e.g. 123 Education Boulevard, Near Main Gate"
                    className="register-input min-h-20 mt-1.5 resize-y"
                  />
                </div>
              </div>
            </section>

            {/* ── 3. Administrator Information & Login Details ── */}
            <section className="register-card rounded-3xl border border-white/10 bg-[#0c1227]/90 p-6 sm:p-7 shadow-xl">
              <SectionHead
                icon={UserRound}
                title="3. Administrator Information & Login"
                text="This Gmail and password will be used to login to your school dashboard."
              />

              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <IconField
                  icon={UserRound}
                  label="Admin / Owner Full Name"
                  type="text"
                  value={form.adminName}
                  set={(v) => set('adminName', v)}
                  placeholder="e.g. Muhammad Ahmad"
                />

                <IconField
                  icon={Phone}
                  label="Phone / WhatsApp Number"
                  type="tel"
                  value={form.adminPhone}
                  set={(v) => set('adminPhone', v)}
                  placeholder="+92 300 1234567"
                />

                <div className="sm:col-span-2">
                  <Label>Gmail Address (Login ID) *</Label>
                  <div className="relative mt-1.5">
                    <Mail size={16} className="input-icon" />
                    <input
                      required
                      type="email"
                      value={form.adminEmail}
                      onChange={(e) => set('adminEmail', e.target.value)}
                      placeholder="admin@gmail.com"
                      className="register-input pl-10"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    This Gmail will be your primary username to access your school portal.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <Label>Login Password *</Label>
                  <div className="relative mt-1.5">
                    <LockKeyhole size={16} className="input-icon" />
                    <input
                      required
                      minLength={12}
                      type={showPassword ? 'text' : 'password'}
                      value={form.adminPassword}
                      onChange={(e) => set('adminPassword', e.target.value)}
                      placeholder="Minimum 12 characters"
                      className="register-input pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  <p className={`text-[11px] mt-1.5 ${form.adminPassword.length >= 12 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {strength}
                  </p>
                </div>
              </div>
            </section>

            {/* ── Submit Button ── */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between items-center p-1 pt-2">
              <p className="text-xs text-slate-500 text-center sm:text-left">
                By registering, you agree to create and manage your workspace responsibly.
              </p>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3.5 font-bold shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating Workspace…
                  </>
                ) : (
                  <>
                    <Sparkles size={17} />
                    Create School Workspace
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-slate-200">{children}</label>;
}

function IconField({
  icon: Icon,
  label,
  type = 'text',
  value,
  set,
  placeholder,
}: {
  icon: any;
  label: string;
  type?: string;
  value: string;
  set: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <Label>{label} *</Label>
      <div className="relative mt-1.5">
        <Icon size={16} className="input-icon" />
        <input
          required
          type={type}
          value={value}
          onChange={(e) => set(e.target.value)}
          placeholder={placeholder}
          className="register-input pl-10"
        />
      </div>
    </div>
  );
}

function SectionHead({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
        <Icon size={18} />
      </span>
      <div>
        <h2 className="font-bold text-base">{title}</h2>
        <p className="text-xs mt-0.5 text-slate-400">{text}</p>
      </div>
    </div>
  );
}
