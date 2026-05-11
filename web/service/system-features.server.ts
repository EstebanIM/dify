import type { SystemFeatures } from '@/types/feature'
import { PUBLIC_API_PREFIX } from '@/config'
import { defaultSystemFeatures } from '@/types/feature'

// In Docker, the API container is not reachable on localhost — set
// INTERNAL_API_BASE_URL (e.g. "http://api:5001") on the web service to enable
// server-side metadata personalization. Falls back to PUBLIC_API_PREFIX when
// unset (CSR-only setups or local dev where the API is on localhost).
function getServerApiUrl(): string {
  const internal = process.env.INTERNAL_API_BASE_URL
  if (internal)
    return `${internal.replace(/\/$/, '')}/api`
  return PUBLIC_API_PREFIX
}

// Server-side fetcher for system features. Used by Next.js metadata helpers
// (manifest, generateMetadata) where React Query is not available.
// The /api/system-features endpoint is unauthenticated and returns the same
// payload the React Query consumer reads on the client.
export async function fetchSystemFeaturesServer(): Promise<SystemFeatures> {
  try {
    const res = await fetch(`${getServerApiUrl()}/system-features`, {
      // Short cache: branding can change at any time but rebuilding metadata
      // on every request would be wasteful for traffic spikes.
      next: { revalidate: 60 },
    })
    if (!res.ok)
      return defaultSystemFeatures
    return await res.json() as SystemFeatures
  }
  catch (err) {
    console.error('[system-features.server] fetch failed, using defaults', err)
    return defaultSystemFeatures
  }
}

export async function fetchPlatformNameServer(): Promise<string> {
  const features = await fetchSystemFeaturesServer()
  return features.branding?.application_title || 'Dify'
}
