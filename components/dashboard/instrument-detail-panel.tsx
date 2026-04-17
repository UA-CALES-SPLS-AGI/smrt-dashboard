'use client'

import { useCallback } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { getConnectionDetail } from '@/lib/smrt-api'
import { getRefreshInterval, isEndpointEnabled } from '@/lib/settings-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionHeader } from './section-header'
import { LoadingCard } from './loading-card'
import { ErrorDisplay } from './error-display'
import { DataField } from './data-field'
import { StatusBadge } from './status-badge'
import { Plug, Cpu } from 'lucide-react'

interface InstrumentDetailPanelProps {
  serial: string
}

export function InstrumentDetailPanel({ serial }: InstrumentDetailPanelProps) {
  const fetcher = useCallback(() => getConnectionDetail(serial), [serial])
  const { data: connection, error, loading, lastUpdated, refresh } = usePolling({
    fetcher,
    intervalMs: getRefreshInterval('connections'),
    enabled: !!serial && isEndpointEnabled('connections'),
  })

  if (loading && !connection) return <LoadingCard lines={4} />
  if (error && !connection) return <ErrorDisplay message={error} onRetry={refresh} />

  return (
    <div className="space-y-4">
      <SectionHeader
        title="SMRT Link Details"
        icon={Cpu}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        loading={loading}
      />
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Plug className="h-4 w-4 text-primary" /> Connection Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <DataField label="Name" value={connection?.name} />
            <DataField label="Serial" value={connection?.serial} mono />
            <DataField label="IP Address" value={connection?.ipAddress} mono />
            <DataField label="Port" value={connection?.port} mono />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Connected</p>
              <StatusBadge value={connection?.isConnected} />
            </div>
            <DataField label="Credentials" value={connection?.credentials ? '\u2022\u2022\u2022\u2022\u2022\u2022' : 'None'} />
          </div>
        </CardContent>
      </Card>
      {error && <ErrorDisplay message={error} onRetry={refresh} />}
    </div>
  )
}
