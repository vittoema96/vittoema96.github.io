import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import path from 'node:path'

// Read version from package.json with type safety
interface PackageJson {
    version: string;
    name: string;
    [key: string]: unknown;
}

const packageJson = JSON.parse(
    readFileSync('./package.json', 'utf8')
) as PackageJson;
const version = packageJson.version;

export default defineConfig({
  // Define global constants (injected at build time)
  define: {
    '__APP_VERSION__': JSON.stringify(`v${version}`)
  },

  resolve: {
      alias: {
          '@': path.resolve(__dirname, './src')
      }
  },

  // Development server configuration
  server: {
    port: 3000,
    open: true, // Automatically open browser
    host: true  // Allow external connections
  },

  // Build configuration
  build: {
    sourcemap: true // Helpful for debugging
  },

  // Ensure all assets are copied (only csv is non-standard)
  assetsInclude: ['**/*.csv'],

  // Plugins
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // TODO investigate 'prompt' register type
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,csv,woff,woff2,ttf,eot}'],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Pip-Boy 3000',
        short_name: 'PB3K',
        description: 'A Pip-Boy 3000 companion app for managing your character stats and inventory.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#000000',
        theme_color: '#afff03',
        icons: [
          {
            src: 'img/icons/192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'img/icons/512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ],
        screenshots: [
          {
            src: 'docs/boot_screen.jpg',
            sizes: '1080x1920',
            type: 'image/jpeg',
            label: 'Boot Screen'
          },
          {
            src: 'docs/inv_tab_supplies.jpg',
            sizes: '1080x1920',
            type: 'image/jpeg',
            label: 'Inventory Tab - Supplies'
          },
          {
            src: 'docs/inv_tab_weapons.jpg',
            sizes: '1080x1920',
            type: 'image/jpeg',
            label: 'Inventory Tab - Weapons'
          },
          {
            src: 'docs/stat_tab.jpg',
            sizes: '1080x1920',
            type: 'image/jpeg',
            label: 'Stats Tab'
          },
          {
            src: 'docs/new_vegas_theme.jpg',
            sizes: '1080x1920',
            type: 'image/jpeg',
            label: 'New Vegas Theme'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ]
})
