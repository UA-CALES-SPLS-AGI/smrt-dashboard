'use client'

import { useCallback } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { getSystemStatus, getSystemAlarms } from '@/lib/smrt-api'
import { getRefreshInterval, isEndpointEnabled } from '@/lib/settings-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionHeader } from './section-header'
import { LoadingCard } from './loading-card'
import { ErrorDisplay } from './error-display'
import { DataField } from './data-field'
import { StatusBadge } from './status-badge'
import { MetricCard } from './metric-card'
import { Server, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function SystemStatusPanel() {
  const statusFetcher = useCallback(() => getSystemStatus(), [])
  const alarmsFetcher = useCallback(() => getSystemAlarms(), [])

  const { data: status, error: statusError, loading: statusLoading, lastUpdated, refresh } = usePolling({
    fetcher: statusFetcher,
    intervalMs: getRefreshInterval('system-status'),
    enabled: isEndpointEnabled('system-status'),
  })

  const { data: alarms } = usePolling({
    fetcher: alarmsFetcher,
    intervalMs: getRefreshInterval('system-alarms'),
    enabled: isEndpointEnabled('system-alarms'),
  })

  if (statusLoading && !status) return <LoadingCard lines={3} />
  if (statusError && !status) return <ErrorDisplay message={statusError} onRetry={refresh} />

  const systemAlarms = Array.isArray(alarms) ? alarms : []
  const activeAlarms = systemAlarms.filter((a: any) => a?.severity !== 'CLEAR')

  return (
    <div className="space-y-4">
      <SectionHeader
        title="SMRT Link System"
        icon={Server}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        loading={statusLoading}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="System Status"
          value={status?.status ?? status?.message ?? 'Unknown'}
          icon={Server}
          variant={status?.status === 'running' || status?.message ? 'success' : 'warning'}
        />
        <MetricCard
          label="System Alarms"
          value={activeAlarms.length}
          icon={AlertTriangle}
          variant={activeAlarms.length === 0 ? 'success' : 'danger'}
        />
        <MetricCard
          label="Version"
          value={status?.version ?? status?.smrtlinkVersion ?? 'N/A'}
          icon={Server}
        />
        <MetricCard
          label="Uptime"
          value={status?.uptime ? `${Math.floor(Number(status.uptime) / 3600)}h` : (status?.uptimeSec ? `${Math.floor(Number(status.uptimeSec) / 3600)}h` : 'N/A')}
          icon={Clock}
        />
      </div>

      {/* System Alarms */}
      {activeAlarms.length > 0 && (
        <Card className="border-amber-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> System Alarms ({activeAlarms.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeAlarms.map((alarm: any, idx: number) => (
              <div key={alarm?.id ?? idx} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                <Badge
                  variant="secondary"
                  className={cn(
                    alarm?.severity === 'ERROR' || alarm?.severity === 'CRITICAL' || alarm?.severity === 'FATAL'
                      ? 'bg-red-500/15 text-red-600 border-red-500/30'
                      : 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                  )}
                >
                  {alarm?.severity}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm font-medium">{alarm?.id ?? 'Unknown alarm'}</p>
                  <p className="text-xs text-muted-foreground">{alarm?.message}</p>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {alarm?.value != null ? `${(Number(alarm.value) * 100).toFixed(0)}%` : ''}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
