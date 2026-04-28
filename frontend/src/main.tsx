import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { inject } from '@vercel/analytics'
import { StellarProvider } from './hooks/useStellar.tsx'
import { OnboardingProvider } from './hooks/useOnboarding.tsx'
import './index.css'
import App from './App.tsx'

// Vercel Analytics — tracks page views & Web Vitals automatically
inject()


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StellarProvider>
      <OnboardingProvider>
        <App />
      </OnboardingProvider>
    </StellarProvider>
  </StrictMode>,
)
