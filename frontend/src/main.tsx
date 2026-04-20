import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { StellarProvider } from './hooks/useStellar.tsx'
import { OnboardingProvider } from './hooks/useOnboarding.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StellarProvider>
      <OnboardingProvider>
        <App />
      </OnboardingProvider>
    </StellarProvider>
  </StrictMode>,
)
