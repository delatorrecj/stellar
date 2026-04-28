import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['S.svg', 'S-light.svg', 'favicon.svg', 'favicon-32.svg'],
      manifest: {
        name: "Stella — Secure Your Onboarding",
        short_name: "Stella",
        description: "Pre-employment escrow on the Stellar network. Protecting workers and employers through transparent, on-chain fund management.",
        start_url: "/",
        display: "standalone",
        background_color: "#f0f0f0",
        theme_color: "#1A65E0",
        icons: [
          {
            src: "/S.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          },
          {
            src: "/S.svg",
            sizes: "32x32",
            type: "image/svg+xml"
          }
        ]
      }
    })
  ],
  envDir: '../', // Point to the .env in the root
})
