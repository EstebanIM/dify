'use client'
import { useAppContext } from '@/context/app-context'
import { useGlobalPublicStore } from '@/context/global-public-context'

export const DEFAULT_PLATFORM_NAME = 'Dify'

// Precedence (mirrors dify-logo.tsx):
//   enterprise branding.application_title
//   → workspace custom_config.replace_webapp_name (post-login)
//   → systemFeatures.branding.application_title populated from custom_config for pre-login pages
//   → 'Dify'
export default function usePlatformName(): string {
  const systemFeatures = useGlobalPublicStore(s => s.systemFeatures)
  const { currentWorkspace } = useAppContext()

  return (
    (systemFeatures.branding.enabled && systemFeatures.branding.application_title)
    || currentWorkspace.custom_config?.replace_webapp_name
    || systemFeatures.branding.application_title
    || DEFAULT_PLATFORM_NAME
  )
}
