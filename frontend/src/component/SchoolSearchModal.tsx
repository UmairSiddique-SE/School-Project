import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface SchoolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * The landing-page School Login action now opens the real school-login gateway.
 * School discovery itself is handled by /school-login, which reads active
 * registered schools from the public backend endpoint.
 */
export default function SchoolSearchModal({ isOpen, onClose }: SchoolSearchModalProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    onClose();
    navigate("/school-login");
  }, [isOpen, navigate, onClose]);

  return null;
}
