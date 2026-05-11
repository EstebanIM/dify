'use client'

import { useEffect } from 'react'
import { setPlatformName } from '@/i18n-config/platform-name-store'
import usePlatformName from '@/hooks/use-platform-name'

// Keeps the i18next postProcessor's platform-name store in sync with the React
// hook so that translations containing {{appName}} render with the current
// tenant-customised value, without every caller having to pass `appName` to t().
export function PlatformNameSync() {
  const appName = usePlatformName()
  useEffect(() => {
    setPlatformName(appName)
  }, [appName])
  return null
}
