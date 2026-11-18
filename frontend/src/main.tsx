import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installHoverSound } from './sound'

installHoverSound()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Dev-only font playground (try fonts live). Vite drops this block from production builds.
if (import.meta.env.DEV) {
  void Promise.all([import('./dev/FontLab'), import('./dev/fontlab.css')]).then(([{ default: FontLab }]) => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    createRoot(host).render(<FontLab />)
  })
}
