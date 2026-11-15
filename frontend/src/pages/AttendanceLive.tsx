import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, RefreshCw, Save, Users, Calendar, CheckSquare, Clock3, AlertCircle } from 'lucide-react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';

type Section={id:string;name:string;class?:{name?:string}};
type Row={studentId:string;name:string;rollNo?:string|null;admissionNo?:string|null;status:'PRESENT'|'ABSENT'|'LATE'|'LEAVE';remarks?:string};
const statuses=['PRESENT','ABSENT','LATE','LEAVE'] as const;

export default function AttendanceLive(){
 const [sections,setSections]=useState<Section[]>([]),[sectionId,setSectionId]=useState(''),[date,setDate]=useState(new Date().toISOString().slice(0,10)),[rows,setRows]=useState<Row[]>([]),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
 const loadSections=async()=>{try{const {data}=await apiClient.get('/classes/sections');const list=Array.isArray(data)?data:[];setSections(list);if(!sectionId&&list[0])setSectionId(list[0].id)}catch(e:any){toast.error(e?.response?.data?.message||'Unable to load sections')}finally{setLoading(false)}};
 const load=async()=>{if(!sectionId)return;try{setLoading(true);const {data}=await apiClient.get('/attendance',{params:{sectionId,date}});setRows(Array.isArray(data?.students)?data.students.map((student:Row)=>({...student,status:data.records?.find((record:any)=>record.studentId===student.studentId)?.status||student.status,remarks:data.records?.find((record:any)=>record.studentId===student.studentId)?.remarks||student.remarks||''})):[])}catch(e:any){toast.error(e?.response?.data?.message||'Unable to load attendance');setRows([])}finally{setLoading(false)}};
 useEffect(()=>{loadSections()},[]); useEffect(()=>{if(sectionId)load()},[sectionId,date]);
 const setAll=(status:Row['status'])=>setRows(r=>r.map(x=>({...x,status})));
 const save=async()=>{if(!sectionId||!rows.length)return;setSaving(true);try{await apiClient.post('/attendance',{sectionId,date,records:rows.map(r=>({studentId:r.studentId,status:r.status,remarks:r.remarks||''}))});toast.success('Attendance saved successfully')}catch(e:any){toast.error(e?.response?.data?.message||'Failed to save attendance')}finally{setSaving(false)}};
 const counts=useMemo(()=>({present:rows.filter(r=>r.status==='PRESENT').length,absent:rows.filter(r=>r.status==='ABSENT').length,late:rows.filter(r=>r.status==='LATE').length,leave:rows.filter(r=>r.status==='LEAVE').length}),[rows]);
 const rate = rows.length ? Math.round((counts.present / rows.length) * 100) : 0;

 if(loading&&!rows.length)return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary"/></div>;

 return (
  <div className="space-y-6 pb-12 mx-auto max-w-screen-2xl">
    {/* Header Banner */}
    <div className="relative overflow-hidden rounded-[28px] border border-border bg-gradient-to-br from-cyan-500/10 via-card to-blue-500/10 p-6 sm:p-8 shadow-sm">
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-primary">
            Academic Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 text-foreground tracking-tight">Student Attendance Roll Call</h1>
          <p className="text-sm text-muted-foreground mt-1">Live daily attendance recording synchronized directly with student database records.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={load} className="rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-2 shadow-sm">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={save} disabled={saving||!rows.length} className="rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 text-white px-5 py-2.5 text-xs font-black shadow-lg shadow-cyan-600/20 hover:brightness-110 transition disabled:opacity-60 flex items-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>
    </div>

    {/* Controls & Metrics Strip */}
    <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3">
      <div className="lg:col-span-2">
        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">Select Section</label>
        <select value={sectionId} onChange={e=>setSectionId(e.target.value)} className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">Select section</option>
          {sections.map(s=><option key={s.id} value={s.id}>{s.class?.name?`${s.class.name} • `:''}{s.name}</option>)}
        </select>
      </div>

      <div>
        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">Date</label>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/20"/>
      </div>

      <div className="flex items-end">
        <button onClick={()=>setAll('PRESENT')} className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 py-2.5 text-xs font-black transition-colors flex items-center justify-center gap-1.5 shadow-sm">
          <CheckSquare size={14} /> Mark All Present
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-3 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Present / Absent</p>
          <p className="text-sm font-black text-foreground mt-0.5"><span className="text-emerald-500">{counts.present}</span> / <span className="text-rose-500">{counts.absent}</span></p>
        </div>
        <span className="text-xs font-black text-primary">{rate}%</span>
      </div>

      <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
        <p className="text-[10px] font-bold text-muted-foreground uppercase">Late / Leave</p>
        <p className="text-sm font-black text-foreground mt-0.5"><span className="text-amber-500">{counts.late}</span> / <span className="text-sky-500">{counts.leave}</span></p>
      </div>
    </div>

    {/* Student Table */}
    <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="p-4 sm:p-5 border-b border-border bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2 font-black text-sm text-foreground">
          <Users size={17} className="text-primary"/> Class Roll ({rows.length} Enrolled Students)
        </div>
        <span className="text-xs text-muted-foreground font-semibold">Instant status toggle</span>
      </div>

      {rows.length ? (
        <div className="divide-y divide-border">
          {rows.map((r) => (
            <div key={r.studentId} className="p-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-muted/30">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center font-black text-xs ${
                  r.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                  r.status === 'ABSENT' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                  r.status === 'LATE' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                  'bg-sky-500/10 text-sky-500 border border-sky-500/20'
                }`}>
                  {r.status === 'PRESENT' ? 'P' : r.status === 'ABSENT' ? 'A' : r.status === 'LATE' ? 'L' : 'LV'}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Roll: <span className="font-semibold text-foreground">{r.rollNo || '—'}</span> · Admission: <span className="font-semibold text-foreground">{r.admissionNo || '—'}</span></p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {statuses.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRows((p) => p.map((x) => x.studentId === r.studentId ? { ...x, status: s } : x))}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-sm ${
                      r.status === s
                        ? s === 'PRESENT' ? 'bg-emerald-600 text-white shadow-emerald-600/30' :
                          s === 'ABSENT' ? 'bg-rose-600 text-white shadow-rose-600/30' :
                          s === 'LATE' ? 'bg-amber-600 text-white shadow-amber-600/30' :
                          'bg-sky-600 text-white shadow-sky-600/30'
                        : 'border border-border bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {s}
                  </button>
                ))}
                <input
                  value={r.remarks || ''}
                  onChange={(e) => setRows((p) => p.map((x) => x.studentId === r.studentId ? { ...x, remarks: e.target.value } : x))}
                  placeholder="Notes / Reason"
                  className="w-full sm:w-44 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 text-center text-sm text-muted-foreground">
          <CheckCircle2 className="mx-auto mb-3 text-muted-foreground/40" size={36} />
          <p className="font-bold text-foreground">No students found</p>
          <p className="text-xs text-muted-foreground mt-1">Please select an active academic section to mark attendance.</p>
        </div>
      )}
    </div>
  </div>
 );
}
