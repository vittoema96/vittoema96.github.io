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
    // host: true  // Uncomment to expose on LAN (e.g. for mobile testing)
    //              ⚠️ CVE-2026-39363/39364/39365 affect Vite when host is enabled.
    //              Only enable on trusted networks. Fixed in Vite 8.0.5 (blocked by vite-plugin-pwa ≤1.x).
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
        cleanupOutdatedCaches: true,
        // Ignore dev-only resources to reduce console warnings
        navigateFallbackDenylist: [/^\/@vite/, /^\/@react-refresh/, /^\/node_modules/]
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
            src: 'docs/boot_screen.png',
            sizes: '1080x1920',
            type: 'image/jpeg',
            label: 'Boot Screen'
          },
          {
            src: 'docs/stat_tab.jpg',
            sizes: '1080x1920',
            type: 'image/jpeg',
            label: 'Stats Tab - SPECIAL and Damage Resistant'
          },
          {
            src: 'docs/stat_tab2.jpg',
            sizes: '1080x1920',
            type: 'image/jpeg',
            label: 'Stats Tab - Skills'
          },
          {
            src: 'docs/inv_tab_weapons.jpg',
            sizes: '1080x1920',
            type: 'image/jpeg',
            label: 'Inventory Tab - Weapons'
          },
          {
            src: 'docs/inv_tab_apparel.jpg',
            sizes: '1080x1920',
            type: 'image/jpeg',
            label: 'Inventory Tab - Apparel'
          },
          {
            src: 'docs/data_tab.jpg',
            sizes: '1080x1920',
            type: 'image/jpeg',
            label: 'Data Tab - Character Info'
          },
          {
            src: 'docs/data_tab2.jpg',
            sizes: '1080x1920',
            type: 'image/jpeg',
            label: 'Data Tab - Traits and Perks'
          },
          {
            src: 'docs/map_tab.jpg',
            sizes: '1080x1920',
            type: 'image/jpeg',
            label: 'Map Tab'
          },
          {
            src: 'docs/settings_tab.jpg',
            sizes: '1080x1920',
            type: 'image/jpeg',
            label: 'Settings Tab'
          },
          {
            src: 'docs/new_vegas_theme.jpg',
            sizes: '1080x1920',
            type: 'image/jpeg',
            label: 'New Vegas Theme'
          },
          {
            src: 'docs/old_world_blues_theme.jpg',
            sizes: '1080x1920',
            type: 'image/jpeg',
            label: 'Old World Blues Theme'
          }
        ]
      },
      devOptions: {
        enabled: true, // Enable service worker in development to test PWA features
        type: 'module'
      }
    })
  ]
})
