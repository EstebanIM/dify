import type { MetadataRoute } from 'next'
import { fetchPlatformNameServer } from '@/service/system-features.server'

// Dynamic PWA manifest. Replaces the static web/public/manifest.json so the
// installed-app name follows the tenant's "Change Platform Name" setting.
// Next.js serves this at /manifest.webmanifest.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const name = await fetchPlatformNameServer()
  return {
    name,
    short_name: name,
    description: 'Build Production Ready Agentic AI Solutions',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-256x256.png',
        sizes: '256x256',
        type: 'image/png',
      },
      {
        src: '/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    theme_color: '#1C64F2',
    background_color: '#ffffff',
    display: 'standalone',
    scope: '/',
    start_url: '/',
    orientation: 'portrait-primary',
    categories: ['productivity', 'utilities', 'developer'],
    lang: 'en-US',
    dir: 'ltr',
    prefer_related_applications: false,
    shortcuts: [
      {
        name: 'Apps',
        short_name: 'Apps',
        url: '/apps',
        icons: [{ src: '/icon-96x96.png', sizes: '96x96' }],
      },
      {
        name: 'Datasets',
        short_name: 'Datasets',
        url: '/datasets',
        icons: [{ src: '/icon-96x96.png', sizes: '96x96' }],
      },
    ],
  }
}
