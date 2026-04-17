'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSettings } from '@/hooks/use-settings'
import { usePolling } from '@/hooks/use-polling'
import { getInstrumentSummaries, getInstrumentStates } from '@/lib/smrt-api'
import { getRefreshInterval, isEndpointEnabled } from '@/lib/settings-store'
import { InstrumentStatePanel } from '@/components/dashboard/instrument-state-panel'
import { InstrumentDetailPanel } from '@/components/dashboard/instrument-detail-panel'
import { LoadingCard } from '@/components/dashboard/loading-card'

export default function StatusPage() {
  const { settings } = useSettings()
  const [instrumentId, setInstrumentId] = useState(settings.instrumentId)
  const [serial, setSerial] = useState(settings.serial)

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
      setSerial(settings.serial)
    }
  }, [summaries, settings, instrumentId])

  if (!instrumentId) return <LoadingCard lines={6} />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold tracking-tight">Instrument Status</h1>
      <InstrumentStatePanel instrumentId={instrumentId} />
      <InstrumentDetailPanel serial={serial || instrumentId} />
    </div>
  )
}
