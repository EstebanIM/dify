'use client'
import type { PostProcessorModule, Resource } from 'i18next'
import type { Locale } from '.'
import type { Namespace, NamespaceInFileName } from './resources'
import { kebabCase } from 'es-toolkit/string'
import { createInstance } from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { getI18n, initReactI18next } from 'react-i18next'
import { getPlatformName } from './platform-name-store'
import { getInitOptions } from './settings'

// Replaces any leftover {{appName}} placeholder with the current platform name.
// Runs after i18next interpolation, so callers that already pass `{ appName }`
// (legacy paths) keep their override; everyone else gets the dynamic value.
const platformNamePostProcessor: PostProcessorModule = {
  type: 'postProcessor',
  name: 'platformName',
  process(value: string): string {
    if (typeof value === 'string' && value.includes('{{appName}}'))
      return value.replaceAll('{{appName}}', getPlatformName())
    return value
  },
}

export function createI18nextInstance(lng: Locale, resources: Resource) {
  const instance = createInstance()
  instance
    .use(platformNamePostProcessor)
    .use(initReactI18next)
    .use(resourcesToBackend((
      language: Locale,
      namespace: NamespaceInFileName | Namespace,
    ) => {
      const namespaceKebab = kebabCase(namespace)
      return import(`../i18n/${language}/${namespaceKebab}.json`)
    }))
    .init({
      ...getInitOptions(),
      lng,
      resources,
      postProcess: ['platformName'],
    })
  return instance
}

export const changeLanguage = async (lng?: Locale) => {
  if (!lng)
    return
  const i18n = getI18n()
  await i18n.changeLanguage(lng)
}
