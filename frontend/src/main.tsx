import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './theme-overrides.css'
import App from './App.tsx'
import StudentCredentialsBridge from './components/students/StudentCredentialsBridge'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <StudentCredentialsBridge />
  </StrictMode>,
)
