'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Loading from '@/app/components/base/loading'
import { useAppContext } from '@/context/app-context'
import useDocumentTitle from '@/hooks/use-document-title'
import { useGuestApps } from '@/service/use-guest'
import GuestAppCard from './guest-app-card'

type AppGroup = {
  key: 'chat' | 'workflow' | 'other'
  apps: ReturnType<typeof useGuestApps>['data'] extends infer T ? (T extends { apps: (infer A)[] } ? A : never) : never
}

const CHAT_MODES = new Set(['chat', 'advanced-chat', 'agent-chat'])
const WORKFLOW_MODES = new Set(['workflow'])

const GuestHome = () => {
  const { t } = useTranslation()
  const { userProfile } = useAppContext()
  const { data, isLoading } = useGuestApps()

  useDocumentTitle(t('home.title', { ns: 'common' }))

  const groups = useMemo(() => {
    const apps = data?.apps ?? []
    const chat: typeof apps = []
    const workflow: typeof apps = []
    const other: typeof apps = []
    for (const app of apps) {
      if (CHAT_MODES.has(app.mode)) chat.push(app)
      else if (WORKFLOW_MODES.has(app.mode)) workflow.push(app)
      else other.push(app)
    }
    return [
      { key: 'chat' as const, titleKey: 'home.groupChat', apps: chat },
      { key: 'workflow' as const, titleKey: 'home.groupWorkflow', apps: workflow },
      { key: 'other' as const, titleKey: 'home.groupOther', apps: other },
    ].filter(g => g.apps.length > 0)
  }, [data])

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loading type="app" />
      </div>
    )
  }

  const totalApps = data?.apps.length ?? 0

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto px-6 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="mb-1 title-2xl-semi-bold text-text-primary">
          {t('home.greeting', { ns: 'common', name: userProfile?.name ?? '' })}
        </h1>
        <p className="mb-8 body-md-regular text-text-tertiary">
          {totalApps > 0 ? t('home.subtitle', { ns: 'common' }) : ''}
        </p>

        {totalApps === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-divider-deep bg-components-panel-bg p-12 text-center">
            <span aria-hidden className="mb-4 i-ri-inbox-line h-12 w-12 text-text-quaternary" />
            <div className="mb-2 title-lg-semi-bold text-text-primary">
              {t('home.emptyTitle', { ns: 'common' })}
            </div>
            <div className="body-md-regular text-text-tertiary">
              {t('home.emptyDescription', { ns: 'common' })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {groups.map(group => (
              <section key={group.key}>
                <h2 className="mb-4 title-lg-semi-bold text-text-primary">
                  {t(group.titleKey, { ns: 'common' })}
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.apps.map(app => (
                    <GuestAppCard key={app.id} app={app} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default GuestHome
