import { Navigate } from "react-router-dom";

interface SchoolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Landing-page School Login action redirects directly to the real school-login
 * gateway. School discovery is handled by /school-login.
 */
export default function SchoolSearchModal({ isOpen }: SchoolSearchModalProps) {
  if (!isOpen) return null;
  return <Navigate to="/school-login" replace />;
}
