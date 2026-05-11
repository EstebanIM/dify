// Module-level store that holds the current platform name so it can be read
// by the i18next postProcessor (which runs outside React).
// The PlatformNameSync component keeps this in sync with usePlatformName().

let currentPlatformName = 'Dify'

export function setPlatformName(name: string) {
  if (name)
    currentPlatformName = name
}

export function getPlatformName(): string {
  return currentPlatformName
}
