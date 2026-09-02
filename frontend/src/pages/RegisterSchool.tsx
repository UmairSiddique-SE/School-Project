import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  Globe2,
  ImagePlus,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  School,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";
import { useAuth } from "@/context/AuthContext";

/* ── Pakistan Location Hierarchy ── */
const PAKISTAN_LOCATIONS: Record<string, Record<string, string[]>> = {
  Punjab: {
    Lahore: [
      "Lahore City",
      "Cantonment",
      "Model Town",
      "Gulberg",
      "DHA",
      "Raiwind",
      "Shalimar",
    ],
    Faisalabad: [
      "Faisalabad City",
      "Jaranwala",
      "Samundri",
      "Tandlianwala",
      "Chak Jhumra",
    ],
    Rawalpindi: ["Rawalpindi City", "Murree", "Kahuta", "Taxila", "Gujar Khan"],
    Gujranwala: ["Gujranwala City", "Wazirabad", "Kamoke", "Nowshera Virkan"],
    Multan: ["Multan City", "Shujabad", "Lodhran", "Jalapur Pirwala"],
    Bahawalpur: ["Bahawalpur City", "Ahmadpur East", "Hasilpur", "Yazman"],
    Sialkot: ["Sialkot City", "Daska", "Sambrial", "Pasrur"],
    Sargodha: ["Sargodha City", "Bhalwal", "Kot Momin", "Sahiwal (Sargodha)"],
    Sahiwal: ["Sahiwal City", "Okara", "Pakpattan", "Chichawatni"],
    Sheikhupura: ["Sheikhupura City", "Muridke", "Ferozewala", "Nankana Sahib"],
    Kasur: ["Kasur City", "Chunian", "Pattoki", "Kot Radha Kishan"],
    Dera_Ghazi_Khan: [
      "D.G. Khan City",
      "Taunsa Sharif",
      "Rajanpur",
      "Kot Chutta",
    ],
    Mianwali: ["Mianwali City", "Piplan", "Wan Bachran"],
    Khushab: ["Joharabad", "Noorpur", "Hadali", "Quaidabad"],
    Muzaffargarh: ["Muzaffargarh City", "Kot Addu", "Alipur", "Jatoi"],
    Attock: ["Attock City", "Hazro", "Fateh Jang", "Pindigheb"],
    Chakwal: ["Chakwal City", "Talagang", "Choa Saidan Shah"],
    Jhelum: ["Jhelum City", "Pind Dadan Khan", "Sohawa"],
    Hafizabad: ["Hafizabad City", "Pindi Bhattian", "Kolo Tarar"],
    Narowal: ["Narowal City", "Shakargarh", "Zafarwal"],
    Gujrat: ["Gujrat City", "Kharian", "Sarai Alamgir"],
    Mandi_Bahauddin: ["Mandi Bahauddin City", "Phalia", "Malakwal"],
    Chiniot: ["Chiniot City", "Bhawana", "Lalian"],
    Toba_Tek_Singh: ["Toba Tek Singh City", "Gojra", "Kamalia", "Rajana"],
    Vehari: ["Vehari City", "Burewala", "Mailsi"],
    Bhakkar: ["Bhakkar City", "Mankera", "Darya Khan"],
    Layyah: ["Layyah City", "Chaubara", "Karor Lal Esan"],
    Lodhran: ["Lodhran City", "Kehror Pakka", "Dunyapur"],
    Nankana_Sahib: ["Nankana Sahib City", "Shahkot", "Sangla Hill"],
    Pakpattan: ["Pakpattan City", "Arifwala", "Depalpur"],
    Okara: ["Okara City", "Renala Khurd", "Depalpur"],
    Rajanpur: ["Rajanpur City", "Rojhan", "Jampur"],
  },
  Sindh: {
    Karachi: [
      "Karachi Central",
      "Karachi East",
      "Karachi West",
      "Karachi South",
      "Malir",
      "Korangi",
      "Keamari",
      "Bin Qasim",
    ],
    Hyderabad: ["Hyderabad City", "Latifabad", "Qasimabad", "Kotri"],
    Sukkur: ["Sukkur City", "Rohri", "Salehpat", "Pano Aqil"],
    Larkana: ["Larkana City", "Ratodero", "Dokri", "Bakrani"],
    Jacobabad: ["Jacobabad City", "Thull", "Garhi Khairo"],
    Shikarpur: ["Shikarpur City", "Khanpur (Sindh)", "Lakhi"],
    Khairpur: ["Khairpur City", "Kot Diji", "Gambat", "Faiz Ganj"],
    Nawabshah: ["Nawabshah City", "Sakrand", "Daur", "Qazi Ahmed"],
    Mirpur_Khas: [
      "Mirpur Khas City",
      "Digri",
      "Umerkot",
      "Kot Ghulam Muhammad",
    ],
    Sanghar: ["Sanghar City", "Shahdadpur", "Sinjhoro", "Jam Nawaz Ali"],
    Dadu: ["Dadu City", "Mehar", "Khairpur Nathan Shah", "Johi"],
    Matiari: ["Hala", "Matiari City", "Saeedabad"],
    Tando_Allah_Yar: ["Tando Allah Yar City", "Chamber", "Tando Ghulam Ali"],
    Tando_Muhammad_Khan: ["Tando Muhammad Khan City", "Bulri Shah Karim"],
    Badin: ["Badin City", "Talhar", "Tando Bago", "Matli"],
    Thatta: ["Thatta City", "Mirpur Sakro", "Ghorabari", "Sujawal"],
    Ghotki: ["Ghotki City", "Ubauro", "Daharki", "Mirpur Mathelo"],
    Kashmore: ["Kandhkot", "Kashmore City", "Tangwani"],
    Naushahro_Feroze: ["Naushahro Feroze City", "Moro", "Kandiaro"],
    Kambar_Shahdadkot: ["Kambar City", "Shahdadkot", "Qubo Saeed Khan"],
    Jamshoro: ["Sehwan Sharif", "Manjhand", "Kotri (Jamshoro)"],
    Umerkot: ["Umerkot City", "Kunri", "Pithoro", "Samaro"],
    Sujawal: ["Sujawal City", "Jati", "Shah Bandar"],
  },
  "Khyber Pakhtunkhwa": {
    Peshawar: ["Peshawar City", "Hayatabad", "Bara", "Chamkani"],
    Mardan: ["Mardan City", "Takht Bhai", "Katlang"],
    Swat: ["Mingora", "Saidu Sharif", "Kabal", "Matta", "Bahrain"],
    Abbottabad: ["Abbottabad City", "Havelian", "Mansehra Road", "Lora"],
    Mansehra: ["Mansehra City", "Oghi", "Balakot", "Shinkiari"],
    Nowshera: ["Nowshera City", "Pabbi", "Jehangira"],
    Charsadda: ["Charsadda City", "Shabqadar", "Tangi"],
    Kohat: ["Kohat City", "Lachi", "Gumbat"],
    Bannu: ["Bannu City", "Domel", "Miryan"],
    Dera_Ismail_Khan: ["D.I. Khan City", "Kulachi", "Paroa"],
    Haripur: ["Haripur City", "Ghazi", "Khanpur (KPK)"],
    Malakand: ["Malakand City", "Batkhela", "Thana"],
    Swabi: ["Swabi City", "Topi", "Lahor (KPK)", "Gadoon"],
    Lakki_Marwat: ["Lakki City", "Serai Naurang"],
    Tank: ["Tank City", "Kulachi (Tank)"],
    Buner: ["Daggar", "Sowari", "Sultanpur"],
    Dir_Upper: ["Timergara", "Wari", "Sheringal"],
    Dir_Lower: ["Timergara (Lower)", "Adenzai", "Balambat"],
    Shangla: ["Alpuri", "Bisham", "Chakesar"],
    Kohistan_Upper: ["Dassu", "Pattan", "Kandia"],
    Battagram: ["Battagram City", "Allai", "Oghi (Battagram)"],
    Tor_Ghar: ["Behrain", "Darora"],
    Chitral: ["Chitral City", "Drosh", "Ayun"],
    Kurram: ["Parachinar", "Sadda", "Alizai"],
    North_Waziristan: ["Miranshah", "Mir Ali", "Razmak"],
    South_Waziristan: ["Wana", "Sararogha"],
    Bajaur: ["Khar", "Nawagai", "Salarzai"],
    Mohmand: ["Ghalanai", "Ekka Ghund"],
    Khyber: ["Landi Kotal", "Jamrud", "Ali Masjid"],
    Orakzai: ["Kalaya", "Hangu Road"],
  },
  Balochistan: {
    Quetta: ["Quetta City", "Sariab", "Samungli", "Brewery Road"],
    Gwadar: ["Gwadar City", "Ormara", "Jiwani", "Pasni"],
    Turbat: ["Turbat City", "Mand", "Hoshab"],
    Khuzdar: ["Khuzdar City", "Wadh", "Naal"],
    Kalat: ["Kalat City", "Surab", "Mangochar"],
    Chaman: ["Chaman City", "Khanozai", "Gulistan"],
    Loralai: ["Loralai City", "Barkhan", "Duki"],
    Zhob: ["Zhob City", "Muslim Bagh", "Sherani"],
    Sibi: ["Sibi City", "Dera Bugti", "Baap"],
    Nasirabad: ["Dera Murad Jamali", "Tamboo", "Loti"],
    Jaffarabad: ["Usta Muhammad", "Sohbatpur", "Gandakha"],
    Lasbela: ["Hub", "Bela", "Uthal"],
    Panjgur: ["Panjgur City", "Gichk", "Paroom"],
    Awaran: ["Awaran City", "Jhal Jhao", "Mashkel"],
    Kech: ["Turbat (Kech)", "Tump", "Buleda"],
    Nushki: ["Nushki City", "Dhadar"],
    Chaghi: ["Dalbandin", "Taftan"],
    Washuk: ["Kharan", "Nag"],
    Harnai: ["Harnai City", "Shahrag"],
    Bolan: ["Mach", "Bhag", "Dadhar"],
    Mastung: ["Mastung City", "Dasht"],
    Ziarat: ["Ziarat City", "Kawas"],
    Musakhel: ["Kingri", "Thal (Balochistan)"],
    Sherani: ["Sherani City", "Drazinda"],
    Lehri: ["Lehri City", "Sibi Junction"],
    Kohlu: ["Kohlu City", "Tamboo (Kohlu)"],
    Barkhan: ["Barkhan City", "Rakhni"],
  },
  "Azad Kashmir": {
    Muzaffarabad: ["Muzaffarabad City", "Chattar Katas", "Nauseri"],
    Mirpur: ["Mirpur City", "Chakswari", "Dadyal", "Alibeg"],
    Rawalakot: ["Rawalakot City", "Banjosa", "Hajira"],
    Bhimber: ["Bhimber City", "Samahni", "Barnala"],
    Kotli: ["Kotli City", "Sehnsa", "Fatehpur"],
    Bagh: ["Bagh City", "Dhirkot", "Sudhanoti"],
    Haveli: ["Forward Kahuta", "Kahuta (AJK)"],
    Neelum: ["Athmuqam", "Sharda", "Kel"],
    Hattian: ["Hattian Bala", "Domel (AJK)"],
    Jhelum_Valley: ["Chakothi", "Karot", "Doonian"],
  },
  Gilgit_Baltistan: {
    Gilgit: ["Gilgit City", "Jutial", "Sakwar"],
    Skardu: ["Skardu City", "Shigar", "Khaplu"],
    Hunza: ["Karimabad", "Aliabad", "Gulmit"],
    Nagar: ["Nagar City", "Hispar", "Hopar"],
    Diamer: ["Chilas", "Darel", "Tangir"],
    Ghanche: ["Khaplu (Ghanche)", "Daghoni"],
    Ghizer: ["Gahkuch", "Phander", "Yasin"],
    Astore: ["Astore City", "Rama", "Minimarg"],
  },
  "Islamabad Capital Territory": {
    Islamabad: [
      "F-Sector",
      "G-Sector",
      "I-Sector",
      "E-Sector",
      "Bhara Kahu",
      "Tarnol",
      "Saidpur",
      "Golra Sharif",
      "Fateh Jhang",
    ],
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
  schoolName: "",
  schoolSlug: "",
  logoUrl: "",
  province: "",
  district: "",
  tehsil: "",
  address: "",
  adminName: "",
  adminEmail: "",
  adminPhone: "",
  adminPassword: "",
};

const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
};

