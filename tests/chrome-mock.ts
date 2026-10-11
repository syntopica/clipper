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
  alarms: Map<string, number>
  sentMessages: unknown[]
  // Host permissions held, and how the next `permissions.request` is answered.
  grantedOrigins: Set<string>
  permissionAnswer: { grant: boolean }
}

export function installChromeMock(): ChromeMock {
  const sync: Store = { data: {}, accessLevel: null }
  const local: Store = { data: {}, accessLevel: null }
  const actionTitles: string[] = []
  const iconPaths: Record<number, string>[] = []
  const openOptionsPageCalls: unknown[] = []
  const alarms = new Map<string, number>()
  const sentMessages: unknown[] = []
  const grantedOrigins = new Set<string>()
  const permissionAnswer = { grant: true }
  const covered = (origin: string) =>
    grantedOrigins.has(origin) || (grantedOrigins.has('https://*/*') && origin.startsWith('https://'))

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
    permissions: {
      contains: async ({ origins }: { origins: string[] }) => origins.every(covered),
      request: async ({ origins }: { origins: string[] }) => {
        if (permissionAnswer.grant) for (const origin of origins) grantedOrigins.add(origin)
        return permissionAnswer.grant
      },
    },
    alarms: {
      create: async (name: string, info: { when: number }) => {
        alarms.set(name, info.when)
      },
      clear: async (name: string) => alarms.delete(name),
    },
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
      sendMessage: async (message: unknown) => {
        sentMessages.push(message)
      },
    },
  }

  return { sync, local, actionTitles, iconPaths, openOptionsPageCalls, alarms, sentMessages, grantedOrigins, permissionAnswer }
}
