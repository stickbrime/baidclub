import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import { TRPCProvider } from "@/providers/trpc"
import App from './App.tsx'

// Derive the router basename so the single "/" route matches both at the root
// (local dev/preview) and under the /baidclub/ subpath on GitHub Pages.
function getBasename(): string {
  const segments = window.location.pathname.split('/').filter(Boolean)
  return segments.length ? '/' + segments[0] : '/'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={getBasename()}>
      <TRPCProvider>
        <App />
      </TRPCProvider>
    </BrowserRouter>
  </StrictMode>,
)
