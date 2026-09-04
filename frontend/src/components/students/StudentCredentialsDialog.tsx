import React, { useState } from 'react';
import { Check, CheckCircle, Copy, KeyRound, ShieldCheck, UserRound, X } from 'lucide-react';
import Modal, { ModalHeader } from '@/component/ui/Modal';

export type StudentCredentials = {
  loginId: string;
  password: string;
  studentName?: string;
};

type Props = {
  credentials: StudentCredentials | null;
  onClose: () => void;
};

export default function StudentCredentialsDialog({ credentials, onClose }: Props) {
  const [copied, setCopied] = useState<'loginId' | 'password' | 'all' | null>(null);

  if (!credentials) return null;

  const copy = async (value: string, type: 'loginId' | 'password' | 'all') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} maxWidth="max-w-lg">
      <ModalHeader
        icon={<ShieldCheck size={17} className="text-emerald-400" />}
        title="Student Portal Credentials"
        onClose={onClose}
      />

      <div className="p-6 space-y-5">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex gap-3">
          <CheckCircle className="text-emerald-400 shrink-0" size={20} />
          <div>
            <p className="text-sm font-bold text-foreground">Student account created successfully</p>
            <p className="text-xs text-muted-foreground mt-1">
              {credentials.studentName || 'Student'} can now use these credentials to access the Student Portal.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card/70 overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <UserRound size={17} className="text-primary" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Login ID</p>
              <p className="font-mono text-sm font-bold text-foreground break-all mt-1">{credentials.loginId}</p>
            </div>
            <button
              type="button"
              onClick={() => copy(credentials.loginId, 'loginId')}
              className="ml-auto rounded-lg border border-border p-2 hover:bg-muted transition-colors"
              title="Copy Login ID"
            >
              {copied === 'loginId' ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
            </button>
          </div>

          <div className="p-4 flex items-center gap-3">
            <KeyRound size={17} className="text-amber-400" />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Temporary Display of Generated Password</p>
              <p className="font-mono text-sm font-bold text-foreground tracking-wider mt-1 break-all">{credentials.password}</p>
            </div>
            <button
              type="button"
              onClick={() => copy(credentials.password, 'password')}
              className="ml-auto rounded-lg border border-border p-2 hover:bg-muted transition-colors shrink-0"
              title="Copy password"
            >
              {copied === 'password' ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground leading-relaxed">
          <strong className="text-amber-300">Important:</strong> This password is shown only after admission. Save it securely or provide it to the student. The system stores only a secure password hash, so the original password cannot be recovered later. Students cannot change their password; School Admin must handle any future reset.
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => copy(`Login ID: ${credentials.loginId}\nPassword: ${credentials.password}`, 'all')}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-bold hover:bg-muted transition-colors"
          >
            {copied === 'all' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            Copy Credentials
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Check size={14} /> Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
