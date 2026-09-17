import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  closeOnBackdrop?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  open,
  onClose,
  children,
  maxWidth = 'max-w-2xl',
  closeOnBackdrop = true,
}) => {
  const visible = isOpen ?? open ?? false;

  useEffect(() => {
    if (visible) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, onClose]);

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          key="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
          className="flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
          onClick={closeOnBackdrop ? onClose : undefined}
        >
          <motion.div
            key="modal-content"
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className={`relative bg-card border border-border rounded-2xl sm:rounded-3xl shadow-2xl w-full ${maxWidth} max-h-[calc(100dvh-1.5rem)] sm:max-h-[92vh] overflow-y-auto overscroll-contain`}
            onClick={e => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export const ModalHeader: React.FC<{
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onClose: () => void;
}> = ({ icon, title, subtitle, onClose }) => (
  <div className="flex items-center justify-between gap-3 p-4 sm:p-6 border-b border-border">
    <div className="flex items-center gap-3">
      {icon && (
        <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          {icon}
        </div>
      )}
      <div>
        <h2 className="text-base sm:text-lg font-black text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
      <X size={18} />
    </button>
  </div>
);

export default Modal;
