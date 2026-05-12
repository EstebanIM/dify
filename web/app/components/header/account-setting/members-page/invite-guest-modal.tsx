'use client'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@langgenius/dify-ui/button'
import { Dialog, DialogCloseButton, DialogContent, DialogTitle } from '@langgenius/dify-ui/dialog'
import { toast } from '@langgenius/dify-ui/toast'
import { useQuery } from '@tanstack/react-query'
import AppIcon from '@/app/components/base/app-icon'
import Checkbox from '@/app/components/base/checkbox'
import Input from '@/app/components/base/input'
import Loading from '@/app/components/base/loading'
import { fetchAppList } from '@/service/apps'
import { useInviteGuest } from '@/service/use-guest-admin'

type Props = {
  onCancel: () => void
  onSuccess?: (url: string, email: string) => void
}

type AppRow = {
  id: string
  name: string
  mode: string
  icon_type: string | null
  icon: string | null
  icon_background: string | null
}

const InviteGuestModal = ({ onCancel, onSuccess }: Props) => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'workspace-apps-flat'],
    queryFn: () => fetchAppList({ url: '/apps', params: { page: 1, limit: 100 } }),
  })

  const apps = useMemo<AppRow[]>(() => {
    const list = ((data as any)?.data ?? []) as AppRow[]
    return list
  }, [data])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const mutation = useInviteGuest()

  const handleSubmit = async () => {
    const cleanedEmail = email.trim().toLowerCase()
    if (!cleanedEmail) {
      toast.error('Email is required.')
      return
    }
    try {
      const result = await mutation.mutateAsync({
        email: cleanedEmail,
        app_ids: Array.from(selected),
      })
      toast.success(`Invited ${result.email}`)
      onSuccess?.(result.url, result.email)
      onCancel()
    }
    catch (e: any) {
      toast.error(e?.message || 'Failed to invite guest')
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open)
          onCancel()
      }}
    >
      <DialogContent
        backdropProps={{ forceRender: true }}
        className="w-[520px] max-w-[520px] overflow-visible px-8 py-6"
      >
        <DialogCloseButton className="top-6 right-8" />
        <div className="mb-4 pr-8">
          <DialogTitle className="text-xl font-semibold text-text-primary">
            {t('guests.inviteGuest', { ns: 'common' })}
          </DialogTitle>
        </div>

        <div className="mb-4">
          <div className="mb-1 system-sm-medium text-text-secondary">
            {t('guests.inviteEmailLabel', { ns: 'common' })}
          </div>
          <Input
            type="email"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
            placeholder="user@example.com"
          />
        </div>

        <div className="mb-6">
          <div className="mb-1 system-sm-medium text-text-secondary">
            {t('guests.inviteAppsLabel', { ns: 'common' })}
          </div>
          <div className="max-h-[280px] overflow-y-auto rounded-lg border border-divider-subtle">
            {isLoading
              ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loading />
                  </div>
                )
              : apps.length === 0
                ? (
                    <div className="px-3 py-6 text-center system-sm-regular text-text-tertiary">
                      —
                    </div>
                  )
                : (
                    apps.map(app => (
                      <label
                        key={app.id}
                        className="flex cursor-pointer items-center gap-3 border-b border-divider-subtle px-3 py-2 last:border-b-0 hover:bg-background-default-dodge"
                      >
                        <Checkbox
                          checked={selected.has(app.id)}
                          onCheck={() => toggle(app.id)}
                        />
                        <AppIcon
                          size="small"
                          iconType={app.icon_type as any}
                          icon={app.icon ?? undefined}
                          background={app.icon_background ?? undefined}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate system-sm-medium text-text-primary">{app.name}</div>
                          <div className="system-xs-regular text-text-tertiary">{app.mode}</div>
                        </div>
                      </label>
                    ))
                  )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button onClick={onCancel}>{t('operation.cancel', { ns: 'common' })}</Button>
          <Button
            variant="primary"
            loading={mutation.isPending}
            onClick={handleSubmit}
            disabled={!email.trim() || mutation.isPending}
          >
            {t('guests.inviteSubmit', { ns: 'common' })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default InviteGuestModal
