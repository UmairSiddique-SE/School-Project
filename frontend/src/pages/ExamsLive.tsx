import React, { useEffect, useMemo, useState } from 'react';
import {
  Award, Calendar, CheckCircle, CheckCircle2, Clock, FileText,
  Layers3, Loader2, Plus, RefreshCw, Search, Upload, Users, X,
  Printer, TrendingUp, AlertTriangle, BookOpen, UserCheck, ShieldAlert,
  GraduationCap, ArrowUpRight, BarChart3, Edit3, Trash2
} from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

interface Exam {
  id: string;
  name: string;
  type?: string;
  startDate: string;
  endDate: string;
  totalMarks: number;
  passingMarks: number;
  sectionId?: string | null;
  academicYearId?: string | null;
  isPublished?: boolean;
  description?: string | null;
  section?: { id: string; name: string; class?: { id: string; name: string } };
  academicYear?: { id: string; name: string };
  _count?: { results: number };
}

interface Section {
  id: string;
  name: string;
  class?: { id: string; name: string };
}

interface Subject {
  id: string;
  name: string;
  code?: string | null;
}

interface Student {
  id: string;
  name: string;
  rollNo?: string | null;
  admissionNo?: string;
  sectionId?: string | null;
}

interface ExamResultRow {
  studentId: string;
  marksObtained: number | string;
  grade?: string;
  remarks?: string;
  isAbsent?: boolean;
}

const TYPES = ['MIDTERM', 'FINAL', 'UNIT_TEST', 'MONTHLY_TEST', 'QUIZ', 'MOCK_BOARD'];

function computeGradeClient(percentage: number): { grade: string; isPassed: boolean } {
  if (percentage >= 85) return { grade: 'A+', isPassed: true };
  if (percentage >= 75) return { grade: 'A', isPassed: true };
  if (percentage >= 65) return { grade: 'B', isPassed: true };
  if (percentage >= 50) return { grade: 'C', isPassed: true };
  if (percentage >= 33) return { grade: 'D', isPassed: true };
  return { grade: 'F', isPassed: false };
}

const inputStyle = 'w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-medium transition';

