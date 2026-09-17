import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './theme-overrides.css'
import './premium-ui.css'
import './premium-school-panel.css'
import './school-panel-consistency.css'
import './student-academic-history.css'
import './student-profile-legacy.css'
import App from './App.tsx'
import StudentCredentialsBridge from './components/students/StudentCredentialsBridge'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <StudentCredentialsBridge />
  </StrictMode>,
)
