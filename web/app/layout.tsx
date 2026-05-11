import type { Metadata, Viewport } from '@/next'
import { ToastHost } from '@langgenius/dify-ui/toast'
import { TooltipProvider } from '@langgenius/dify-ui/tooltip'
import { Provider as JotaiProvider } from 'jotai/react'
import { ThemeProvider } from 'next-themes'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import AmplitudeProvider from '@/app/components/base/amplitude'
import { TanstackQueryInitializer } from '@/context/query-client'
import { getDatasetMap } from '@/env'
import { getLocaleOnServer } from '@/i18n-config/server'
import { fetchPlatformNameServer } from '@/service/system-features.server'
import PartnerStackCookieRecorder from './components/billing/partner-stack/cookie-recorder'
import CreateAppAttributionBootstrap from './components/create-app-attribution-bootstrap'
import { AgentationLoader } from './components/devtools/agentation-loader'
import { ReactScanLoader } from './components/devtools/react-scan/loader'
import { I18nServerProvider } from './components/provider/i18n-server'
import RoutePrefixHandle from './routePrefixHandle'
import './styles/globals.css'
import './styles/markdown.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  userScalable: false,
  themeColor: '#1C64F2',
}

export async function generateMetadata(): Promise<Metadata> {
  const appName = await fetchPlatformNameServer()
  return {
    title: { default: appName, template: `%s - ${appName}` },
    appleWebApp: {
      title: appName,
      capable: true,
      statusBarStyle: 'default',
    },
    manifest: '/manifest.webmanifest',
    other: {
      'mobile-web-app-capable': 'yes',
      'msapplication-TileColor': '#1C64F2',
      'msapplication-config': '/browserconfig.xml',
    },
    icons: {
      icon: [
        { url: '/icon-192x192.png', sizes: '32x32', type: 'image/png' },
        { url: '/icon-192x192.png', sizes: '16x16', type: 'image/png' },
      ],
      apple: '/apple-touch-icon.png',
    },
  }
}

const LocaleLayout = async ({
  children,
}: {
  children: React.ReactNode
}) => {
  const locale = await getLocaleOnServer()
  const datasetMap = getDatasetMap()

  return (
    <html lang={locale ?? 'en'} className="h-full" suppressHydrationWarning>
      <head>
        <CreateAppAttributionBootstrap />
        {/* <ReactGrabLoader /> */}
        <ReactScanLoader />
      </head>
      <body
        className="h-full select-auto"
        {...datasetMap}
      >
        <div className="isolate h-full">
          <AmplitudeProvider />
          <JotaiProvider>
            <ThemeProvider
              attribute="data-theme"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <NuqsAdapter>
                <TanstackQueryInitializer>
                  <I18nServerProvider>
                    <ToastHost timeout={5000} limit={3} />
                    <PartnerStackCookieRecorder />
                    <TooltipProvider delay={300} closeDelay={200}>
                      {children}
                    </TooltipProvider>
                  </I18nServerProvider>
                </TanstackQueryInitializer>
              </NuqsAdapter>
            </ThemeProvider>
          </JotaiProvider>
          <RoutePrefixHandle />
          <AgentationLoader />
        </div>
      </body>
    </html>
  )
}

export default LocaleLayout
