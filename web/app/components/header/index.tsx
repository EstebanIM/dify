'use client'
import { useCallback } from 'react'
import DifyLogo from '@/app/components/base/logo/dify-logo'
import WorkplaceSelector from '@/app/components/header/account-dropdown/workplace-selector'
import { ACCOUNT_SETTING_TAB } from '@/app/components/header/account-setting/constants'
import { useAppContext } from '@/context/app-context'
import { useModalContext } from '@/context/modal-context'
import { useProviderContext } from '@/context/provider-context'
import { WorkspaceProvider } from '@/context/workspace-context-provider'
import useBreakpoints, { MediaType } from '@/hooks/use-breakpoints'
import usePlatformName from '@/hooks/use-platform-name'
import Link from '@/next/link'
import { Plan } from '../billing/type'
import AccountDropdown from './account-dropdown'
import AppNav from './app-nav'
import DatasetNav from './dataset-nav'
import EnvNav from './env-nav'
import ExploreNav from './explore-nav'
import LicenseNav from './license-env'
import PlanBadge from './plan-badge'
import PluginsNav from './plugins-nav'
import ToolsNav from './tools-nav'

const navClassName = `
  flex items-center relative px-3 h-8 rounded-xl
  font-medium text-sm
  cursor-pointer
`

const Header = () => {
  const { isCurrentWorkspaceEditor, isCurrentWorkspaceDatasetOperator, isCurrentWorkspaceGuest } = useAppContext()
  const media = useBreakpoints()
  const isMobile = media === MediaType.mobile
  const { enableBilling, plan } = useProviderContext()
  const { setShowPricingModal, setShowAccountSettingModal } = useModalContext()
  const platformName = usePlatformName()
  const isFreePlan = plan.type === Plan.sandbox
  const handlePlanClick = useCallback(() => {
    if (isFreePlan)
      setShowPricingModal()
    else
      setShowAccountSettingModal({ payload: ACCOUNT_SETTING_TAB.BILLING })
  }, [isFreePlan, setShowAccountSettingModal, setShowPricingModal])

  const renderLogo = () => (
    <h1>
      <Link href={isCurrentWorkspaceGuest ? '/home' : '/apps'} className="flex h-8 shrink-0 items-center justify-center overflow-hidden px-0.5 indent-[-9999px] whitespace-nowrap">
        {platformName}
        <DifyLogo />
      </Link>
    </h1>
  )

  if (isMobile) {
    return (
      <div className="">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center">
            {renderLogo()}
            {!isCurrentWorkspaceGuest && (
              <>
                <div className="mx-1.5 shrink-0 font-light text-divider-deep">/</div>
                <WorkspaceProvider>
                  <WorkplaceSelector />
                </WorkspaceProvider>
                {enableBilling ? <PlanBadge allowHover sandboxAsUpgrade plan={plan.type} onClick={handlePlanClick} /> : <LicenseNav />}
              </>
            )}
          </div>
          <div className="flex items-center">
            {!isCurrentWorkspaceGuest && (
              <div className="mr-2">
                <PluginsNav />
              </div>
            )}
            <AccountDropdown />
          </div>
        </div>
        <div className="my-1 flex items-center justify-center space-x-1">
          {!isCurrentWorkspaceGuest && !isCurrentWorkspaceDatasetOperator && <ExploreNav className={navClassName} />}
          {!isCurrentWorkspaceGuest && !isCurrentWorkspaceDatasetOperator && <AppNav />}
          {!isCurrentWorkspaceGuest && (isCurrentWorkspaceEditor || isCurrentWorkspaceDatasetOperator) && <DatasetNav />}
          {!isCurrentWorkspaceGuest && !isCurrentWorkspaceDatasetOperator && <ToolsNav className={navClassName} />}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[56px] items-center">
      <div className="flex min-w-0 flex-1 items-center pr-2 pl-3 min-[1280px]:pr-3">
        {renderLogo()}
        {!isCurrentWorkspaceGuest && (
          <>
            <div className="mx-1.5 shrink-0 font-light text-divider-deep">/</div>
            <WorkspaceProvider>
              <WorkplaceSelector />
            </WorkspaceProvider>
            {enableBilling ? <PlanBadge allowHover sandboxAsUpgrade plan={plan.type} onClick={handlePlanClick} /> : <LicenseNav />}
          </>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {!isCurrentWorkspaceGuest && !isCurrentWorkspaceDatasetOperator && <ExploreNav className={navClassName} />}
        {!isCurrentWorkspaceGuest && !isCurrentWorkspaceDatasetOperator && <AppNav />}
        {!isCurrentWorkspaceGuest && (isCurrentWorkspaceEditor || isCurrentWorkspaceDatasetOperator) && <DatasetNav />}
        {!isCurrentWorkspaceGuest && !isCurrentWorkspaceDatasetOperator && <ToolsNav className={navClassName} />}
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end pr-3 pl-2 min-[1280px]:pl-3">
        {!isCurrentWorkspaceGuest && <EnvNav />}
        {!isCurrentWorkspaceGuest && (
          <div className="mr-2">
            <PluginsNav />
          </div>
        )}
        <AccountDropdown />
      </div>
    </div>
  )
}
export default Header
