'use client'

import { useCallback } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { getIcsConfiguration, getIcsTimezone, getIcsTransferTest } from '@/lib/smrt-api'
import { getRefreshInterval, isEndpointEnabled } from '@/lib/settings-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionHeader } from './section-header'
import { LoadingCard } from './loading-card'
import { ErrorDisplay } from './error-display'
import { DataField } from './data-field'
import { StatusBadge } from './status-badge'
import { Settings, Globe, ArrowRightLeft } from 'lucide-react'

interface ConfigPanelProps {
  instrumentId: string
}

export function ConfigPanel({ instrumentId }: ConfigPanelProps) {
  const configFetcher = useCallback(() => getIcsConfiguration(instrumentId), [instrumentId])
  const tzFetcher = useCallback(() => getIcsTimezone(instrumentId), [instrumentId])
  const ttFetcher = useCallback(() => getIcsTransferTest(instrumentId), [instrumentId])

  const { data: config, error: configError, loading: configLoading, lastUpdated, refresh: refreshConfig } = usePolling({
    fetcher: configFetcher,
    intervalMs: getRefreshInterval('ics-configuration'),
    enabled: !!instrumentId && isEndpointEnabled('ics-configuration'),
  })

  const { data: tz } = usePolling({
    fetcher: tzFetcher,
    intervalMs: getRefreshInterval('ics-timezone'),
    enabled: !!instrumentId && isEndpointEnabled('ics-timezone'),
  })

  const { data: tt } = usePolling({
    fetcher: ttFetcher,
    intervalMs: getRefreshInterval('ics-transfer-test'),
    enabled: !!instrumentId && isEndpointEnabled('ics-transfer-test'),
  })

  if (configLoading && !config) return <LoadingCard lines={5} />
  if (configError && !config) return <ErrorDisplay message={configError} onRetry={refreshConfig} />

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Configuration"
        icon={Settings}
        lastUpdated={lastUpdated}
        onRefresh={refreshConfig}
        loading={configLoading}
      />
      <div className="grid grid-cols-1 gap-4">
        {/* ICS Configuration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" /> ICS Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <DataField label="Serial Number" value={config?.serialNumber} mono />
              <DataField label="Instrument Name" value={config?.name} />
              <DataField label="ICS Version" value={config?.icsVersion} mono />
              <DataField label="Last Updated" value={config?.timestamp ? new Date(config.timestamp).toLocaleString() : null} mono />
            </div>
          </CardContent>
        </Card>

        {/* Timezone */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Timezone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <DataField label="Timezone" value={tz?.name} />
              <DataField label="Display Name" value={tz?.displayName} />
              <DataField label="Full Display" value={tz?.displayNameAndZone} />
              <DataField label="Coordinates" value={tz?.latitude != null && tz?.longitude != null ? `${tz.latitude.toFixed(2)}, ${tz.longitude.toFixed(2)}` : null} mono />
            </div>
          </CardContent>
        </Card>

        {/* Transfer Test */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-primary" /> Transfer Scheme Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">State</p>
                <StatusBadge value={tt?.state} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">In Progress</p>
                <StatusBadge value={tt?.isInProgress} />
              </div>
              <DataField label="Runtime (s)" value={tt?.runTimeSec?.toFixed?.(2)} mono />
              <DataField label="Message" value={tt?.message} />
              <DataField label="UUID" value={tt?.uuid} mono />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
