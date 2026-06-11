class MockQueryBuilder {
  private tableName: string
  private actionState: "select" | "insert" | "update" | "delete" = "select"
  private selectFields: string = "*"
  private filters: Record<string, { op: string; value: any }> = {}
  private payload: any = null
  private ordering: { field: string; ascending: boolean } | null = null
  private limitCount: number | null = null
  private isSingle = false

  constructor(tableName: string) {
    this.tableName = tableName
  }

  select(fields = "*") {
    this.selectFields = fields
    return this
  }

  eq(field: string, value: any) {
    this.filters[field] = { op: "eq", value }
    return this
  }

  neq(field: string, value: any) {
    this.filters[field] = { op: "neq", value }
    return this
  }

  gte(field: string, value: any) {
    this.filters[field] = { op: "gte", value }
    return this
  }

  in(field: string, values: any[]) {
    this.filters[field] = { op: "in", value: values }
    return this
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.ordering = { field, ascending: options?.ascending !== false }
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  insert(data: any) {
    this.actionState = "insert"
    this.payload = data
    return this
  }

  update(data: any) {
    this.actionState = "update"
    this.payload = data
    return this
  }

  delete() {
    this.actionState = "delete"
    return this
  }

  single() {
    this.isSingle = true
    return this
  }

  async execute() {
    try {
      const res = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: this.tableName,
          action: this.actionState,
          filters: this.filters,
          data: this.payload,
          ordering: this.ordering,
          limit: this.limitCount,
          isSingle: this.isSingle,
          selectFields: this.selectFields
        })
      })
      if (!res.ok) {
        const errorData = await res.json()
        return { data: null, error: { message: errorData.error || "Database error", code: "PROXY_ERROR" } }
      }
      const result = await res.json()
      if (result.data && typeof result.data === "object" && "data" in result.data) {
        return { data: result.data.data, count: result.data.count, error: null }
      }
      return { data: result.data, error: null }
    } catch (err: any) {
      return { data: null, error: { message: err.message || "Network error", code: "NET_ERROR" } }
    }
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected)
  }
}

export function createBrowserClient() {
  return {
    auth: {
      getUser: async () => {
        try {
          const res = await fetch("/api/auth/session")
          if (res.ok) {
            const session = await res.json()
            if (session?.user) {
              return {
                data: {
                  user: {
                    id: session.user.id || "",
                    email: session.user.email || "",
                    name: session.user.name || "",
                    role: session.user.role || "tourist",
                  }
                },
                error: null
              }
            }
          }
          return { data: { user: null }, error: new Error("Not authenticated") }
        } catch (err: any) {
          return { data: { user: null }, error: err }
        }
      },
      getSession: async () => {
        try {
          const res = await fetch("/api/auth/session")
          if (res.ok) {
            const session = await res.json()
            return { data: { session }, error: null }
          }
          return { data: { session: null }, error: null }
        } catch (err: any) {
          return { data: { session: null }, error: err }
        }
      },
      setSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null })
    },
    from: (tableName: string) => {
      return new MockQueryBuilder(tableName)
    },
    rpc: async (funcName: string, params?: any) => {
      if (funcName === "get_tourist_heatmap_data") {
        return { data: [], error: null }
      }
      if (funcName === "get_safety_score_statistics") {
        return { data: { average_score: 85, total_analyzed: 10 }, error: null }
      }
      return { data: null, error: null }
    },
    channel: (name: string) => ({
      send: async () => ({ data: null, error: null }),
      subscribe: () => ({ unsubscribe: () => {} })
    })
  }
}

export { createBrowserClient as createClient }

