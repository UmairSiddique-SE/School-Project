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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat icon={<CalendarCheck size={18} />} label="Attendance" value={`${attendanceRate}%`} detail={`${present} present • ${absent} absent`} />
              <Stat icon={<Award size={18} />} label="Results" value={String(results.length)} detail="Published records" />
              <Stat icon={<BookOpen size={18} />} label="Homework" value={String(homework.length)} detail="Submission records" />
              <Stat icon={<ReceiptText size={18} />} label="Payments" value={String(fees.length)} detail="Fee records" />
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

function Stat({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) { return <div className="rounded-2xl border border-border bg-card p-4"><div className="flex items-center gap-2 text-violet-500">{icon}<span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</span></div><p className="mt-2 text-2xl font-black">{value}</p><p className="text-[10px] text-muted-foreground mt-0.5">{detail}</p></div>; }
function Header({ icon, title }: { icon: React.ReactNode; title: string }) { return <div className="px-5 py-4 border-b border-border flex items-center gap-2"><span className="text-violet-500">{icon}</span><h2 className="font-black text-sm">{title}</h2></div>; }
function Empty({ text }: { text: string }) { return <div className="py-8 text-center text-xs text-muted-foreground"><CheckCircle2 className="mx-auto mb-2 opacity-40" size={20} />{text}</div>; }
