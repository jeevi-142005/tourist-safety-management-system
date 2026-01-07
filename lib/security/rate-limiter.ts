// Rate limiting service for API endpoints
import type { NextRequest } from "next/server"

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map()

  async checkRateLimit(
    request: NextRequest,
    config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 },
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const clientId = this.getClientId(request)
    const now = Date.now()
    const windowStart = now - config.windowMs

    // Clean up old entries
    this.cleanup(windowStart)

    const clientData = this.requests.get(clientId)

    if (!clientData || clientData.resetTime <= now) {
      // First request or window expired
      this.requests.set(clientId, {
        count: 1,
        resetTime: now + config.windowMs,
      })

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs,
      }
    }

    if (clientData.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: clientData.resetTime,
      }
    }

    // Increment count
    clientData.count++
    this.requests.set(clientId, clientData)

    return {
      allowed: true,
      remaining: config.maxRequests - clientData.count,
      resetTime: clientData.resetTime,
    }
  }

  private getClientId(request: NextRequest): string {
    // Use IP address and User-Agent for client identification
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.ip || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    return `${ip}:${userAgent}`
  }

  private cleanup(windowStart: number): void {
    for (const [key, data] of this.requests.entries()) {
      if (data.resetTime <= windowStart) {
        this.requests.delete(key)
      }
    }
  }
}

export const rateLimiter = new RateLimiter()

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  EMERGENCY_ALERT: { windowMs: 60000, maxRequests: 5 }, // 5 emergency alerts per minute
  DIGITAL_ID_CREATE: { windowMs: 300000, maxRequests: 3 }, // 3 ID creations per 5 minutes
  LOCATION_TRACK: { windowMs: 60000, maxRequests: 60 }, // 60 location updates per minute
  AUTH_LOGIN: { windowMs: 900000, maxRequests: 5 }, // 5 login attempts per 15 minutes
  DEFAULT: { windowMs: 60000, maxRequests: 100 }, // 100 requests per minute default
}
