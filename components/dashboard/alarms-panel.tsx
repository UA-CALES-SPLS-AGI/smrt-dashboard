'use client'

import { useCallback } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { getIcsAlarms } from '@/lib/smrt-api'
import { getRefreshInterval, isEndpointEnabled } from '@/lib/settings-store'
import { Card, CardContent } from '@/components/ui/card'
import { SectionHeader } from './section-header'
import { LoadingCard } from './loading-card'
import { ErrorDisplay } from './error-display'
import { Bell, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface AlarmsPanelProps {
  instrumentId: string
}

const severityConfig: Record<string, { icon: any; color: string }> = {
  'ERROR': { icon: XCircle, color: 'text-red-500' },
  'CRITICAL': { icon: XCircle, color: 'text-red-600' },
  'WARNING': { icon: AlertTriangle, color: 'text-amber-500' },
  'INFO': { icon: Info, color: 'text-blue-500' },
}

export function AlarmsPanel({ instrumentId }: AlarmsPanelProps) {
  const fetcher = useCallback(() => getIcsAlarms(instrumentId), [instrumentId])
  const { data, error, loading, lastUpdated, refresh } = usePolling({
    fetcher,
    intervalMs: getRefreshInterval('ics-alarms'),
    enabled: !!instrumentId && isEndpointEnabled('ics-alarms'),
  })

  if (loading && !data) return <LoadingCard lines={4} />
  if (error && !data) return <ErrorDisplay message={error} onRetry={refresh} />

  const alarms = data?.alarms ?? []

  return (
    <div className="space-y-4">
      <SectionHeader
        title={`Instrument Alarms (${alarms.length})`}
        icon={Bell}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        loading={loading}
      />
      {alarms.length === 0 ? (
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
            <p className="text-sm font-medium">No Active Alarms</p>
            <p className="text-xs text-muted-foreground">All systems operating normally</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <ScrollArea className="max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Severity</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="w-40">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alarms.map((alarm: any, idx: number) => {
                  const sev = severityConfig[alarm?.severity?.toUpperCase?.()] ?? severityConfig['INFO']
                  const SevIcon = sev?.icon ?? Info
                  return (
                    <TableRow key={alarm?.id ?? idx}>
                      <TableCell>
                        <div className={cn('flex items-center gap-1.5', sev?.color)}>
                          <SevIcon className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">{alarm?.severity ?? 'UNKNOWN'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{alarm?.name ?? '\u2014'}</TableCell>
                      <TableCell className="text-sm">{alarm?.publicMessage ?? alarm?.message ?? '\u2014'}</TableCell>
                      <TableCell className="text-xs font-mono">{alarm?.source ?? '\u2014'}</TableCell>
                      <TableCell className="text-xs font-mono">
                        {alarm?.when ? new Date(alarm.when).toLocaleString() : '\u2014'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      )}
      {error && <ErrorDisplay message={error} onRetry={refresh} />}
    </div>
  )
}
