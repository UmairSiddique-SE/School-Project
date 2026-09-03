import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Width preset. The default is intentionally wide for ERP forms. */
  maxWidth?: string;
  /** Whether clicking the backdrop closes the modal. */
  closeOnBackdrop?: boolean;
}

/**
 * Shared ERP dialog. It is intentionally wide and tall so Add/Edit screens
 * feel like dedicated application forms instead of tiny popups.
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-6xl',
  closeOnBackdrop = true,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
          className="flex items-center justify-center p-2 sm:p-4 bg-slate-900/55 backdrop-blur-[2px]"
          onClick={closeOnBackdrop ? onClose : undefined}
        >
          <motion.div
            key="modal-content"
            initial={{ opacity: 0, y: 14, scale: .985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: .985 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={`relative bg-card border border-slate-200 rounded-xl shadow-2xl w-full ${maxWidth} max-h-[calc(100dvh-1rem)] sm:max-h-[94vh] overflow-y-auto overscroll-contain`}
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

/** Screenshot-inspired blue form header used consistently across Add/Edit screens. */
export const ModalHeader: React.FC<{
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onClose: () => void;
}> = ({ icon, title, subtitle, onClose }) => (
  <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-5 sm:px-7 py-4 sm:py-5 border-b border-blue-700/20 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white shadow-md">
    <div className="flex items-center gap-3 min-w-0">
      {icon && (
        <div className="h-10 w-10 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <h2 className="text-lg sm:text-xl font-extrabold truncate">{title}</h2>
        {subtitle && <p className="text-xs text-blue-100 mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
    <button
      onClick={onClose}
      aria-label="Close"
      className="p-2 rounded-lg text-white/85 hover:text-white hover:bg-white/15 transition-all shrink-0"
    >
      <X size={22} />
    </button>
  </div>
);

export default Modal;
