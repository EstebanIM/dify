'use client'
import { useQuery } from '@tanstack/react-query'
import { useAppContext } from '@/context/app-context'
import { systemFeaturesQueryOptions } from '@/service/system-features'
import { defaultSystemFeatures } from '@/types/feature'

export const DEFAULT_PLATFORM_NAME = 'Dify'

// Precedence (mirrors dify-logo.tsx):
//   enterprise branding.application_title
//   → workspace custom_config.replace_webapp_name (post-login)
//   → systemFeatures.branding.application_title populated from custom_config for pre-login pages
//   → 'Dify'
export default function usePlatformName(): string {
  const { data } = useQuery(systemFeaturesQueryOptions())
  const systemFeatures = data ?? defaultSystemFeatures
  const { currentWorkspace } = useAppContext()

  return (
    (systemFeatures.branding.enabled && systemFeatures.branding.application_title)
    || currentWorkspace.custom_config?.replace_webapp_name
    || systemFeatures.branding.application_title
    || DEFAULT_PLATFORM_NAME
  )
}
