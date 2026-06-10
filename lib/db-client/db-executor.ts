import { db } from "@/lib/db"

const fieldMap: Record<string, Record<string, string>> = {
  profiles: {
    id: "id",
    email: "email",
    full_name: "name",
    phone: "phone",
    emergency_contact: "emergencyContact",
    emergency_phone: "emergencyPhone",
    role: "role",
    blockchain_id: "blockchainId",
    qr_code_data: "qrCodeData",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  tourist_profiles: {
    id: "id",
    email: "email",
    name: "name",
    blockchain_id: "blockchainId",
    is_active: "role",
    created_at: "createdAt",
  },
  geo_zones: {
    id: "id",
    name: "name",
    zone_type: "zoneType",
    country_id: "countryId",
    coordinates: "coordinates",
    center_lat: "centerLat",
    center_lng: "centerLng",
    radius: "radius",
    description: "description",
    is_active: "isActive",
    created_at: "createdAt",
  },
  user_alerts: {
    id: "id",
    user_id: "userId",
    user_name: "userName",
    type: "type",
    message: "message",
    severity: "severity",
    location_lat: "locationLat",
    location_lng: "locationLng",
    status: "status",
    device_info: "deviceInfo",
    offline_stored_at: "offlineStoredAt",
    synced_at: "syncedAt",
    created_at: "createdAt",
  },
  emergency_alerts: {
    id: "id",
    user_id: "userId",
    user_name: "userName",
    type: "type",
    message: "message",
    severity: "severity",
    location_lat: "locationLat",
    location_lng: "locationLng",
    status: "status",
    device_info: "deviceInfo",
    offline_stored_at: "offlineStoredAt",
    synced_at: "syncedAt",
    created_at: "createdAt",
  },
  alerts: {
    id: "id",
    user_id: "userId",
    user_name: "userName",
    type: "type",
    message: "message",
    severity: "severity",
    location_lat: "locationLat",
    location_lng: "locationLng",
    status: "status",
    device_info: "deviceInfo",
    offline_stored_at: "offlineStoredAt",
    synced_at: "syncedAt",
    created_at: "createdAt",
  },
  anomaly_patterns: {
    id: "id",
    user_id: "userId",
    type: "type",
    severity: "severity",
    description: "description",
    location_lat: "locationLat",
    location_lng: "locationLng",
    confidence: "confidence",
    risk_factors: "riskFactors",
    recommendations: "recommendations",
    resolved: "resolved",
    resolved_at: "resolvedAt",
    created_at: "createdAt",
  },
  location_tracks: {
    id: "id",
    user_id: "userId",
    latitude: "latitude",
    longitude: "longitude",
    accuracy: "accuracy",
    altitude: "altitude",
    speed: "speed",
    heading: "heading",
    timestamp: "timestamp",
    battery_level: "batteryLevel",
    is_emergency: "isEmergency",
    zone_id: "zoneId",
  },
  device_metrics: {
    id: "id",
    user_id: "userId",
    battery_level: "batteryLevel",
    connection_strength: "connectionStrength",
    location_accuracy: "locationAccuracy",
    ambient_light: "ambientLight",
    noise_level: "noiseLevel",
    movement_pattern: "movementPattern",
    location_lat: "locationLat",
    location_lng: "locationLng",
    created_at: "createdAt",
  },
  tourist_ids: {
    id: "id",
    user_id: "userId",
    document_type: "documentType",
    document_number: "documentNumber",
    valid_from: "validFrom",
    valid_until: "validUntil",
    blockchain_hash: "blockchainHash",
    qr_code_data: "qrCodeData",
    is_active: "isActive",
    created_at: "createdAt",
    aadhaar_number: "aadhaarNumber",
    passport_number: "passportNumber",
    emergency_contact_name: "emergencyContactName",
    emergency_contact_phone: "emergencyContactPhone",
    trip_start_date: "tripStartDate",
    trip_end_date: "tripEndDate",
  },
  digital_tourist_ids: {
    id: "id",
    user_id: "userId",
    document_type: "documentType",
    document_number: "documentNumber",
    valid_from: "validFrom",
    valid_until: "validUntil",
    blockchain_hash: "blockchainHash",
    qr_code_data: "qrCodeData",
    is_active: "isActive",
    created_at: "createdAt",
    aadhaar_number: "aadhaarNumber",
    passport_number: "passportNumber",
    emergency_contact_name: "emergencyContactName",
    emergency_contact_phone: "emergencyContactPhone",
    trip_start_date: "tripStartDate",
    trip_end_date: "tripEndDate",
  },
  blockchain_logs: {
    id: "id",
    transaction_hash: "transactionHash",
    transaction_type: "transactionType",
    user_id: "userId",
    data_hash: "dataHash",
    block_number: "blockNumber",
    gas_used: "gasUsed",
    created_at: "createdAt",
  },
  admin_notifications: {
    id: "id",
    type: "type",
    title: "title",
    message: "message",
    severity: "severity",
    user_id: "userId",
    metadata: "metadata",
    is_read: "isRead",
    created_at: "createdAt",
    read_at: "readAt",
  },
  safety_scores: {
    id: "id",
    user_id: "userId",
    score: "score",
    risk_level: "riskLevel",
    factors: "factors",
    recommendations: "recommendations",
    analysis_summary: "analysisSummary",
    created_at: "createdAt",
  },
  planned_routes: {
    id: "id",
    user_id: "userId",
    title: "title",
    destination_country_id: "destinationCountryId",
    start_date: "startDate",
    end_date: "endDate",
    planned_route: "plannedRoute",
    accommodation_details: "accommodationDetails",
    emergency_plan: "emergencyPlan",
    is_active: "isActive",
    created_at: "createdAt",
    updated_at: "updatedAt",
  },
  ai_analyses: {
    id: "id",
    user_id: "userId",
    analysis_type: "analysisType",
    results: "results",
    confidence: "confidence",
    threat_level: "threatLevel",
    created_at: "createdAt",
    updated_at: "updatedAt",
  }
}

function toPrismaField(table: string, field: string): string {
  return fieldMap[table]?.[field] || field
}

function toPrismaData(table: string, data: any): any {
  if (!data || typeof data !== "object") return data
  if (Array.isArray(data)) return data.map(item => toPrismaData(table, item))
  
  const mapped: any = {}
  for (const [key, val] of Object.entries(data)) {
    const prismaKey = toPrismaField(table, key)
    mapped[prismaKey] = toPrismaData(table, val)
  }
  return mapped
}

function fromPrismaData(table: string, data: any): any {
  if (!data || typeof data !== "object") return data
  if (Array.isArray(data)) return data.map(item => fromPrismaData(table, item))
  
  const mapped: any = {}
  const invertMap = Object.entries(fieldMap[table] || {}).reduce((acc, [k, v]) => {
    acc[v] = k
    return acc
  }, {} as Record<string, string>)

  for (const [key, val] of Object.entries(data)) {
    const actualVal = typeof val === "bigint" ? Number(val) : val
    const dbKey = invertMap[key] || key
    mapped[dbKey] = fromPrismaData(table, actualVal)
  }
  return mapped
}

function getPrismaModel(table: string): any {
  const modelMap: Record<string, any> = {
    profiles: db.user,
    tourist_profiles: db.user,
    geo_zones: db.geoZone,
    user_alerts: db.emergencyAlert,
    emergency_alerts: db.emergencyAlert,
    alerts: db.emergencyAlert,
    anomaly_patterns: db.anomalyPattern,
    location_tracks: db.locationTrack,
    device_metrics: db.deviceMetrics,
    tourist_ids: db.touristId,
    digital_tourist_ids: db.touristId,
    blockchain_logs: db.blockchainLog,
    admin_notifications: db.adminNotification,
    safety_scores: db.safetyScore,
    planned_routes: db.travelPlan,
    ai_analyses: db.aiAnalysis,
  }
  return modelMap[table]
}

export async function executeDbQuery(params: {
  table: string
  action: 'select' | 'insert' | 'update' | 'delete'
  filters?: Record<string, any>
  data?: any
  ordering?: { field: string; ascending: boolean } | null
  limit?: number | null
  isSingle?: boolean
  selectFields?: string
}) {
  const { table, action, filters, data, ordering, limit, isSingle, selectFields } = params
  const model = getPrismaModel(table)

  if (!model) {
    throw new Error(`Unsupported database table: ${table}`)
  }

  // Build filters (where clause)
  const where: any = {}
  if (filters) {
    for (const [field, filter] of Object.entries(filters)) {
      const prismaField = toPrismaField(table, field)
      const { op, value } = filter as { op: string; value: any }
      
      let finalValue = value
      if (typeof value === "string" && (
        prismaField.endsWith("At") || 
        prismaField.endsWith("Date") || 
        prismaField.endsWith("From") || 
        prismaField.endsWith("Until") || 
        prismaField === "timestamp"
      )) {
        finalValue = new Date(value)
      }

      if (op === "eq") {
        where[prismaField] = finalValue
      } else if (op === "neq") {
        where[prismaField] = { not: finalValue }
      } else if (op === "gte") {
        where[prismaField] = { gte: finalValue }
      } else if (op === "in") {
        where[prismaField] = { in: finalValue }
      }
    }
  }

  // Handle include relation if selected (like Profiles)
  const include: any = {}
  let includeUser = false
  if (selectFields && (selectFields.includes("profiles") || selectFields.includes("user"))) {
    if (table === "tourist_ids" || table === "digital_tourist_ids" || table === "location_tracks") {
      include.user = true
      includeUser = true
    }
  }

  let includeRelations = false
  if ((table === "profiles" || table === "tourist_profiles") && selectFields) {
    if (selectFields.includes("location_tracks")) {
      include.locationTracks = true
      includeRelations = true
    }
    if (selectFields.includes("safety_scores")) {
      include.safetyScores = true
      includeRelations = true
    }
    if (selectFields.includes("user_alerts")) {
      include.emergencyAlerts = true
      includeRelations = true
    }
  }

  const prismaOptions: any = { where }
  if (Object.keys(include).length > 0) {
    prismaOptions.include = include
  }

  let result: any = null

  if (action === "select") {
    if (ordering) {
      prismaOptions.orderBy = {
        [toPrismaField(table, ordering.field)]: ordering.ascending ? "asc" : "desc"
      }
    }
    if (limit) {
      prismaOptions.take = limit
    }

    if (isSingle) {
      result = await model.findFirst(prismaOptions)
    } else {
      result = await model.findMany(prismaOptions)
    }
  } else if (action === "insert") {
    const prismaData = toPrismaData(table, data)
    result = await model.create({
      data: prismaData,
      ...prismaOptions
    })
  } else if (action === "update") {
    const prismaData = toPrismaData(table, data)
    // Prisma update requires unique identifier, so we fallback to updateMany if where isn't using unique fields
    result = await model.updateMany({
      where,
      data: prismaData
    })
    // Fetch the updated record if isSingle is true
    if (isSingle || table === "profiles" || table === "tourist_profiles") {
      result = await model.findFirst({ where })
    }
  } else if (action === "delete") {
    result = await model.deleteMany({ where })
  }

  // Map result back to database response
  let responseData = fromPrismaData(table, result)

  // Map `user` relation back to `profiles` field
  if (includeUser) {
    const mapUserRelation = (item: any) => {
      if (item && item.user) {
        item.profiles = fromPrismaData("profiles", item.user)
        delete item.user
      }
      return item
    }

    if (Array.isArray(responseData)) {
      responseData = responseData.map(mapUserRelation)
    } else {
      responseData = mapUserRelation(responseData)
    }
  }

  // Map profile subrelations back
  if (includeRelations) {
    const mapProfileRelations = (item: any) => {
      if (!item) return item
      if (item.locationTracks) {
        item.location_tracks = fromPrismaData("location_tracks", item.locationTracks)
        delete item.locationTracks
      }
      if (item.safetyScores) {
        item.safety_scores = fromPrismaData("safety_scores", item.safetyScores)
        delete item.safetyScores
      }
      if (item.emergencyAlerts) {
        item.user_alerts = fromPrismaData("user_alerts", item.emergencyAlerts)
        delete item.emergencyAlerts
      }
      return item
    }

    if (Array.isArray(responseData)) {
      responseData = responseData.map(mapProfileRelations)
    } else {
      responseData = mapProfileRelations(responseData)
    }
  }
  return {
    data: responseData,
    count: Array.isArray(responseData) ? responseData.length : (responseData ? 1 : 0)
  }
}
