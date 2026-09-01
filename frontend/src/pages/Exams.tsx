import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, FileSpreadsheet, Loader2, Award, Calendar, ClipboardList, X } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

export default function Exams() {
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Marks entry state
  const [activeTab, setActiveTab] = useState<'list' | 'marks'>('list');
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [savingResults, setSavingResults] = useState(false);

  const [form, setForm] = useState({
    name: '',
    type: 'MIDTERM',
    startDate: '',
    endDate: '',
    totalMarks: '100',
    passingMarks: '33',
    sectionId: '',
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      apiClient.get('/exams'),
      apiClient.get('/classes'),
      apiClient.get('/classes/subjects'),
      apiClient.get('/people/students')
    ])
      .then(([exRes, clsRes, subRes, stdRes]) => {
        setExams(exRes.data);
        setClasses(clsRes.data);
        setSubjects(subRes.data);
        setStudents(stdRes.data);
      })
      .catch(() => toast.error('Failed to load exam data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/exams', {
        ...form,
        totalMarks: parseFloat(form.totalMarks),
        passingMarks: parseFloat(form.passingMarks),
        startDate: new Date(form.startDate),
        endDate: new Date(form.endDate),
      });
      toast.success('Exam scheduled successfully!');
      setShowAdd(false);
      setForm({
        name: '',
        type: 'MIDTERM',
        startDate: '',
        endDate: '',
        totalMarks: '100',
        passingMarks: '33',
        sectionId: '',
      });
      fetchData();
    } catch {
      toast.error('Failed to create exam');
    } finally { setSaving(false); }
  };

  // Load results grid
  const loadResultsGrid = () => {
    if (!selectedExam || !selectedSubject) return;
    setLoadingResults(true);
    apiClient.get(`/exams/results?examId=${selectedExam.id}&subjectId=${selectedSubject}`)
      .then(res => {
        // Map student list to results. If no result exists in DB, default to 0
        const examResults = res.data;
        
        // Filter students in the target exam section
        const targetStudents = students.filter(s => s.sectionId === selectedExam.sectionId);
        
        const mapped = targetStudents.map(student => {
          const match = examResults.find((r: any) => r.studentId === student.id);
          return {
            studentId: student.id,
            name: student.name,
            rollNo: student.rollNo,
            marksObtained: match ? match.marksObtained : '',
            grade: match ? match.grade : '',
            remarks: match ? match.remarks : '',
          };
        });
        setRecords(mapped);
      })
      .catch(() => toast.error('Failed to load marks entry grid'))
      .finally(() => setLoadingResults(false));
  };

  useEffect(() => {
    loadResultsGrid();
  }, [selectedExam, selectedSubject]);

  const handleRecordMarks = async () => {
    setSavingResults(true);
    try {
      const payload = {
        examId: selectedExam.id,
        subjectId: selectedSubject,
        results: records.map(r => ({
          studentId: r.studentId,
          marksObtained: parseFloat(r.marksObtained) || 0,
          remarks: r.remarks || '',
        }))
      };
      await apiClient.post('/exams/results', payload);
      toast.success('Marks recorded successfully!');
      setActiveTab('list');
    } catch {
      toast.error('Failed to save marks');
    } finally { setSavingResults(false); }
  };

  const sections = classes.flatMap((c: any) => (c.sections || []).map((s: any) => ({ ...s, className: c.name })));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">Exams & Grading</h1>
          <p className="text-muted-foreground text-sm mt-1">Schedule tests, record marks, and publish results</p>
        </div>
        {activeTab === 'list' ? (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 hover:scale-102 active:scale-98 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={16} /> Schedule Exam
          </button>
        ) : (
          <button onClick={() => { setActiveTab('list'); setSelectedExam(null); setSelectedSubject(''); }}
            className="px-4 py-2.5 rounded-xl border border-border text-sm hover:bg-accent font-semibold transition-all"
          >
            Back to Exams
          </button>
        )}
      </div>

      {activeTab === 'list' && (
        <>
          {loading ? (
            <div className="flex justify-center items-center h-48"><Loader2 size={32} className="animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {exams.map((ex, idx) => (
                <motion.div
                  key={ex.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-card border border-border hover:border-primary/20 rounded-2xl p-6 hover:shadow-lg transition-all relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-500/10 text-violet-500">
                        {ex.type}
                      </span>
                      {ex.section && (
                        <span className="px-2 py-0.5 rounded bg-accent text-[11px] font-semibold text-accent-foreground">
                          {ex.section.class?.name} · {ex.section.name}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{ex.name}</h3>
                    <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        <span>{new Date(ex.startDate).toLocaleDateString()} - {new Date(ex.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award size={13} />
                        <span>Passing: {ex.passingMarks} / {ex.totalMarks} Marks</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { setSelectedExam(ex); setActiveTab('marks'); }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-all mt-2"
                  >
                    <FileSpreadsheet size={14} /> Enter Student Marks
                  </button>
                </motion.div>
              ))}

              {exams.length === 0 && (
                <div className="col-span-full bg-card border border-border rounded-2xl p-16 text-center text-muted-foreground">
                  <ClipboardList size={48} className="mx-auto mb-4 opacity-25" />
                  <p className="font-bold">No exams scheduled yet</p>
                  <p className="text-xs mt-1">Add exam schedules to manage marks entry.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'marks' && selectedExam && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Exam</p>
              <h2 className="text-xl font-black text-foreground">{selectedExam.name}</h2>
              <p className="text-xs text-muted-foreground mt-1">Section: {selectedExam.section?.class?.name} › {selectedExam.section?.name}</p>
            </div>
            <div className="w-full sm:w-auto">
              <label className="text-xs font-bold text-foreground">Select Subject</label>
              <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
                className="mt-1 w-full sm:w-56 px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">-- Choose Subject --</option>
                {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {selectedSubject && (
            <>
              {loadingResults ? (
                <div className="flex justify-center items-center h-48"><Loader2 size={32} className="animate-spin text-primary" /></div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-border bg-accent/40 text-xs font-bold text-muted-foreground uppercase">
                            <th className="px-5 py-3">Roll No</th>
                            <th className="px-5 py-3">Student Name</th>
                            <th className="px-5 py-3 w-40">Marks Obtained</th>
                            <th className="px-5 py-3">Remarks / Feedback</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {records.map((r, idx) => (
                            <tr key={r.studentId} className="hover:bg-accent/10 transition-colors">
                              <td className="px-5 py-3 text-sm font-semibold text-foreground">{r.rollNo || '—'}</td>
                              <td className="px-5 py-3 text-sm font-bold text-foreground">{r.name}</td>
                              <td className="px-5 py-3">
                                <input
                                  type="number"
                                  value={r.marksObtained}
                                  onChange={e => setRecords(prev => prev.map((item, i) => i === idx ? { ...item, marksObtained: e.target.value } : item))}
                                  max={selectedExam.totalMarks}
                                  placeholder={`Max ${selectedExam.totalMarks}`}
                                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                              </td>
                              <td className="px-5 py-3">
                                <input
                                  type="text"
                                  value={r.remarks}
                                  onChange={e => setRecords(prev => prev.map((item, i) => i === idx ? { ...item, remarks: e.target.value } : item))}
                                  placeholder="Well performed"
                                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button onClick={handleRecordMarks} disabled={savingResults}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 active:scale-98 transition-all shadow-lg shadow-primary/20"
                    >
                      {savingResults ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      {savingResults ? 'Saving...' : 'Save Grades'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {!selectedSubject && (
            <div className="bg-card border border-border rounded-2xl p-16 text-center text-muted-foreground">
              <ClipboardList size={48} className="mx-auto mb-4 opacity-25" />
              <p className="font-bold">Select a subject to enter marks</p>
              <p className="text-xs mt-1">Choose a subject from the drop-down menu above to populate the student grading list.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="bg-card border border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-5 border-b border-border/60 pb-3">
                <h2 className="text-lg font-black text-foreground">Schedule New Exam</h2>
                <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground">Exam Name</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="First Term Exams 2026" required
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground">Exam Type</label>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="MIDTERM">Midterm</option>
                      <option value="FINAL">Final Exam</option>
                      <option value="QUIZ">Quiz / Test</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Target Section</label>
                    <select value={form.sectionId} onChange={e => setForm(p => ({ ...p, sectionId: e.target.value }))} required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                      <option value="">-- Select Section --</option>
                      {sections.map((s: any) => <option key={s.id} value={s.id}>{s.className} › {s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Total Marks</label>
                    <input type="number" value={form.totalMarks} onChange={e => setForm(p => ({ ...p, totalMarks: e.target.value }))}
                      placeholder="100" required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Passing Marks</label>
                    <input type="number" value={form.passingMarks} onChange={e => setForm(p => ({ ...p, passingMarks: e.target.value }))}
                      placeholder="33" required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Start Date</label>
                    <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">End Date</label>
                    <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} required
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                </div>
                <div className="pt-4">
                  <button type="submit" disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-70 shadow-lg shadow-primary/10">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {saving ? 'Scheduling...' : 'Schedule Exam'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
