import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'

// Synchronously apply persisted theme (avoid flash)
try {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') document.documentElement.classList.add('dark');
  else if (saved === 'light') document.documentElement.classList.remove('dark');
} catch (e) {
  // ignore
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
