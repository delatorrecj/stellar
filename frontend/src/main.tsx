import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { StellarProvider } from './hooks/useStellar.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StellarProvider>
      <App />
    </StellarProvider>
  </StrictMode>,
)
