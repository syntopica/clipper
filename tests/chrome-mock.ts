interface Store {
  data: Record<string, unknown>
  accessLevel: string | null
}

export function installChromeMock(): { sync: Store; local: Store } {
  const sync: Store = { data: {}, accessLevel: null }
  const local: Store = { data: {}, accessLevel: null }

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
  }

  return { sync, local }
}
