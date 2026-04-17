// Client-side settings store using localStorage

export interface DashboardSettings {
  apiBasePath: string
  instrumentId: string  // integer for ICS endpoints
  serial: string        // string for SMRT Link endpoints
  autoDetect: boolean   // auto-detect instrument from API
  refreshIntervals: Record<string, number> // endpoint key -> ms
  enabledEndpoints: Record<string, boolean>
}

const STORAGE_KEY = 'smrt-dashboard-settings'

const DEFAULT_REFRESH_INTERVALS: Record<string, number> = {
  'system-status': 30000,
  'system-alarms': 30000,
  'ics-state': 10000,
  'ics-alarms': 15000,
  'ics-configuration': 60000,
  'ics-timezone': 120000,
  'ics-transfer-test': 60000,
  'connections': 30000,
  'file-transfers': 60000,
  'instrument-summaries': 30000,
  'instrument-states': 30000,
  'disk-space': 60000,
}

const DEFAULT_SETTINGS: DashboardSettings = {
  apiBasePath: '/smrtlink-api',
  instrumentId: '',
  serial: '',
  autoDetect: true,
  refreshIntervals: DEFAULT_REFRESH_INTERVALS,
  enabledEndpoints: Object.fromEntries(
    Object.keys(DEFAULT_REFRESH_INTERVALS).map(k => [k, true])
  ),
}

export function getSettings(): DashboardSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_SETTINGS
    const parsed = JSON.parse(stored)
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      refreshIntervals: { ...DEFAULT_REFRESH_INTERVALS, ...(parsed.refreshIntervals || {}) },
      enabledEndpoints: {
        ...Object.fromEntries(Object.keys(DEFAULT_REFRESH_INTERVALS).map(k => [k, true])),
        ...(parsed.enabledEndpoints || {}),
      },
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Partial<DashboardSettings>) {
  if (typeof window === 'undefined') return
  const current = getSettings()
  const updated = { ...current, ...settings }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  // Dispatch custom event so other components can react
  window.dispatchEvent(new CustomEvent('smrt-settings-changed', { detail: updated }))
}

export function getRefreshInterval(key: string): number {
  const settings = getSettings()
  return settings.refreshIntervals[key] ?? 30000
}

export function isEndpointEnabled(key: string): boolean {
  const settings = getSettings()
  return settings.enabledEndpoints[key] !== false
}

export const ENDPOINT_LABELS: Record<string, { label: string; category: string; description: string }> = {
  'system-status': { label: 'System Status', category: 'System', description: 'GET /status' },
  'system-alarms': { label: 'System Alarms', category: 'System', description: 'GET /smrt-link/alarms' },
  'ics-state': { label: 'Instrument State', category: 'ICS', description: 'GET /ics/{id}/state' },
  'ics-alarms': { label: 'Instrument Alarms', category: 'ICS', description: 'GET /ics/{id}/alarms' },
  'ics-configuration': { label: 'ICS Configuration', category: 'ICS', description: 'GET /ics/{id}/configuration' },
  'ics-timezone': { label: 'Timezone', category: 'ICS', description: 'GET /ics/{id}/configuration/timezone' },
  'ics-transfer-test': { label: 'Transfer Scheme Test', category: 'ICS', description: 'GET /ics/{id}/configuration/transferscheme/test' },
  'connections': { label: 'Connections', category: 'Config', description: 'GET /smrt-link/instrument-config/connections' },
  'file-transfers': { label: 'File Transfers', category: 'Config', description: 'GET /smrt-link/instrument-config/file-transfer' },
  'instrument-summaries': { label: 'Instrument Summaries', category: 'Discovery', description: 'GET /smrt-link/instrument-config/summary' },
  'instrument-states': { label: 'Instrument States', category: 'Discovery', description: 'GET /smrt-link/instruments' },
  'disk-space': { label: 'Disk Space', category: 'System', description: 'GET /smrt-link/disk-space' },
}