export default function ExamsLive() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Selected Exam & Marks Entry state
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [marksRecords, setMarksRecords] = useState<Record<string, { marks: string; isAbsent: boolean; remarks: string }>>({});
  const [loadingResults, setLoadingResults] = useState(false);
  const [savingResults, setSavingResults] = useState(false);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [savingExam, setSavingExam] = useState(false);

  const [form, setForm] = useState({
    name: '',
    type: 'MIDTERM',
    startDate: '',
    endDate: '',
    totalMarks: '100',
    passingMarks: '33',
    sectionId: '',
    description: '',
  });

  const load = async () => {
    try {
      const [eRes, secRes, subRes, stRes] = await Promise.all([
        apiClient.get('/exams'),
        apiClient.get('/classes/sections'),
        apiClient.get('/classes/subjects'),
        apiClient.get('/people/students'),
      ]);
      const examList = Array.isArray(eRes.data) ? eRes.data : [];
      setExams(examList);
      setSections(Array.isArray(secRes.data) ? secRes.data : []);
      const subList = Array.isArray(subRes.data) ? subRes.data : [];
      setSubjects(subList);
      setStudents(Array.isArray(stRes.data) ? stRes.data : []);

      if (examList.length > 0 && !selectedExam) {
        setSelectedExam(examList[0]);
      }
      if (subList.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(subList[0].id);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to load exam records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // Fetch results when selectedExam or selectedSubjectId changes
  useEffect(() => {
    if (!selectedExam || !selectedSubjectId) return;
    const fetchResults = async () => {
      setLoadingResults(true);
      try {
        const { data } = await apiClient.get('/exams/results', {
          params: { examId: selectedExam.id, subjectId: selectedSubjectId },
        });
        const map: Record<string, { marks: string; isAbsent: boolean; remarks: string }> = {};
        if (Array.isArray(data)) {
          data.forEach((r: any) => {
            map[r.studentId] = {
              marks: String(r.marksObtained ?? ''),
              isAbsent: Boolean(r.isAbsent),
              remarks: r.remarks || '',
            };
          });
        }
        setMarksRecords(map);
      } catch {
        setMarksRecords({});
      } finally {
        setLoadingResults(false);
      }
    };
    void fetchResults();
  }, [selectedExam?.id, selectedSubjectId]);

  const filteredExams = useMemo(() => {
    const q = search.toLowerCase();
    return exams.filter((e) =>
      `${e.name} ${e.type || ''} ${e.section?.class?.name || ''}`.toLowerCase().includes(q)
    );
  }, [exams, search]);

  // Students eligible for this exam
  const examStudents = useMemo(() => {
    if (!selectedExam) return [];
    if (selectedExam.sectionId) {
      return students.filter(s => s.sectionId === selectedExam.sectionId);
    }
    return students;
  }, [selectedExam, students]);

  // Create Exam
  const createExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingExam(true);
    try {
      const { data } = await apiClient.post('/exams', {
        ...form,
        totalMarks: Number(form.totalMarks),
        passingMarks: Number(form.passingMarks),
        sectionId: form.sectionId || undefined,
      });
      setExams((p) => [data, ...p]);
      setSelectedExam(data);
      setShowCreate(false);
      setForm({
        name: '',
        type: 'MIDTERM',
        startDate: '',
        endDate: '',
        totalMarks: '100',
        passingMarks: '33',
        sectionId: '',
        description: '',
      });
      toast.success('Exam created and scheduled ✓');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create exam');
    } finally {
      setSavingExam(false);
    }
  };

  // Toggle Publish
  const togglePublish = async (exam: Exam) => {
    try {
      const { data } = await apiClient.patch(`/exams/${exam.id}/publish`, { published: !exam.isPublished });
      setExams((p) => p.map((x) => (x.id === exam.id ? data : x)));
      if (selectedExam?.id === exam.id) setSelectedExam(data);
      toast.success(data.isPublished ? 'Results published to student portal ✓' : 'Results unpublished');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to update publication status');
    }
  };

  // Save Subject Marks
  const saveMarks = async () => {
    if (!selectedExam || !selectedSubjectId) return;
    setSavingResults(true);
    try {
      const results: ExamResultRow[] = examStudents.map((st) => {
        const row = marksRecords[st.id] || { marks: '0', isAbsent: false, remarks: '' };
        const isAbsent = Boolean(row.isAbsent);
        const marksObtained = isAbsent ? 0 : Number(row.marks) || 0;
        const percentage = selectedExam.totalMarks > 0 ? (marksObtained / selectedExam.totalMarks) * 100 : 0;
        const autoGrading = computeGradeClient(percentage);

        return {
          studentId: st.id,
          subjectId: selectedSubjectId,
          marksObtained,
          isAbsent,
          grade: isAbsent ? 'F' : autoGrading.grade,
          remarks: row.remarks || (isAbsent ? 'Absent' : undefined),
        };
      });

      await apiClient.post('/exams/results', {
        examId: selectedExam.id,
        results,
      });
      toast.success('Marks recorded and auto-graded successfully ✓');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error saving marks');
    } finally {
      setSavingResults(false);
    }
  };

  // View Analytics
  const viewAnalytics = async (exam: Exam) => {
    setShowAnalytics(true);
    setLoadingAnalytics(true);
    try {
      const { data } = await apiClient.get(`/exams/analytics/${exam.id}`);
      setAnalyticsData(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error loading analytics');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Quick fill passing marks
  const quickFillPassing = () => {
    if (!selectedExam) return;
    const map: Record<string, { marks: string; isAbsent: boolean; remarks: string }> = {};
    examStudents.forEach((st) => {
      map[st.id] = {
        marks: String(selectedExam.passingMarks),
        isAbsent: false,
        remarks: 'Satisfactory',
      };
    });
    setMarksRecords(map);
    toast.info('Filled passing marks for all candidates');
  };

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 pb-16">
      {/* ── TOP HEADER ── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-indigo-600/10 via-card to-violet-600/5 p-6 shadow-sm">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-indigo-400">Examination & Grading Engine</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Exams & Results Flow</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Schedule tests, enter subject marks with live grading (A+, A, B, C, D, F), pass/fail ratios, and result card publishing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:brightness-110 transition"
            >
              <Plus size={16} /> + Schedule New Exam
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

      {/* ── SEARCH & EXAM LIST ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Exams List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">All Examinations ({exams.length})</h2>
          </div>

          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search exams..."
              className="w-full rounded-xl border border-border/80 bg-card py-2.5 pl-10 pr-3 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {filteredExams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              No exams found. Click "+ Schedule New Exam" to create one.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
              {filteredExams.map((exam) => {
                const isSelected = selectedExam?.id === exam.id;
                return (
                  <div
                    key={exam.id}
                    onClick={() => setSelectedExam(exam)}
                    className={`cursor-pointer rounded-2xl border p-4 transition space-y-2.5 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-md shadow-indigo-500/10'
                        : 'border-border/80 bg-card hover:border-indigo-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-md">
                          {exam.type || 'EXAM'}
                        </span>
                        <h3 className="font-black text-sm text-foreground mt-1">{exam.name}</h3>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        exam.isPublished
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {exam.isPublished ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </div>

                    <div className="text-[11px] text-muted-foreground flex items-center justify-between border-t border-border/50 pt-2 font-medium">
                      <span>Total: {exam.totalMarks} Marks (Pass: {exam.passingMarks})</span>
                      <span>{new Date(exam.startDate).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void viewAnalytics(exam);
                        }}
                        className="text-indigo-500 hover:underline font-bold inline-flex items-center gap-1"
                      >
                        <BarChart3 size={13} /> View Analytics
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void togglePublish(exam);
                        }}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition ${
                          exam.isPublished
                            ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                        }`}
                      >
                        {exam.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Marks Entry & Results Sheet */}
        <div className="lg:col-span-8 space-y-4">
          {selectedExam ? (
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-foreground">{selectedExam.name}</h2>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      selectedExam.isPublished ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {selectedExam.isPublished ? 'Published Live' : 'Draft / Unpublished'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Target: {selectedExam.section?.class?.name || 'All Classes'} {selectedExam.section?.name ? `(${selectedExam.section.name})` : ''} • Total Marks: {selectedExam.totalMarks} • Passing Marks: {selectedExam.passingMarks}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void viewAnalytics(selectedExam)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition"
                  >
                    <BarChart3 size={14} className="text-indigo-500" /> Analytics
                  </button>
                  <button
                    onClick={() => void togglePublish(selectedExam)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition ${
                      selectedExam.isPublished ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {selectedExam.isPublished ? 'Unpublish Results' : 'Publish Results'}
                  </button>
                </div>
              </div>

              {/* Subject Selector Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 p-3 rounded-2xl border border-border/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">Select Subject:</span>
                  <select
                    value={selectedSubjectId}
                    onChange={e => setSelectedSubjectId(e.target.value)}
                    className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code || 'Core'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={quickFillPassing}
                    className="text-[11px] font-bold text-indigo-500 hover:underline bg-indigo-500/10 px-2.5 py-1 rounded-lg"
                  >
                    Fill Passing Marks ({selectedExam.passingMarks})
                  </button>
                  <button
                    onClick={saveMarks}
                    disabled={savingResults || examStudents.length === 0}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:brightness-110 transition disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} /> {savingResults ? 'Saving...' : 'Save Subject Marks'}
                  </button>
                </div>
              </div>

              {/* Students Marks Entry Table */}
              {loadingResults ? (
                <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
                  Loading subject marks records...
                </div>
              ) : examStudents.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground italic">
                  No enrolled students found for this exam's class / section.
                </div>
              ) : (
                <div className="rounded-2xl border border-border/80 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-black border-b border-border/60">
                      <tr>
                        <th className="p-3">Roll / Adm #</th>
                        <th className="p-3">Candidate Name</th>
                        <th className="p-3">Marks Obtained (Max: {selectedExam.totalMarks})</th>
                        <th className="p-3 text-center">Percentage</th>
                        <th className="p-3 text-center">Grade</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Absent?</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {examStudents.map((st) => {
                        const row = marksRecords[st.id] || { marks: '', isAbsent: false, remarks: '' };
                        const isAbsent = Boolean(row.isAbsent);
                        const numericMarks = isAbsent ? 0 : Number(row.marks || 0);
                        const pct = selectedExam.totalMarks > 0 ? (numericMarks / selectedExam.totalMarks) * 100 : 0;
                        const grading = computeGradeClient(pct);
                        const isPassed = !isAbsent && numericMarks >= selectedExam.passingMarks;

                        return (
                          <tr key={st.id} className="hover:bg-muted/20 transition">
                            <td className="p-3 font-mono font-bold text-foreground">
                              {st.rollNo || st.admissionNo || '—'}
                            </td>
                            <td className="p-3 font-bold text-foreground">
                              {st.name}
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                min="0"
                                max={selectedExam.totalMarks}
                                disabled={isAbsent}
                                value={row.marks}
                                onChange={e => {
                                  const val = e.target.value;
                                  setMarksRecords(prev => ({
                                    ...prev,
                                    [st.id]: {
                                      ...prev[st.id],
                                      marks: val,
                                      isAbsent: false,
                                      remarks: prev[st.id]?.remarks || '',
                                    },
                                  }));
                                }}
                                placeholder="0"
                                className="w-24 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-40"
                              />
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-foreground">
                              {isAbsent ? '0.0%' : `${pct.toFixed(1)}%`}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`font-black text-xs px-2 py-0.5 rounded-md ${
                                isAbsent ? 'bg-rose-500/10 text-rose-500' :
                                grading.grade === 'A+' || grading.grade === 'A' ? 'bg-emerald-500/10 text-emerald-500 font-bold' :
                                grading.grade === 'B' ? 'bg-cyan-500/10 text-cyan-500 font-bold' :
                                grading.grade === 'C' ? 'bg-amber-500/10 text-amber-500 font-bold' :
                                'bg-rose-500/10 text-rose-500'
                              }`}>
                                {isAbsent ? 'F' : grading.grade}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                isAbsent ? 'bg-rose-500 text-white' :
                                isPassed ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              }`}>
                                {isAbsent ? 'ABSENT' : isPassed ? 'PASS' : 'FAIL'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isAbsent}
                                onChange={e => {
                                  const checked = e.target.checked;
                                  setMarksRecords(prev => ({
                                    ...prev,
                                    [st.id]: {
                                      ...prev[st.id],
                                      isAbsent: checked,
                                      marks: checked ? '0' : prev[st.id]?.marks || '0',
                                      remarks: checked ? 'Absent' : '',
                                    },
                                  }));
                                }}
                                className="rounded border-border text-rose-600 focus:ring-rose-500"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border p-16 text-center text-muted-foreground">
              Select an examination from the left list to record marks and view results.
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SCHEDULE EXAM MODAL                                        */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-border/80 bg-card shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 p-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                  <Award size={18} />
                </div>
                <h2 className="font-black text-base text-foreground">Schedule Examination</h2>
              </div>
              <button onClick={() => setShowCreate(false)} className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={createExam} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Exam Title *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. 1st Term Midterms 2026, Final Board Mock"
                  className={inputStyle}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Exam Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className={inputStyle}
                  >
                    {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Target Section</label>
                  <select
                    value={form.sectionId}
                    onChange={e => setForm(f => ({ ...f, sectionId: e.target.value }))}
                    className={inputStyle}
                  >
                    <option value="">All Classes / Schoolwide</option>
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.class?.name} — Section {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Start Date *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">End Date *</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className={inputStyle}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Total Marks Per Subject</label>
                  <input
                    type="number"
                    value={form.totalMarks}
                    onChange={e => setForm(f => ({ ...f, totalMarks: e.target.value }))}
                    className={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Passing Marks</label>
                  <input
                    type="number"
                    value={form.passingMarks}
                    onChange={e => setForm(f => ({ ...f, passingMarks: e.target.value }))}
                    className={inputStyle}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Instructions / Description</label>
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Exam guidelines, venue details, or syllabus scope"
                  className={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={savingExam}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-xs font-black text-white shadow-lg shadow-indigo-500/25 hover:brightness-110 transition disabled:opacity-50"
              >
                {savingExam ? 'Scheduling...' : 'Confirm and Schedule Exam'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* EXAM ANALYTICS MODAL                                       */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAnalytics(false)} />
          <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-border/80 bg-card shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 p-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                  <BarChart3 size={18} />
                </div>
                <h2 className="font-black text-base text-foreground">
                  Exam Performance Analytics — {analyticsData?.exam?.name || 'Overview'}
                </h2>
              </div>
              <button onClick={() => setShowAnalytics(false)} className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {loadingAnalytics ? (
                <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
                  Aggregating class results and computing statistics...
                </div>
              ) : !analyticsData ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No data available for this examination.
                </div>
              ) : (
                <>
                  {/* Summary Tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-border bg-muted/20 p-3.5 text-center">
                      <p className="text-xl font-black text-foreground">{analyticsData.summary?.totalStudents || 0}</p>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Appeared Candidates</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-center">
                      <p className="text-xl font-black text-emerald-500">{analyticsData.summary?.passedStudents || 0}</p>
                      <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Passed Candidates</p>
                    </div>
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-center">
                      <p className="text-xl font-black text-rose-500">{analyticsData.summary?.failedStudents || 0}</p>
                      <p className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Failed Candidates</p>
                    </div>
                    <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-3.5 text-center">
                      <p className="text-xl font-black text-indigo-500">{analyticsData.summary?.passPercentage || 0}%</p>
                      <p className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Overall Pass Rate</p>
                    </div>
                  </div>

                  {/* Top Performers Leaderboard */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5">
                      <Award size={14} className="text-amber-500" /> Top Ranked Students (Class Positions)
                    </h3>
                    <div className="rounded-2xl border border-border/80 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-black border-b border-border/60">
                          <tr>
                            <th className="p-2.5">Position</th>
                            <th className="p-2.5">Candidate</th>
                            <th className="p-2.5">Marks Obtained</th>
                            <th className="p-2.5">Percentage</th>
                            <th className="p-2.5 text-center">Grade</th>
                            <th className="p-2.5 text-center">Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {(analyticsData.students || []).slice(0, 5).map((st: any) => (
                            <tr key={st.studentId} className="hover:bg-muted/20">
                              <td className="p-2.5 font-bold">
                                <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-black ${
                                  st.position === 1 ? 'bg-amber-500 text-white' :
                                  st.position === 2 ? 'bg-slate-300 text-slate-800' :
                                  st.position === 3 ? 'bg-amber-700 text-white' : 'bg-muted text-foreground'
                                }`}>
                                  {st.position}
                                </span>
                              </td>
                              <td className="p-2.5 font-bold text-foreground">
                                {st.name} <span className="text-[10px] font-normal text-muted-foreground">({st.admissionNo})</span>
                              </td>
                              <td className="p-2.5 font-mono font-semibold text-foreground">{st.totalObtained} / {st.maxPossible}</td>
                              <td className="p-2.5 font-mono font-bold text-foreground">{st.percentage}%</td>
                              <td className="p-2.5 text-center font-black text-indigo-500">{st.grade}</td>
                              <td className="p-2.5 text-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.isOverallPass ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                  {st.isOverallPass ? 'PASS' : 'FAIL'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Subject-Wise Pass Ratios */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5">
                      <BookOpen size={14} className="text-indigo-500" /> Subject-wise Performance
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(analyticsData.subjectAnalytics || []).map((sub: any) => (
                        <div key={sub.subjectId} className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 space-y-2">
                          <div className="flex items-center justify-between font-bold text-xs">
                            <span className="text-foreground">{sub.subjectName}</span>
                            <span className="text-indigo-500 font-mono">{sub.passPercentage}% Pass Rate</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${sub.passPercentage}%` }} />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Avg: {sub.averageMarks} Marks</span>
                            <span>Highest: {sub.highestMarks}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
