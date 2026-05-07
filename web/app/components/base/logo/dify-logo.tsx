'use client'
import type { FC } from 'react'
import { useAppContext } from '@/context/app-context'
import { useGlobalPublicStore } from '@/context/global-public-context'
import usePlatformName from '@/hooks/use-platform-name'
import useTheme from '@/hooks/use-theme'
import { cn } from '@/utils/classnames'
import { basePath } from '@/utils/var'

export type LogoStyle = 'default' | 'monochromeWhite'

export const logoPathMap: Record<LogoStyle, string> = {
  default: '/logo/logo.svg',
  monochromeWhite: '/logo/logo-monochrome-white.svg',
}

export type LogoSize = 'large' | 'medium' | 'small'

export const logoSizeMap: Record<LogoSize, string> = {
  large: 'w-16 h-7',
  medium: 'w-12 h-[22px]',
  small: 'w-9 h-4',
}

type DifyLogoProps = {
  style?: LogoStyle
  size?: LogoSize
  className?: string
}

const DifyLogo: FC<DifyLogoProps> = ({
  style = 'default',
  size = 'medium',
  className,
}) => {
  const { theme } = useTheme()
  const systemFeatures = useGlobalPublicStore(s => s.systemFeatures)
  const { currentWorkspace } = useAppContext()
  const platformName = usePlatformName()

  // Precedence: enterprise branding → workspace custom_config (post-login) → systemFeatures logo populated
  // from custom_config for pre-login pages (signin/install) → Dify SVG default.
  const customLogoUrl
    = (systemFeatures.branding.enabled && systemFeatures.branding.workspace_logo)
    || currentWorkspace.custom_config?.replace_webapp_logo
    || systemFeatures.branding.workspace_logo
    || ''

  if (customLogoUrl) {
    return (
      <img
        src={customLogoUrl}
        className={cn('block object-contain', logoSizeMap[size], className)}
        alt="logo"
      />
    )
  }

  const themedStyle = (theme === 'dark' && style === 'default') ? 'monochromeWhite' : style

  return (
    <img
      src={`${basePath}${logoPathMap[themedStyle]}`}
      className={cn('block object-contain', logoSizeMap[size], className)}
      alt={`${platformName} logo`}
    />
  )
}

export default DifyLogo
