import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function TeacherLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const link = ({ isActive }: { isActive: boolean }) => `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`;
  return <div className="min-h-screen bg-background"><header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur"><div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4"><div><p className="font-black text-lg">EduSphere <span className="text-primary">Teacher</span></p><p className="text-[11px] text-muted-foreground">{user?.schoolName || 'School Portal'}</p></div><div className="flex items-center gap-2"><div className="hidden sm:flex items-center gap-2 text-xs font-semibold"><UserRound size={15}/>{user?.name || 'Teacher'}</div><button onClick={() => { logout(); navigate('/school-login'); }} className="p-2 rounded-lg hover:bg-accent" title="Logout"><LogOut size={17}/></button></div></div></header><div className="max-w-7xl mx-auto px-4 py-4"><nav className="flex flex-wrap gap-2 mb-6"><NavLink to="." end className={link}><BookOpen size={15}/>My Classes</NavLink><NavLink to="attendance" className={link}><CheckCircle size={15}/>Attendance</NavLink></nav><Outlet/></div></div>;
}
