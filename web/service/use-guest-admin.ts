import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { get, post, put } from './base'

export type GuestAppSummary = {
  id: string
  name: string
  mode: string
  icon_type: string | null
  icon: string | null
  icon_background: string | null
  description: string
  updated_at: string | null
}

export type GuestAccountSummary = {
  id: string
  name: string
  email: string
  avatar_url: string | null
  assigned_app_count?: number
}

export type InviteGuestPayload = {
  email: string
  app_ids: string[]
  language?: string
}

export type InviteGuestResult = {
  result: string
  email: string
  url: string
  already_in_tenant: boolean
  apps: GuestAppSummary[]
}

export const inviteGuest = (payload: InviteGuestPayload) =>
  post<InviteGuestResult>('/workspaces/current/members/invite-guest', { body: payload })

export const listWorkspaceGuests = () =>
  get<{ guests: GuestAccountSummary[] }>('/workspaces/current/guests')

export const listGuestApps = (accountId: string) =>
  get<{ apps: GuestAppSummary[] }>(`/workspaces/current/guests/${accountId}/apps`)

export const replaceGuestApps = (accountId: string, appIds: string[]) =>
  put<{ apps: GuestAppSummary[] }>(`/workspaces/current/guests/${accountId}/apps`, {
    body: { app_ids: appIds },
  })

export const listAppGuests = (appId: string) =>
  get<{ guests: GuestAccountSummary[] }>(`/apps/${appId}/guests`)

export const replaceAppGuests = (appId: string, accountIds: string[]) =>
  put<{ guests: GuestAccountSummary[] }>(`/apps/${appId}/guests`, {
    body: { account_ids: accountIds },
  })

export const useWorkspaceGuests = (enabled = true) =>
  useQuery({
    queryKey: ['admin', 'workspace-guests'],
    queryFn: listWorkspaceGuests,
    enabled,
  })

export const useGuestApps = (accountId: string | null) =>
  useQuery({
    queryKey: ['admin', 'guest-apps', accountId],
    queryFn: () => listGuestApps(accountId!),
    enabled: !!accountId,
  })

export const useInviteGuest = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: inviteGuest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'workspace-guests'] })
      qc.invalidateQueries({ queryKey: ['common', 'workspace-members'] })
    },
  })
}

export const useReplaceGuestApps = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ accountId, appIds }: { accountId: string; appIds: string[] }) =>
      replaceGuestApps(accountId, appIds),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'guest-apps', vars.accountId] })
      qc.invalidateQueries({ queryKey: ['admin', 'workspace-guests'] })
    },
  })
}
