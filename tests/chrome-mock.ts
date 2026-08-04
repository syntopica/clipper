interface Store {
  data: Record<string, unknown>
  accessLevel: string | null
}

export interface ChromeMock {
  sync: Store
  local: Store
  actionTitles: string[]
  iconPaths: Record<number, string>[]
  openOptionsPageCalls: unknown[]
}

export function installChromeMock(): ChromeMock {
  const sync: Store = { data: {}, accessLevel: null }
  const local: Store = { data: {}, accessLevel: null }
  const actionTitles: string[] = []
  const iconPaths: Record<number, string>[] = []
  const openOptionsPageCalls: unknown[] = []

  const area = (store: Store) => ({
    get: async (keys: string[]) =>
      Object.fromEntries(keys.map((key) => [key, store.data[key]]).filter(([, v]) => v !== undefined)),
    set: async (items: Record<string, unknown>) => {
      Object.assign(store.data, items)
    },
    remove: async (key: string) => {
      delete store.data[key]
    },
    setAccessLevel: async ({ accessLevel }: { accessLevel: string }) => {
      store.accessLevel = accessLevel
    },
  })

  ;(globalThis as unknown as { chrome: unknown }).chrome = {
    storage: { sync: area(sync), local: area(local) },
    action: {
      setBadgeText: async () => {},
      setBadgeBackgroundColor: async () => {},
      setTitle: async ({ title }: { title: string }) => {
        actionTitles.push(title)
      },
      setIcon: async ({ path }: { path: Record<number, string> }) => {
        iconPaths.push(path)
      },
    },
    runtime: {
      getManifest: () => ({ version: '0.1.0', action: { default_title: 'Clip to brain' } }),
      getPlatformInfo: async () => ({ os: 'mac', arch: 'arm64', nacl_arch: 'arm64' }),
      openOptionsPage: async () => {
        openOptionsPageCalls.push(undefined)
      },
    },
  }

  return { sync, local, actionTitles, iconPaths, openOptionsPageCalls }
}
