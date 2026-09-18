import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Award, BookOpen, CalendarCheck, CheckCircle2, Clock3, GraduationCap, Loader2, ReceiptText, UsersRound } from "lucide-react";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";

type Attendance = { status?: string; date?: string };
type Student = {
  id: string;
  name: string;
  admissionNo?: string;
  rollNo?: string;
  avatarUrl?: string;
  status?: string;
  section?: { name?: string; class?: { name?: string } };
  attendances?: Attendance[];
  examResults?: Array<{ marks?: number; obtainedMarks?: number; grade?: string; exam?: { name?: string }; subject?: { name?: string } }>;
  feePayments?: Array<{ amount?: number; status?: string }>;
  homeworkSubmissions?: Array<{ status?: string; homework?: { title?: string } }>;
};

type ParentData = { name?: string; email?: string; phone?: string; students?: Array<{ student: Student }> };

export default function ParentPortal() {
  const [data, setData] = useState<ParentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    apiClient.get("/people/me")
      .then(({ data: response }) => {
        setData(response || null);
        const first = response?.students?.[0]?.student?.id;
        if (first) setSelectedId(first);
      })
      .catch((error) => toast.error(error?.response?.data?.message || "Unable to load parent portal"))
      .finally(() => setLoading(false));
  }, []);

  const children = useMemo(() => (data?.students || []).map((row) => row.student).filter(Boolean), [data]);
  const selected = children.find((student) => student.id === selectedId) || children[0];
  const attendance = selected?.attendances || [];
  const present = attendance.filter((row) => ["PRESENT", "present"].includes(String(row.status))).length;
  const absent = attendance.filter((row) => ["ABSENT", "absent"].includes(String(row.status))).length;
  const attendanceRate = attendance.length ? Math.round((present / attendance.length) * 100) : 0;
  const results = selected?.examResults || [];
  const homework = selected?.homeworkSubmissions || [];
  const fees = selected?.feePayments || [];

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-violet-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-violet-400"><UsersRound size={12} /> Parent Portal</div>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Welcome, {data?.name || "Parent"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Read-only access to your linked children's school records.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">{children.length} linked {children.length === 1 ? "child" : "children"}</div>
      </div>

      {children.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center"><GraduationCap className="mx-auto text-muted-foreground mb-3" size={34} /><h2 className="font-bold text-lg">No linked student account</h2><p className="text-sm text-muted-foreground mt-1">Ask the School Admin to link your parent account with your child.</p></div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {children.map((child, index) => {
              const active = child.id === selected?.id;
              return <motion.button key={child.id} whileHover={{ y: -2 }} onClick={() => setSelectedId(child.id)} className={`text-left rounded-3xl border p-5 transition-all ${active ? "border-violet-500/40 bg-violet-500/[0.08] shadow-lg shadow-violet-500/10" : "border-border bg-card hover:border-violet-500/20"}`}>
                <div className="flex items-center gap-3"><div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black">{child.name?.charAt(0) || "S"}</div><div className="min-w-0"><p className="font-black truncate">{child.name}</p><p className="text-xs text-muted-foreground truncate">{child.section?.class?.name || "Class not assigned"}{child.section?.name ? ` • ${child.section.name}` : ""}</p></div><span className="ml-auto text-[10px] font-bold text-muted-foreground">#{index + 1}</span></div>
                <div className="grid grid-cols-2 gap-2 mt-4 text-[11px]"><span className="rounded-xl bg-background/60 px-3 py-2">Admission<br /><strong>{child.admissionNo || "—"}</strong></span><span className="rounded-xl bg-background/60 px-3 py-2">Roll No<br /><strong>{child.rollNo || "—"}</strong></span></div>
              </motion.button>;
            })}
          </div>

          {selected && <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat icon={<CalendarCheck size={22} strokeWidth={2.2} />} label="Attendance" value={`${attendanceRate}%`} detail={`${present} present • ${absent} absent`} gradient="from-emerald-500/[0.08] via-card/70 to-card" border="border-emerald-500/25 hover:border-emerald-500/50" glow="bg-emerald-500/15 group-hover:bg-emerald-500/25" iconBox="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25" labelColor="text-emerald-600 dark:text-emerald-400" dotColor="bg-emerald-500" dotPing="bg-emerald-400" shadow="shadow-emerald-500/[0.04] hover:shadow-emerald-500/15" />
              <Stat icon={<Award size={22} strokeWidth={2.2} />} label="Results" value={String(results.length)} detail="Published records" gradient="from-violet-500/[0.08] via-card/70 to-card" border="border-violet-500/25 hover:border-violet-500/50" glow="bg-violet-500/15 group-hover:bg-violet-500/25" iconBox="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25" labelColor="text-violet-600 dark:text-violet-400" dotColor="bg-violet-500" dotPing="bg-violet-400" shadow="shadow-violet-500/[0.04] hover:shadow-violet-500/15" />
              <Stat icon={<BookOpen size={22} strokeWidth={2.2} />} label="Homework" value={String(homework.length)} detail="Submission records" gradient="from-cyan-500/[0.08] via-card/70 to-card" border="border-cyan-500/25 hover:border-cyan-500/50" glow="bg-cyan-500/15 group-hover:bg-cyan-500/25" iconBox="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25" labelColor="text-cyan-600 dark:text-cyan-400" dotColor="bg-cyan-500" dotPing="bg-cyan-400" shadow="shadow-cyan-500/[0.04] hover:shadow-cyan-500/15" />
              <Stat icon={<ReceiptText size={22} strokeWidth={2.2} />} label="Payments" value={String(fees.length)} detail="Fee records" gradient="from-amber-500/[0.08] via-card/70 to-card" border="border-amber-500/25 hover:border-amber-500/50" glow="bg-amber-500/15 group-hover:bg-amber-500/25" iconBox="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25" labelColor="text-amber-600 dark:text-amber-400" dotColor="bg-amber-500" dotPing="bg-amber-400" shadow="shadow-amber-500/[0.04] hover:shadow-amber-500/15" />
            </div>

            <div className="grid xl:grid-cols-2 gap-5">
              <section className="rounded-3xl border border-border bg-card overflow-hidden"><Header icon={<CalendarCheck size={18} />} title="Attendance" /><div className="p-5"><div className="h-3 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500" style={{ width: `${attendanceRate}%` }} /></div><div className="flex justify-between text-xs text-muted-foreground mt-2"><span>{present} present</span><span>{absent} absent</span></div><div className="mt-4 space-y-2 max-h-52 overflow-auto">{attendance.slice(0, 12).map((row, i) => <div key={`${row.date}-${i}`} className="flex items-center justify-between rounded-xl bg-background/50 px-3 py-2 text-xs"><span>{row.date ? new Date(row.date).toLocaleDateString() : "—"}</span><span className={String(row.status).toUpperCase() === "PRESENT" ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>{row.status || "—"}</span></div>)}{attendance.length === 0 && <Empty text="No attendance records yet." />}</div></div></section>
              <section className="rounded-3xl border border-border bg-card overflow-hidden"><Header icon={<Award size={18} />} title="Exam Results" /><div className="p-5 space-y-2 max-h-72 overflow-auto">{results.slice(0, 20).map((row, i) => <div key={i} className="rounded-xl bg-background/50 px-3 py-3 flex items-center justify-between gap-3"><div className="min-w-0"><p className="font-semibold text-xs truncate">{row.subject?.name || "Subject"}</p><p className="text-[10px] text-muted-foreground truncate">{row.exam?.name || "Exam"}</p></div><div className="text-right"><p className="font-black text-sm">{row.obtainedMarks ?? row.marks ?? "—"}</p><p className="text-[10px] text-violet-400 font-bold">{row.grade || ""}</p></div></div>)}{results.length === 0 && <Empty text="No published results yet." />}</div></section>
              <section className="rounded-3xl border border-border bg-card overflow-hidden"><Header icon={<BookOpen size={18} />} title="Homework" /><div className="p-5 space-y-2 max-h-72 overflow-auto">{homework.slice(0, 20).map((row, i) => <div key={i} className="rounded-xl bg-background/50 px-3 py-3 flex items-center gap-3"><Clock3 size={15} className="text-violet-400 shrink-0" /><div className="min-w-0"><p className="font-semibold text-xs truncate">{row.homework?.title || "Homework"}</p><p className="text-[10px] text-muted-foreground">{row.status || "Submitted"}</p></div></div>)}{homework.length === 0 && <Empty text="No homework submissions yet." />}</div></section>
              <section className="rounded-3xl border border-border bg-card overflow-hidden"><Header icon={<ReceiptText size={18} />} title="Fee History" /><div className="p-5 space-y-2 max-h-72 overflow-auto">{fees.slice(0, 20).map((row, i) => <div key={i} className="rounded-xl bg-background/50 px-3 py-3 flex items-center justify-between"><span className="text-xs font-semibold">Payment #{i + 1}</span><span className="text-xs font-black">{row.amount != null ? `PKR ${Number(row.amount).toLocaleString()}` : "—"}</span></div>)}{fees.length === 0 && <Empty text="No fee payment records yet." />}</div></section>
            </div>
          </div>}
        </>
      )}
    </div>
  );
}

