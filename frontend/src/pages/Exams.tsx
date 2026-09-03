import React, { useEffect, useState } from "react";
import { Calendar, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";
import { useAuth } from "@/context/AuthContext";
import Modal, { ModalHeader } from "@/component/ui/Modal";

interface ExamItem {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  totalMarks: number;
  passingMarks: number;
  description?: string | null;
}

export default function Exams() {
  const { user } = useAuth();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "UNIT_TEST",
    startDate: "",
    endDate: "",
    totalMarks: "100",
    passingMarks: "33",
    description: "",
  });

  const loadExams = async () => {
    if (!user?.schoolId) return;
    setLoading(true);
    try {
      const response = await apiClient.get("/exams");
      setExams(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      setExams([]);
      toast.error(error?.response?.data?.message || "Unable to load exams.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [user?.schoolId]);

  const createExam = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.startDate || !form.endDate) return;
    setSaving(true);
    try {
      await apiClient.post("/exams", {
        name: form.name.trim(),
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        totalMarks: Number(form.totalMarks) || 100,
        passingMarks: Number(form.passingMarks) || 33,
        description: form.description.trim() || null,
      });
      toast.success("Exam created successfully.");
      setShowCreate(false);
      setForm({ name: "", type: "UNIT_TEST", startDate: "", endDate: "", totalMarks: "100", passingMarks: "33", description: "" });
      await loadExams();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Unable to create exam.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Exams</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage examination sessions using your school database.</p>
        </div>
        {user?.role === "SCHOOL_ADMIN" && (
          <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 shadow-sm">
            <Plus size={16} /> Schedule Exam
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-card border border-border rounded-3xl py-20 flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="animate-spin" size={20} /> Loading exams...
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-3xl py-20 text-center">
          <Calendar className="mx-auto mb-4 text-muted-foreground/40" size={42} />
          <h2 className="font-bold text-foreground">No exams found</h2>
          <p className="text-sm text-muted-foreground mt-1">No examination records exist for this school yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-card border border-border rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/20">{exam.type}</span>
                <span className="text-xs font-mono text-muted-foreground">{new Date(exam.startDate).toLocaleDateString()}</span>
              </div>
              <h2 className="text-lg font-black text-foreground">{exam.name}</h2>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p><span className="font-semibold text-foreground">Start:</span> {new Date(exam.startDate).toLocaleDateString()}</p>
                <p><span className="font-semibold text-foreground">End:</span> {new Date(exam.endDate).toLocaleDateString()}</p>
                <p><span className="font-semibold text-foreground">Marks:</span> {exam.totalMarks} · Pass {exam.passingMarks}</p>
              </div>
              {exam.description && <p className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">{exam.description}</p>}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} maxWidth="max-w-lg">
        <ModalHeader icon={<Calendar size={20} />} title="Schedule Examination" subtitle="Create a real examination record" onClose={() => setShowCreate(false)} />
        <form onSubmit={createExam} className="p-6 space-y-4">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Exam name" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm">
              <option value="UNIT_TEST">Unit Test</option>
              <option value="MIDTERM">Midterm</option>
              <option value="FINAL">Final</option>
              <option value="QUIZ">Quiz</option>
            </select>
            <input type="number" min="1" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} placeholder="Total marks" className="px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm" />
            <input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm" />
          </div>
          <input type="number" min="0" value={form.passingMarks} onChange={(e) => setForm({ ...form, passingMarks: e.target.value })} placeholder="Passing marks" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm" />
          <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm" />
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl border border-border text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create Exam
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
