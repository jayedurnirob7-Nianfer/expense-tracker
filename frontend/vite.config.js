import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Nirob Expense Ledger',
        short_name: 'Nirob Ledger',
        description: 'Intelligent Financial Wealth Control — Track essential obligations, monitor multi-fund income, and visualize your financial growth.',
        theme_color: '#0f172a',
        background_color: '#070d18',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '48x48 72x72 96x96 128x128 192x192 256x256 512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'favicon.svg',
            sizes: '48x48 72x72 96x96 128x128 192x192 256x256 512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
})

