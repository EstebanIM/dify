'use client'

import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import AppIcon from '@/app/components/base/app-icon'
import { useRouter } from '@/next/navigation'
import type { GuestAppCard as GuestAppCardType } from '@/service/use-guest'

dayjs.extend(relativeTime)

const MODE_BADGE_LABEL: Record<string, string> = {
  'chat': 'home.modeChat',
  'agent-chat': 'home.modeAgent',
  'advanced-chat': 'home.modeAdvancedChat',
  'workflow': 'home.modeWorkflow',
  'completion': 'home.modeCompletion',
}

type Props = {
  app: GuestAppCardType
}

const GuestAppCard = ({ app }: Props) => {
  const { t, i18n } = useTranslation()
  const router = useRouter()

  const handleClick = () => {
    if (app.installed_app_id) {
      router.push(`/explore/installed/${app.installed_app_id}`)
    }
  }

  const lastUsed = app.updated_at
    ? dayjs(app.updated_at).locale(i18n.language).fromNow()
    : null
  const modeKey = MODE_BADGE_LABEL[app.mode] ?? 'home.modeOther'

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!app.installed_app_id}
      className="group flex h-32 cursor-pointer flex-col items-start gap-2 rounded-xl border border-divider-subtle bg-components-panel-on-panel-item-bg p-4 text-left transition-all hover:border-divider-deep hover:bg-components-panel-on-panel-item-bg-hover disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="flex w-full items-center gap-3">
        <AppIcon
          size="large"
          iconType={app.icon_type as 'image' | 'emoji' | null | undefined}
          icon={app.icon ?? undefined}
          background={app.icon_background ?? undefined}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate system-md-semibold text-text-primary">{app.name}</div>
          <div className="mt-0.5 inline-flex items-center rounded-md bg-components-badge-bg-dim px-1.5 py-0.5 system-2xs-medium-uppercase text-text-tertiary">
            {t(modeKey, { ns: 'common' })}
          </div>
        </div>
      </div>
      {lastUsed && (
        <div className="mt-auto system-xs-regular text-text-tertiary">
          {t('home.lastUsed', { ns: 'common', time: lastUsed })}
        </div>
      )}
    </button>
  )
}

export default GuestAppCard