function Stat({ icon, label, value, detail, gradient, border, glow, iconBox, labelColor, dotColor, dotPing, shadow }: { icon: React.ReactNode; label: string; value: string; detail: string; gradient: string; border: string; glow: string; iconBox: string; labelColor: string; dotColor: string; dotPing: string; shadow: string }) {
  return (
    <div className={`group relative overflow-hidden rounded-3xl border ${border} bg-gradient-to-br ${gradient} p-5 shadow-lg ${shadow} backdrop-blur-xl transition-all duration-300 hover:-translate-y-1`}>
      <div className={`pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full ${glow} blur-2xl transition-all duration-500 group-hover:scale-150`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-wider ${labelColor}`}>{label}</p>
          <h4 className="mt-2 text-2xl sm:text-3xl font-black text-foreground tracking-tight">{value}</h4>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBox} border shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          {icon}
        </div>
      </div>
      <div className="relative mt-4 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotPing} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
        </span>
        <span>{detail}</span>
      </div>
    </div>
  );
}
function Header({ icon, title }: { icon: React.ReactNode; title: string }) { return <div className="px-5 py-4 border-b border-border flex items-center gap-2"><span className="text-violet-500">{icon}</span><h2 className="font-black text-sm">{title}</h2></div>; }
function Empty({ text }: { text: string }) { return <div className="py-8 text-center text-xs text-muted-foreground"><CheckCircle2 className="mx-auto mb-2 opacity-40" size={20} />{text}</div>; }
