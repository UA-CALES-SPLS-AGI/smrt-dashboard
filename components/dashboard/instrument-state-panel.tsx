'use client'

import { useCallback } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { getIcsState } from '@/lib/smrt-api'
import { getRefreshInterval, isEndpointEnabled } from '@/lib/settings-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from './metric-card'
import { StatusBadge } from './status-badge'
import { DataField } from './data-field'
import { SectionHeader } from './section-header'
import { LoadingCard } from './loading-card'
import { ErrorDisplay } from './error-display'
import { Activity, DoorOpen, Play, Hash, Server, Clock, ClipboardCheck, Package, Cpu } from 'lucide-react'

interface InstrumentStatePanelProps {
  instrumentId: string
}

export function InstrumentStatePanel({ instrumentId }: InstrumentStatePanelProps) {
  const fetcher = useCallback(() => getIcsState(instrumentId), [instrumentId])
  const { data, error, loading, lastUpdated, refresh } = usePolling({
    fetcher,
    intervalMs: getRefreshInterval('ics-state'),
    enabled: !!instrumentId && isEndpointEnabled('ics-state'),
  })

  if (loading && !data) return <LoadingCard lines={6} />
  if (error && !data) return <ErrorDisplay message={error} onRetry={refresh} />

  const state = data ?? {} as any

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Instrument State"
        icon={Activity}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        loading={loading}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Overall State"
          value={state?.instrumentOverallState ?? 'Unknown'}
          icon={Server}
          variant={state?.instrumentOverallState === 'IDLE' || state?.instrumentOverallState === 'READY' ? 'success' : state?.instrumentOverallState === 'ERROR' ? 'danger' : 'warning'}
        />
        <MetricCard
          label="Run State"
          value={state?.runState ?? 'None'}
          icon={Play}
          variant={state?.runState === 'IDLE' || state?.runState === 'COMPLETE' ? 'success' : state?.runState === 'RUNNING' ? 'warning' : 'default'}
        />
        <MetricCard
          label="Door State"
          value={state?.doorState ?? 'Unknown'}
          icon={DoorOpen}
          variant={state?.doorState === 'CLOSED' ? 'success' : 'warning'}
        />
        <MetricCard
          label="Active Runs"
          value={state?.numRuns ?? 0}
          icon={Hash}
        />
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">State Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Door Available</p>
              <StatusBadge value={state?.isDoorAvailable} />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Service Mode</p>
              <StatusBadge value={state?.inServiceMode} />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Lockout Mode</p>
              <StatusBadge value={state?.inLockoutMode} />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Power Down Req</p>
              <StatusBadge value={state?.powerDownRequested} />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Loaded Run</p>
              <StatusBadge value={state?.hasLoadedRun} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ICS Timestamps — Readiness & Health Indicators */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            ICS Timestamps &amp; Readiness Checks
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            These timestamps show when ICS last evaluated each subsystem. Stale timestamps may indicate a problem.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <TimestampField
              icon={Package}
              label="Inventory Check"
              value={state?.inventoryTimestamp}
              description="Last check of onboard consumables &amp; storage"
            />
            <TimestampField
              icon={ClipboardCheck}
              label="Run Requirements"
              value={state?.runRequirementsTimestamp}
              description="Last evaluation of run prerequisites (cells, storage, reagents)"
            />
            <TimestampField
              icon={Cpu}
              label="Diagnostics"
              value={state?.diagnosticTimestamp}
              description="Last instrument diagnostic evaluation"
            />
            <TimestampField
              icon={Activity}
              label="Alarms Updated"
              value={state?.alarmsTimestamp}
              description="Last alarm status refresh"
            />
            <TimestampField
              icon={Server}
              label="Configuration"
              value={state?.configurationTimestamp}
              description="Last config sync from instrument"
            />
            <TimestampField
              icon={Play}
              label="Loaded Run"
              value={state?.loadedRunTimestamp}
              description="Timestamp of last loaded run data"
            />
          </div>
        </CardContent>
      </Card>
      {error && <ErrorDisplay message={error} onRetry={refresh} />}
    </div>
  )
}

function TimestampField({ icon: Icon, label, value, description }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value?: string | null
  description: string
}) {
  const formatted = value ? new Date(value).toLocaleString() : null
  const age = value ? getAge(value) : null

  return (
    <div className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
      <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium">{label}</p>
        {formatted ? (
          <>
            <p className="text-xs font-mono text-foreground mt-0.5">{formatted}</p>
            {age && <p className="text-[10px] text-muted-foreground mt-0.5">{age}</p>}
          </>
        ) : (
          <p className="text-xs text-muted-foreground italic mt-0.5">No data</p>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  )
}

function getAge(isoDate: string): string | null {
  try {
    const diff = Date.now() - new Date(isoDate).getTime()
    if (diff < 0) return null
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ${mins % 60}m ago`
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h ago`
  } catch {
    return null
  }
}
