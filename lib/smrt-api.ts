// Client-side SMRT Link API client
// All calls go through the configurable API base path (Apache reverse proxy)

import { getSettings } from './settings-store'

function getBaseUrl(): string {
  const settings = getSettings()
  return settings.apiBasePath || '/smrtlink-api'
}

async function fetchApi<T = any>(path: string, timeoutMs: number = 8000): Promise<T> {
  const baseUrl = getBaseUrl()
  const url = `${baseUrl}${path}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) {
      throw new Error(`API ${res.status}: ${res.statusText} (${path})`)
    }
    return await res.json()
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(`Request timed out: ${path}`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

// === SMRT Link System ===
export async function getSystemStatus() {
  return fetchApi('/status')
}

export async function getSystemAlarms() {
  return fetchApi('/smrt-link/alarms')
}

// === Discovery Endpoints ===
export async function getInstrumentSummaries() {
  return fetchApi('/smrt-link/instrument-config/summary')
}

export async function getInstrumentStates() {
  return fetchApi('/smrt-link/instruments')
}

// === ICS Endpoints (require integer instrumentId) ===
export async function getIcsState(instrumentId: number | string) {
  return fetchApi(`/ics/${instrumentId}/state`)
}

export async function getIcsAlarms(instrumentId: number | string) {
  return fetchApi(`/ics/${instrumentId}/alarms`)
}

export async function getIcsConfiguration(instrumentId: number | string) {
  return fetchApi(`/ics/${instrumentId}/configuration`)
}

export async function getIcsTimezone(instrumentId: number | string) {
  return fetchApi(`/ics/${instrumentId}/configuration/timezone`)
}

export async function getIcsTransferTest(instrumentId: number | string) {
  return fetchApi(`/ics/${instrumentId}/configuration/transferscheme/test`)
}

export async function getIcsRun(instrumentId: number | string, runId: string) {
  return fetchApi(`/ics/${instrumentId}/runs/${encodeURIComponent(runId)}`)
}

// === Instrument Config Endpoints ===
export async function getConnections() {
  return fetchApi('/smrt-link/instrument-config/connections')
}

export async function getConnectionDetail(instrumentId: string) {
  return fetchApi(`/smrt-link/instrument-config/connections/${encodeURIComponent(instrumentId)}`)
}

export async function getFileTransferLocations() {
  return fetchApi('/smrt-link/instrument-config/file-transfer')
}

export async function getFileTransferDetail(locationId: string) {
  return fetchApi(`/smrt-link/instrument-config/file-transfer/${encodeURIComponent(locationId)}`)
}

// === Disk Space ===
export async function getDiskSpace(): Promise<DiskSpaceResource[]> {
  return fetchApi('/smrt-link/disk-space')
}

export async function getDiskSpaceByResource(resourceId: string) {
  return fetchApi(`/smrt-link/disk-space/${encodeURIComponent(resourceId)}`)
}

export interface DiskSpaceResource {
  id?: string
  path?: string
  totalSpace: number
  freeSpace: number
  usableSpace: number
}
