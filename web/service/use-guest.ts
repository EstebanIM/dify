import { useQuery } from '@tanstack/react-query'
import { get } from './base'

export type GuestAppCard = {
  id: string
  installed_app_id: string | null
  name: string
  mode: string
  icon_type: string | null
  icon: string | null
  icon_background: string | null
  description: string
  updated_at: string | null
}

export type GuestAppsResponse = {
  apps: GuestAppCard[]
}

export const fetchGuestApps = () => {
  return get<GuestAppsResponse>('/guest/apps')
}

export const useGuestApps = () => {
  return useQuery({
    queryKey: ['guest', 'apps'],
    queryFn: fetchGuestApps,
  })
}