const getPasswordStrength = (value: string) => {
  if (!value) return "Use at least 8 characters";
  if (value.length >= 12) return "Strong password";
  if (value.length >= 8) return "Good password";
  return `${8 - value.length} more characters needed`;
};

export default function RegisterSchool() {
  const [form, setForm] = useState<FormState>(initial);
  const [showPassword, setShowPassword] = useState(false);
  const [flowStep, setFlowStep] = useState<
    "form" | "otp" | "payment" | "pending"
  >("form");
  const [otpValue, setOtpValue] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("123456");
  const [verificationUserId, setVerificationUserId] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("JazzCash");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [approvalRef, setApprovalRef] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const districts = form.province
    ? Object.keys(PAKISTAN_LOCATIONS[form.province] || {})
    : [];
  const tehsils =
    form.province && form.district
      ? PAKISTAN_LOCATIONS[form.province]?.[form.district] || []
      : [];

  const subdomain = useMemo(
    () =>
      form.schoolSlug
        ? `${form.schoolSlug}.edusphere.com`
        : "your-school.edusphere.com",
    [form.schoolSlug],
  );

  const strength = getPasswordStrength(form.adminPassword);

  const set = (key: keyof FormState, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const onLogo = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      toast.error("Use a PNG, JPG, or WEBP image below 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set("logoUrl", String(reader.result));
    reader.readAsDataURL(file);
  };

  const onSchoolName = (value: string) => {
    const autoSlug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setForm((p) => ({
      ...p,
      schoolName: value,
      schoolSlug: p.schoolSlug || autoSlug,
    }));
  };

  const validateForm = () => {
    if (!form.logoUrl) {
      toast.error("Please upload your school logo.");
      return false;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.schoolSlug)) {
      toast.error(
        "Use lowercase letters, numbers and hyphens for your school URL.",
      );
      return false;
    }
    if (!form.province || !form.district || !form.tehsil) {
      toast.error("Please select Province, District and Tehsil.");
      return false;
    }
    if (!/^03\d{2}-\d{7}$/.test(form.adminPhone)) {
      toast.error("Phone number must be in this format: 0300-1234567");
      return false;
    }
    if (form.adminPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return false;
    }
    return true;
  };

  const sendOtp = async () => {
    if (!validateForm()) return;
    try {
      const response = await apiClient.post("/auth/register-school", {
        schoolName: form.schoolName,
        schoolSlug: form.schoolSlug,
        schoolType: "SCHOOL",
        logoUrl: form.logoUrl,
        country: "Pakistan",
        city: form.district || form.province,
        schoolAddress: [form.address, `Tehsil ${form.tehsil}`, `District ${form.district}`, form.province].filter(Boolean).join(", "),
        schoolPhone: form.adminPhone,
        adminName: form.adminName,
        adminEmail: form.adminEmail,
        adminPhone: form.adminPhone,
        adminPassword: form.adminPassword,
        requestedPlan: "FREE_TRIAL",
      });
      setVerificationUserId(response.data.verificationUserId);
      setGeneratedOtp("123456");
      setFlowStep("otp");
      toast.success(`Verification code sent to ${form.adminEmail}. Demo OTP: 123456`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to start registration.");
    }
  };

  const handleOtpSubmit = async () => {
    if (otpValue.trim() !== generatedOtp) {
      toast.error("Incorrect OTP. Please enter the correct 6-digit code.");
      return;
    }
    try {
      const response = await apiClient.post("/auth/verify-email", { userId: verificationUserId, otp: otpValue.trim() });
      login(response.data.accessToken, response.data.user);
      toast.success("Gmail verified successfully. You can now access your dashboard.");
      navigate(`/${response.data.user.schoolSlug}/dashboard`, { replace: true });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Email verification failed.");
    }
  };

  const handlePayment = async () => {
    setPaymentLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setPaymentLoading(false);

    const ref = `EDU-${Date.now().toString().slice(-8)}`;
    setApprovalRef(ref);

    try {
      const schoolId = JSON.parse(localStorage.getItem("auth_user") || "{}").schoolId;
      await apiClient.post("/auth/onboarding-payment", {
        schoolId,
        plan: "FREE_TRIAL",
        method: selectedPayment,
        reference: ref,
      });
      toast.success("Payment submitted. Your school is pending admin approval.");
    } catch (error: any) {
      toast.warning(
        error?.response?.data?.message ||
          "Demo flow: the registration record was stored and is pending approval.",
      );
    } finally {
      setFlowStep("pending");
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await Promise.resolve();
      await sendOtp();
    } finally {
      setSaving(false);
    }
  };

  const paymentMethods = [
    { label: "JazzCash", icon: WalletCards },
    { label: "Easypaisa", icon: CreditCard },
    { label: "Bank Transfer", icon: ShieldAlert },
    { label: "Credit / Debit Card", icon: BadgeCheck },
  ];

  const renderPendingStatus = () => (
    <div className="space-y-6 rounded-3xl border border-violet-500/20 bg-[#0c1227]/90 p-6 shadow-2xl sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
            <ShieldCheck size={12} />
            Pending approval
          </div>
          <h2 className="mt-4 text-3xl font-black text-white">
            Registration submitted successfully
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Your school application is now under review by the super admin team.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-right">
          <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-300">
            Reference
          </p>
          <p className="mt-1 text-lg font-black text-emerald-300">
            {approvalRef || "EDU-000000"}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          [
            "Application Received",
            "Your school data and admin profile were saved.",
            true,
          ],
          [
            "Gmail Verified",
            "Admin email was successfully verified via OTP.",
            true,
          ],
          [
            "Payment Confirmed",
            `${selectedPayment} payment completed and recorded.`,
            true,
          ],
        ].map(([title, desc, done], index) => (
          <div
            key={`feature-${index}`}
            className={`rounded-2xl border p-4 ${done ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/10 bg-white/[0.02]"}`}
          >
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
            <p className="text-sm font-bold text-white">{title}</p>
            <p className="mt-1 text-xs text-slate-400">{desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-300">
          Approval timeline
        </p>
        <div className="mt-4 space-y-4">
          {[
            "Application review by super admin",
            "Plan verification and account setup",
            "School workspace activation",
          ].map((item, index) => (
            <div key={item} className="flex items-center gap-3">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black ${index === 0 ? "bg-violet-500 text-white" : "bg-white/5 text-slate-400"}`}
              >
                {index + 1}
              </div>
              <p className="text-sm text-slate-300">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          onClick={() => navigate("/admin-login")}
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
        >
          Go to admin login
        </button>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/30 transition hover:scale-[1.01]"
        >
          Back to homepage
        </button>
      </div>
    </div>
  );

  if (flowStep === "pending") {
    return (
      <main className="min-h-screen bg-[#070b1a] p-4 py-8 text-white">
        <div className="mx-auto max-w-5xl">{renderPendingStatus()}</div>
      </main>
    );
  }

  if (flowStep === "otp") {
    return (
      <main className="min-h-screen bg-[#070b1a] p-4 py-8 text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-[#0c1227]/90 p-7 shadow-2xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
            <Mail size={22} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">
            Gmail verification
          </p>
          <h2 className="mt-3 text-3xl font-black text-white">Enter OTP</h2>
          <p className="mt-2 text-sm text-slate-300">
            A verification code was sent to{" "}
            <span className="font-semibold text-white">{form.adminEmail}</span>.
          </p>
          <p className="mt-2 rounded-xl border border-violet-500/15 bg-violet-500/5 px-3 py-2 text-xs text-violet-200">
            Demo OTP: <span className="font-black">{generatedOtp}</span>
          </p>

          <div className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-slate-200">
              OTP Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpValue}
              onChange={(e) =>
                setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="register-input text-center text-2xl tracking-[0.5em]"
              placeholder="123456"
            />
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setFlowStep("form")}
              className="flex-1 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleOtpSubmit}
              className="flex-1 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/30 transition hover:scale-[1.01]"
            >
              Verify OTP
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (flowStep === "payment") {
    return (
      <main className="min-h-screen bg-[#070b1a] p-4 py-8 text-white">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-[#0c1227]/90 p-7 shadow-2xl">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">
                Payment
              </p>
              <h2 className="mt-2 text-3xl font-black text-white">
                Choose payment method
              </h2>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-right">
              <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-300">
                Total
              </p>
              <p className="mt-1 text-2xl font-black text-emerald-300">
                PKR 12,500
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {paymentMethods.map(({ label, icon: Icon }) => {
              const active = selectedPayment === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSelectedPayment(label)}
                  className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                    active
                      ? "border-violet-500/40 bg-violet-500/10 shadow-lg shadow-violet-500/10"
                      : "border-white/10 bg-white/[0.02] hover:border-violet-500/20"
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-violet-300">
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-black text-white">{label}</p>
                    <p className="text-xs text-slate-400">
                      Secure payment via {label}
                    </p>
                  </div>
                  {active && (
                    <BadgeCheck size={18} className="text-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-sm text-slate-300">
              Selected method:{" "}
              <span className="font-black text-white">{selectedPayment}</span>
            </p>
            <p className="mt-2 text-xs text-slate-400">
              After payment is confirmed, the school request will move into the
              pending approval workflow.
            </p>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => setFlowStep("otp")}
              className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handlePayment}
              disabled={paymentLoading}
              className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:scale-[1.01] disabled:opacity-70"
            >
              {paymentLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Processing...
                </span>
              ) : (
                `Pay with ${selectedPayment}`
              )}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070b1a] text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="absolute bottom-0 -right-20 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-7 md:py-11">
        <header className="mb-8 flex items-center justify-between">
          <Link
            to="/landing"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft size={16} /> Back to website
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
            <ShieldCheck size={16} /> Secure onboarding
          </div>
        </header>

        <div className="grid items-start gap-7 lg:grid-cols-[.75fr_1.25fr]">
          <aside className="rounded-3xl border border-white/10 bg-[#0c1227]/80 p-7 shadow-2xl backdrop-blur-md lg:sticky lg:top-8">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-600/25">
              <School size={24} />
            </div>
            <p className="mt-6 text-xs font-bold tracking-[.15em] text-violet-300">
              EDUSPHERE ERP
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight">
              Build your school workspace.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Everything you need to start running your institution in one
              secure place.
            </p>

            <ol className="mt-8 space-y-5">
              {[
                ["1", "School Information", "School name, logo & web URL"],
                [
                  "2",
                  "School Location",
                  "Province, district & tehsil selection",
                ],
                [
                  "3",
                  "Admin Account & Login",
                  "Admin name, Gmail ID & secure password",
                ],
              ].map(([number, title, copy], i) => (
                <li key={title} className="flex gap-3">
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      i === 0
                        ? "bg-violet-500 text-white"
                        : "bg-white/5 text-slate-400"
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
              <Check size={15} className="mr-2 inline text-emerald-400" />
              Private & secure workspace configured specifically for your
              school.
            </div>
          </aside>

          <form onSubmit={submit} className="space-y-6">
            <section className="register-card rounded-3xl border border-white/10 bg-[#0c1227]/90 p-6 shadow-xl sm:p-7">
              <SectionHead
                icon={Building2}
                title="1. School Information"
                text="Tell us how your institution should appear."
              />

              <div className="mt-6 grid gap-5 md:grid-cols-[170px_1fr]">
                <label className="group flex min-h-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-white/15 bg-white/[.025] transition-all hover:border-violet-400">
                  {form.logoUrl ? (
                    <img
                      src={form.logoUrl}
                      alt="School logo preview"
                      className="h-36 w-full object-contain p-3"
                    />
                  ) : (
                    <>
                      <ImagePlus
                        size={25}
                        className="text-violet-400 transition-transform group-hover:scale-110"
                      />
                      <b className="mt-2 text-sm">Upload logo *</b>
                      <span className="mt-1 text-[11px] text-slate-500">
                        PNG, JPG or WEBP · 2 MB max
                      </span>
                    </>
                  )}
                  <input
                    required
                    className="sr-only"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={onLogo}
                  />
                </label>

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
                    <div className="mt-1.5 flex">
                      <span className="grid place-items-center rounded-l-xl border border-r-0 border-white/10 bg-white/[.05] px-3">
                        <Building2 size={16} className="text-slate-400" />
                      </span>
                      <input
                        required
                        value={form.schoolSlug}
                        onChange={(e) =>
                          set(
                            "schoolSlug",
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, ""),
                          )
                        }
                        placeholder="beacon-house"
                        className="register-input rounded-l-none"
                      />
                    </div>
                    <p className="mt-2 text-xs text-emerald-300">
                      <Globe2 size={13} className="mr-1 inline" />
                      Your address: <b>{subdomain}</b>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="register-card rounded-3xl border border-white/10 bg-[#0c1227]/90 p-6 shadow-xl sm:p-7">
              <SectionHead
                icon={MapPin}
                title="2. School Location"
                text="Select province, district and tehsil of your institution."
              />

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Select Province *</Label>
                  <div className="relative mt-1.5">
                    <select
                      required
                      value={form.province}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          province: e.target.value,
                          district: "",
                          tehsil: "",
                        }))
                      }
                      className="register-input appearance-none cursor-pointer pr-8"
                    >
                      <option value="" className="bg-slate-900">
                        Select Province
                      </option>
                      {PROVINCES.map((prov) => (
                        <option
                          key={prov}
                          value={prov}
                          className="bg-slate-900"
                        >
                          {prov}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <Label>Select District *</Label>
                  <div className="relative mt-1.5">
                    <select
                      required
                      value={form.district}
                      disabled={!form.province}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          district: e.target.value,
                          tehsil: "",
                        }))
                      }
                      className="register-input appearance-none cursor-pointer pr-8 disabled:opacity-40"
                    >
                      <option value="" className="bg-slate-900">
                        {form.province
                          ? "Select District"
                          : "Select province first"}
                      </option>
                      {districts.map((dist) => (
                        <option
                          key={dist}
                          value={dist}
                          className="bg-slate-900"
                        >
                          {dist.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <Label>Select Tehsil *</Label>
                  <div className="relative mt-1.5">
                    <select
                      required
                      value={form.tehsil}
                      disabled={!form.district}
                      onChange={(e) => set("tehsil", e.target.value)}
                      className="register-input appearance-none cursor-pointer pr-8 disabled:opacity-40"
                    >
                      <option value="" className="bg-slate-900">
                        {form.district
                          ? "Select Tehsil"
                          : "Select district first"}
                      </option>
                      {tehsils.map((teh) => (
                        <option key={teh} value={teh} className="bg-slate-900">
                          {teh}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <Label>Complete Street Address *</Label>
                  <textarea
                    required
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="e.g. 123 Education Boulevard, Near Main Gate"
                    className="register-input mt-1.5 min-h-20 resize-y"
                  />
                </div>
              </div>
            </section>

            <section className="register-card rounded-3xl border border-white/10 bg-[#0c1227]/90 p-6 shadow-xl sm:p-7">
              <SectionHead
                icon={UserRound}
                title="3. Administrator Information & Login"
                text="This Gmail and password will be used to login to your school dashboard."
              />

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <IconField
                  icon={UserRound}
                  label="Admin / Owner Full Name"
                  type="text"
                  value={form.adminName}
                  set={(v) => set("adminName", v)}
                  placeholder="e.g. Muhammad Ahmad"
                />

                <IconField
                  icon={Phone}
                  label="Phone / WhatsApp Number"
                  type="tel"
                  value={form.adminPhone}
                  set={(v) => set("adminPhone", formatPhoneNumber(v))}
                  placeholder="0300-1234567"
                />

                <div className="sm:col-span-2">
                  <Label>Gmail Address (Login ID) *</Label>
                  <div className="relative mt-1.5">
                    <Mail size={16} className="input-icon" />
                    <input
                      required
                      type="email"
                      value={form.adminEmail}
                      onChange={(e) => set("adminEmail", e.target.value)}
                      placeholder="admin@gmail.com"
                      className="register-input pl-10"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    This Gmail will be your primary username to access your
                    school portal.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <Label>Login Password *</Label>
                  <div className="relative mt-1.5">
                    <LockKeyhole size={16} className="input-icon" />
                    <input
                      required
                      minLength={8}
                      type={showPassword ? "text" : "password"}
                      value={form.adminPassword}
                      onChange={(e) => set("adminPassword", e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="register-input pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 transition-colors hover:text-white"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  <p
                    className={`mt-1.5 text-[11px] ${form.adminPassword.length >= 8 ? "text-emerald-400" : "text-slate-400"}`}
                  >
                    {strength}
                  </p>
                </div>
              </div>
            </section>

            <div className="flex flex-col-reverse items-center justify-between gap-3 p-1 pt-2 sm:flex-row">
              <p className="text-center text-xs text-slate-500 sm:text-left">
                By registering, you agree to create and manage your workspace
                responsibly.
              </p>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3.5 font-bold shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.02] hover:shadow-violet-600/50 active:scale-[0.98] disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Sending OTP…
                  </>
                ) : (
                  <>
                    <Send size={17} />
                    Verify & Continue
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
  return (
    <label className="block text-sm font-semibold text-slate-200">
      {children}
    </label>
  );
}

function IconField({
  icon: Icon,
  label,
  type = "text",
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

function SectionHead({
  icon: Icon,
  title,
  text,
}: {
  icon: any;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
        <Icon size={18} />
      </span>
      <div>
        <h2 className="font-bold text-base">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-400">{text}</p>
      </div>
    </div>
  );
}
