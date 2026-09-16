import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './theme-overrides.css'
import './register-vip.css'
import './register-vip-next.css'
import './premium-school-panel.css'
import App from './App.tsx'
import StudentCredentialsBridge from './components/students/StudentCredentialsBridge'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <StudentCredentialsBridge />
  </StrictMode>,
)
