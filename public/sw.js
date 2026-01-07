// Enhanced Emergency Alert Service Worker with improved offline capabilities
let adminConnections = new Map()
let emergencyMeshNetwork = null
let offlineAlertQueue = []

self.addEventListener('install', (event) => {
  console.log('Enhanced Emergency Alert Service Worker installed')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Enhanced Emergency Alert Service Worker activated')
  event.waitUntil(Promise.all([
    setupEmergencyMeshNetwork(),
    initializeOfflineStorage(),
    setupPeriodicSync()
  ]))
})

self.addEventListener('message', async (event) => {
  const { type, data, clientId } = event.data
  
  switch (type) {
    case 'REGISTER_ADMIN':
      adminConnections.set(clientId, event.ports[0])
      break
    case 'EMERGENCY_ALERT':
      await handleEmergencyAlert(data)
      break
    case 'EMERGENCY_ALERT_BROADCAST':
      await broadcastEmergencyAlert(data)
      break
  }
})

// Enhanced background sync for offline alerts
self.addEventListener('sync', (event) => {
  if (event.tag === 'emergency-alert-sync') {
    event.waitUntil(syncOfflineAlerts())
  }
})

async function setupEmergencyMeshNetwork() {
  try {
    emergencyMeshNetwork = new BroadcastChannel('emergency-mesh-enhanced')
    
    emergencyMeshNetwork.onmessage = async (event) => {
      if (event.data.type === 'EMERGENCY_ALERT') {
        await relayToAdmins(event.data)
        await storeOfflineAlert(event.data)
      }
    }
    
    console.log('Enhanced emergency mesh network setup complete')
  } catch (error) {
    console.error('Mesh network setup failed:', error)
  }
}

async function handleEmergencyAlert(alertData) {
  try {
    // Store in offline queue
    await storeOfflineAlert(alertData)
    
    // Broadcast to mesh network
    if (emergencyMeshNetwork) {
      emergencyMeshNetwork.postMessage({
        type: 'EMERGENCY_ALERT',
        data: alertData,
        timestamp: Date.now(),
        offline: !navigator.onLine
      })
    }

    // Relay to connected admins
    await relayToAdmins({ data: alertData })
    
    // Show critical notification
    await showCriticalNotification(alertData)
    
  } catch (error) {
    console.error('Error handling emergency alert:', error)
  }
}

async function relayToAdmins(alertData) {
  const adminMessage = {
    type: 'EMERGENCY_ALERT_RECEIVED',
    data: alertData.data,
    timestamp: Date.now(),
    offline: !navigator.onLine
  }

  // Send to all connected admin clients
  const clients = await self.clients.matchAll()
  clients.forEach(client => {
    client.postMessage(adminMessage)
  })

  // Send via MessageChannel to registered admins
  adminConnections.forEach((port, clientId) => {
    try {
      port.postMessage(adminMessage)
    } catch (error) {
      console.error(`Failed to send to admin ${clientId}:`, error)
      adminConnections.delete(clientId)
    }
  })
}

async function showCriticalNotification(alertData) {
  const notificationOptions = {
    body: `OFFLINE ALERT: ${alertData.type.toUpperCase()} - ${alertData.message}`,
    icon: '/placeholder-logo.png',
    badge: '/placeholder-logo.png',
    tag: `emergency-alert-${alertData.user_id}`,
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200, 100, 200],
    actions: [
      {
        action: 'view',
        title: 'View Alert'
      },
      {
        action: 'acknowledge',
        title: 'Acknowledge'
      }
    ],
    data: alertData
  }

  await self.registration.showNotification('🚨 CRITICAL EMERGENCY ALERT', notificationOptions)
}

async function storeOfflineAlert(alertData) {
  try {
    const db = await openDB()
    const transaction = db.transaction(['alerts'], 'readwrite')
    const store = transaction.objectStore('alerts')
    
    const alertWithId = {
      ...alertData,
      id: `offline-${Date.now()}-${Math.random()}`,
      storedAt: new Date().toISOString(),
      synced: false
    }
    
    await store.add(alertWithId)
    offlineAlertQueue.push(alertWithId)
    
  } catch (error) {
    console.error('Failed to store offline alert:', error)
  }
}

async function syncOfflineAlerts() {
  if (!navigator.onLine) return
  
  try {
    const db = await openDB()
    const alerts = await getAllUnsynced(db)
    
    for (const alert of alerts) {
      try {
        const response = await fetch('/api/emergency/sync-offline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        })
        
        if (response.ok) {
          await markAsSynced(db, alert.id)
        }
      } catch (error) {
        console.error('Failed to sync alert:', error)
      }
    }
  } catch (error) {
    console.error('Sync process failed:', error)
  }
}

async function setupPeriodicSync() {
  // Attempt sync every 30 seconds when online
  setInterval(async () => {
    if (navigator.onLine && offlineAlertQueue.length > 0) {
      await syncOfflineAlerts()
    }
  }, 30000)
}

// Enhanced IndexedDB operations
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EmergencyAlertsEnhanced', 2)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      if (!db.objectStoreNames.contains('alerts')) {
        const store = db.createObjectStore('alerts', { keyPath: 'id' })
        store.createIndex('timestamp', 'created_at')
        store.createIndex('synced', 'synced')
        store.createIndex('type', 'type')
      }
    }
  })
}

async function getAllUnsynced(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['alerts'], 'readonly')
    const store = transaction.objectStore('alerts')
    const index = store.index('synced')
    const request = index.getAll(false)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

async function markAsSynced(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['alerts'], 'readwrite')
    const store = transaction.objectStore('alerts')
    const request = store.get(id)
    
    request.onsuccess = () => {
      const alert = request.result
      if (alert) {
        alert.synced = true
        alert.syncedAt = new Date().toISOString()
        store.put(alert)
      }
      resolve()
    }
    request.onerror = () => reject(request.error)
  })
}

// Handle notification interactions
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const alertData = event.notification.data
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(`/admin?alert=${alertData.user_id}`)
    )
  } else if (event.action === 'acknowledge') {
    // Send acknowledgment
    event.waitUntil(
      fetch('/api/emergency/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId: alertData.user_id })
      }).catch(() => {
        // Store acknowledgment for later sync
        storeOfflineAlert({
          ...alertData,
          type: 'acknowledgment',
          acknowledgedAt: new Date().toISOString()
        })
      })
    )
  }
})
