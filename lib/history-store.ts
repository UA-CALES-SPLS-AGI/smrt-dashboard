// In-memory + localStorage history store for state snapshots

export interface StateSnapshot {
  timestamp: string
  overallState: string
  runState: string
  doorState: string
  numRuns: number
  alarmCount: number
}

const HISTORY_KEY = 'smrt-dashboard-history'
const MAX_ENTRIES = 100

let memoryStore: StateSnapshot[] = []
let initialized = false

function loadFromStorage(): StateSnapshot[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveToStorage(entries: StateSnapshot[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)))
  } catch {
    // Storage full — trim more aggressively
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(-20)))
    } catch { /* give up */ }
  }
}

export function initHistory() {
  if (initialized) return
  memoryStore = loadFromStorage()
  initialized = true
}

export function addSnapshot(snapshot: Omit<StateSnapshot, 'timestamp'>) {
  if (!initialized) initHistory()
  const entry: StateSnapshot = {
    ...snapshot,
    timestamp: new Date().toISOString(),
  }
  memoryStore.push(entry)
  if (memoryStore.length > MAX_ENTRIES) {
    memoryStore = memoryStore.slice(-MAX_ENTRIES)
  }
  saveToStorage(memoryStore)
}

export function getHistory(): StateSnapshot[] {
  if (!initialized) initHistory()
  return [...memoryStore]
}

export function clearHistory() {
  memoryStore = []
  if (typeof window !== 'undefined') {
    localStorage.removeItem(HISTORY_KEY)
  }
}
