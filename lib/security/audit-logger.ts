// Security audit logging service
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { encryptionService } from "@/lib/crypto/encryption"

export interface AuditLogEntry {
  userId?: string
  action: string
  resource: string
  ipAddress?: string
  userAgent?: string
  success: boolean
  details?: Record<string, any>
  riskLevel: "low" | "medium" | "high" | "critical"
}

class AuditLogger {
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const cookieStore = cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
          },
        },
      )

      // Create audit log entry
      await supabase.from("security_audit_logs").insert({
        user_id: entry.userId,
        action: entry.action,
        resource: entry.resource,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        success: entry.success,
        details: entry.details ? await encryptionService.encrypt(JSON.stringify(entry.details)) : null,
        risk_level: entry.riskLevel,
        timestamp: new Date().toISOString(),
      })

      // If high or critical risk, create security alert
      if (entry.riskLevel === "high" || entry.riskLevel === "critical") {
        await this.createSecurityAlert(entry)
      }
    } catch (error) {
      console.error("Audit logging failed:", error)
      // Don't throw error to avoid breaking the main flow
    }
  }

  private async createSecurityAlert(entry: AuditLogEntry): Promise<void> {
    try {
      const cookieStore = cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
          },
        },
      )

      await supabase.from("security_alerts").insert({
        alert_type: "security_breach",
        severity: entry.riskLevel,
        description: `Security event: ${entry.action} on ${entry.resource}`,
        user_id: entry.userId,
        ip_address: entry.ipAddress,
        details: {
          action: entry.action,
          resource: entry.resource,
          success: entry.success,
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error("Security alert creation failed:", error)
    }
  }
}

export const auditLogger = new AuditLogger()

// Common audit actions
export const AUDIT_ACTIONS = {
  LOGIN_ATTEMPT: "login_attempt",
  LOGIN_SUCCESS: "login_success",
  LOGIN_FAILURE: "login_failure",
  LOGOUT: "logout",
  DIGITAL_ID_CREATE: "digital_id_create",
  DIGITAL_ID_VERIFY: "digital_id_verify",
  EMERGENCY_ALERT: "emergency_alert",
  LOCATION_UPDATE: "location_update",
  DATA_ACCESS: "data_access",
  DATA_EXPORT: "data_export",
  PERMISSION_DENIED: "permission_denied",
  SUSPICIOUS_ACTIVITY: "suspicious_activity",
}
