'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSettings } from '@/hooks/use-settings'
import { usePolling } from '@/hooks/use-polling'
import { getInstrumentSummaries } from '@/lib/smrt-api'
import { getRefreshInterval, isEndpointEnabled } from '@/lib/settings-store'
import { AlarmsPanel } from '@/components/dashboard/alarms-panel'
import { SystemStatusPanel } from '@/components/dashboard/system-status-panel'
import { LoadingCard } from '@/components/dashboard/loading-card'

export default function AlarmsPage() {
  const { settings } = useSettings()
  const [instrumentId, setInstrumentId] = useState(settings.instrumentId)

  const summaryFetcher = useCallback(() => getInstrumentSummaries(), [])
  const { data: summaries } = usePolling({
    fetcher: summaryFetcher,
    intervalMs: getRefreshInterval('instrument-summaries'),
    enabled: settings.autoDetect && isEndpointEnabled('instrument-summaries'),
  })

  useEffect(() => {
    if (settings.autoDetect && Array.isArray(summaries) && summaries.length > 0 && !instrumentId) {
      setInstrumentId(String(summaries[0]?.id ?? ''))
    }
    if (!settings.autoDetect) {
      setInstrumentId(settings.instrumentId)
    }
  }, [summaries, settings, instrumentId])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold tracking-tight">Alarms</h1>
      <SystemStatusPanel />
      {instrumentId ? <AlarmsPanel instrumentId={instrumentId} /> : <LoadingCard lines={4} />}
    </div>
  )
}
