import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { StellarProvider } from './hooks/useStellar.tsx'
import { OnboardingProvider } from './hooks/useOnboarding.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StellarProvider>
      <OnboardingProvider>
        <App />
        {/* Vercel Analytics — tracks page views & unique visitors */}
        <Analytics />
        {/* Vercel Speed Insights — tracks Core Web Vitals (LCP, CLS, FID) */}
        <SpeedInsights />
      </OnboardingProvider>
    </StellarProvider>
  </StrictMode>,
)

