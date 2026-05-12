'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import Loading from '@/app/components/base/loading'
import { useAppContext } from '@/context/app-context'
import { usePathname, useRouter } from '@/next/navigation'

const datasetOperatorRedirectRoutes = ['/apps', '/app', '/explore', '/tools'] as const

// Guest accounts are only allowed inside /home, /account, /explore/installed (chat reuse),
// and the auth-related paths. Anything else redirects to /home.
const guestAllowedPrefixes = ['/home', '/account', '/explore/installed', '/signin', '/activate', '/forgot-password'] as const

const isPathUnderRoute = (pathname: string, route: string) => pathname === route || pathname.startsWith(`${route}/`)

export default function RoleRouteGuard({ children }: { children: ReactNode }) {
  const { isCurrentWorkspaceDatasetOperator, isCurrentWorkspaceGuest, isLoadingCurrentWorkspace } = useAppContext()
  const pathname = usePathname()
  const router = useRouter()

  const datasetOperatorGuarded = datasetOperatorRedirectRoutes.some(route => isPathUnderRoute(pathname, route))
  const guestAllowed = guestAllowedPrefixes.some(prefix => isPathUnderRoute(pathname, prefix))
  const guestGuarded = isCurrentWorkspaceGuest && !guestAllowed && !isLoadingCurrentWorkspace

  const shouldGuardRoute = datasetOperatorGuarded || (isCurrentWorkspaceGuest && !guestAllowed)
  const shouldRedirectDatasetOperator = datasetOperatorGuarded && !isLoadingCurrentWorkspace && isCurrentWorkspaceDatasetOperator
  const shouldRedirectGuest = guestGuarded

  useEffect(() => {
    if (shouldRedirectDatasetOperator)
      router.replace('/datasets')
    else if (shouldRedirectGuest)
      router.replace('/home')
  }, [shouldRedirectDatasetOperator, shouldRedirectGuest, router])

  // Block rendering only for guarded routes to avoid permission flicker.
  if (shouldGuardRoute && isLoadingCurrentWorkspace)
    return <Loading type="app" />

  if (shouldRedirectDatasetOperator || shouldRedirectGuest)
    return null

  return <>{children}</>
}
