import { useEffect, useState } from 'react';
import StudentCredentialsDialog, { type StudentCredentials } from './StudentCredentialsDialog';

type CredentialEventDetail = StudentCredentials & { studentName?: string };

export default function StudentCredentialsBridge() {
  const [credentials, setCredentials] = useState<StudentCredentials | null>(null);

  useEffect(() => {
    const handleCredentials = (event: Event) => {
      const detail = (event as CustomEvent<CredentialEventDetail>).detail;
      if (detail?.loginId && detail?.password) {
        setCredentials({
          loginId: detail.loginId,
          password: detail.password,
          studentName: detail.studentName,
        });
      }
    };

    window.addEventListener('edusphere:student-credentials', handleCredentials);
    return () => window.removeEventListener('edusphere:student-credentials', handleCredentials);
  }, []);

  return <StudentCredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />;
}
