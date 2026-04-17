'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { useSettings } from '@/hooks/use-settings'
import { getInstrumentSummaries, getInstrumentStates, getIcsState, getSystemStatus } from '@/lib/smrt-api'
import { getRefreshInterval, isEndpointEnabled } from '@/lib/settings-store'
import { addSnapshot, initHistory } from '@/lib/history-store'
import { InstrumentStatePanel } from './instrument-state-panel'
import { AlarmsPanel } from './alarms-panel'
import { ConfigPanel } from './config-panel'
import { ConnectionsPanel } from './connections-panel'
import { InstrumentDetailPanel } from './instrument-detail-panel'
import { HistoryChart } from './history-chart'
import { SystemStatusPanel } from './system-status-panel'
import { LoadingCard } from './loading-card'
import { ErrorDisplay } from './error-display'
import { MetricCard } from './metric-card'
import { StatusBadge } from './status-badge'
import { StoragePanel } from './storage-panel'
import { Server, MonitorSpeaker, AlertTriangle, Settings } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function DashboardClient() {
  const { settings } = useSettings()
  const [instrumentId, setInstrumentId] = useState<string>(settings.instrumentId)
  const [serial, setSerial] = useState<string>(settings.serial)
  const [autoDetected, setAutoDetected] = useState(false)

  // Initialize history
  useEffect(() => { initHistory() }, [])

  // Fetch instrument summaries for auto-detection
  const summaryFetcher = useCallback(() => getInstrumentSummaries(), [])
  const { data: summaries, error: summaryError, loading: summaryLoading, refresh: refreshSummaries } = usePolling({
    fetcher: summaryFetcher,
    intervalMs: getRefreshInterval('instrument-summaries'),
    enabled: isEndpointEnabled('instrument-summaries'),
  })

  // Fetch connections for serial mapping
  const statesFetcher = useCallback(() => getInstrumentStates(), [])
  const { data: states } = usePolling({
    fetcher: statesFetcher,
    intervalMs: getRefreshInterval('instrument-states'),
    enabled: isEndpointEnabled('instrument-states'),
  })

  // Auto-detect instrument
  useEffect(() => {
    if (!settings.autoDetect || autoDetected) return
    if (Array.isArray(summaries) && summaries.length > 0) {
      const first = summaries[0]
      if (!instrumentId && first?.id != null) {
        setInstrumentId(String(first.id))
      }
      // Try to find serial from states or connections
      if (!serial && Array.isArray(states) && states.length > 0) {
        setSerial(states[0]?.serial || '')
      }
      setAutoDetected(true)
    }
  }, [summaries, states, settings.autoDetect, autoDetected, instrumentId, serial])

  // Use manual settings if auto-detect is off
  useEffect(() => {
    if (!settings.autoDetect) {
      setInstrumentId(settings.instrumentId)
      setSerial(settings.serial)
    }
  }, [settings.autoDetect, settings.instrumentId, settings.serial])

  // Poll instrument state and save snapshots
  const stateFetcher = useCallback(() => getIcsState(instrumentId), [instrumentId])
  const handleStateData = useCallback((data: any) => {
    if (!data) return
    addSnapshot({
      overallState: data?.instrumentOverallState ?? 'UNKNOWN',
      runState: data?.runState ?? 'UNKNOWN',
      doorState: data?.doorState ?? 'UNKNOWN',
      numRuns: data?.numRuns ?? 0,
      alarmCount: 0,
    })
  }, [])

  const { data: stateData } = usePolling({
    fetcher: stateFetcher,
    intervalMs: getRefreshInterval('ics-state'),
    enabled: !!instrumentId && isEndpointEnabled('ics-state'),
    onData: handleStateData,
  })

  const summaryList = Array.isArray(summaries) ? summaries : []
  const hasInstrument = !!instrumentId
  const needsConfig = !instrumentId && !summaryLoading && summaryList.length === 0

  if (summaryLoading && !summaries) {
    return (
      <div className="space-y-6">
        <LoadingCard lines={3} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LoadingCard lines={5} />
          <LoadingCard lines={5} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold tracking-tight">Instrument Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {hasInstrument
              ? `Monitoring instrument ${instrumentId}${serial ? ` (${serial})` : ''}`
              : 'Waiting for instrument data...'}
          </p>
        </div>
        <Link href="/settings">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" /> Settings
          </Button>
        </Link>
      </div>

      {/* Instrument Summary Cards */}
      {summaryList.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summaryList.map((s: any) => (
            <Card
              key={s?.id ?? s?.name}
              className={`cursor-pointer transition-all hover:shadow-md ${
                String(s?.id) === instrumentId ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => {
                setInstrumentId(String(s?.id ?? ''))
                if (s?.name) setSerial(s.name)
              }}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <MonitorSpeaker className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium truncate">{s?.name ?? 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{s?.instrumentType ?? ''}</span>
                  <StatusBadge value={s?.isConnected} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Transfer: {s?.transferSchemeType ?? 'N/A'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {summaryError && <ErrorDisplay message={summaryError} onRetry={refreshSummaries} />}

      {needsConfig && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
            <p className="text-sm font-medium">No instruments auto-detected</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Check the API connection or manually configure the instrument ID in Settings.
            </p>
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" /> Open Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* System Status */}
      <SystemStatusPanel />

      {/* Main Panels */}
      {hasInstrument && (
        <>
          <InstrumentStatePanel instrumentId={instrumentId} />
          <AlarmsPanel instrumentId={instrumentId} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ConfigPanel instrumentId={instrumentId} />
            <InstrumentDetailPanel serial={serial || instrumentId} />
          </div>
          <ConnectionsPanel />
          <StoragePanel compact />
          <HistoryChart />
        </>
      )}
    </div>
  )
}
