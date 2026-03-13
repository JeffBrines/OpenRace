import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

interface OpenRaceDB extends DBSchema {
  timeRecords: {
    key: string
    value: {
      id: string
      stage_id: string
      rider_id: string | null
      timestamp: number
      type: 'start' | 'finish'
      device_id: string
      synced: boolean
      created_at: number
    }
    indexes: {
      'by-stage': string
      'by-synced': boolean
    }
  }
}

const DB_NAME = 'openrace'
const DB_VERSION = 1

export type TimeRecordLocal = OpenRaceDB['timeRecords']['value']

let dbPromise: Promise<IDBPDatabase<OpenRaceDB>> | null = null

export function getDb(): Promise<IDBPDatabase<OpenRaceDB>> {
  if (!dbPromise) {
    dbPromise = openDB<OpenRaceDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('timeRecords', { keyPath: 'id' })
        store.createIndex('by-stage', 'stage_id')
        store.createIndex('by-synced', 'synced')
      },
    })
  }
  return dbPromise
}

/**
 * Resets the cached db promise. Use in tests between test cases so each test
 * gets a fresh database instance (fake-indexeddb creates a new IDB per open).
 */
export function resetDb(): void {
  dbPromise = null
}
