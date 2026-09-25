import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { executeDbQuery } from "./db-executor"

class MockServerQueryBuilder {
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
      const { data, count } = await executeDbQuery({
        table: this.tableName,
        action: this.actionState,
        filters: this.filters,
        data: this.payload,
        ordering: this.ordering,
        limit: this.limitCount,
        isSingle: this.isSingle,
        selectFields: this.selectFields
      })
      return { data, count, error: null }
    } catch (err: any) {
      console.error(`DBQueryBuilder error executing on ${this.tableName}:`, err)
      return { data: null, count: 0, error: { message: err.message || "Database error", code: "SERVER_DB_ERROR" } }
    }
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected)
  }
}

export async function createServerClient() {
  const session = await getServerSession(authOptions)
  const user = session?.user ? {
    id: (session.user as any).id || "",
    email: session.user.email || "",
    name: session.user.name || "",
    role: (session.user as any).role || "tourist",
  } : null

  return {
    auth: {
      getUser: async () => {
        return { data: { user }, error: user ? null : new Error("Not authenticated") }
      },
      getSession: async () => {
        return { data: { session }, error: null }
      },
      setSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null })
    },
    from: (tableName: string) => {
      return new MockServerQueryBuilder(tableName)
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
      send: async (_payload?: any) => ({ data: null, error: null }),
      subscribe: () => ({ unsubscribe: () => {} })
    })
  }
}

export { createServerClient as createClient }
