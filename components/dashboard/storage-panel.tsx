'use client'

import { useCallback } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { getDiskSpace, DiskSpaceResource } from '@/lib/smrt-api'
import { getRefreshInterval, isEndpointEnabled } from '@/lib/settings-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionHeader } from './section-header'
import { LoadingCard } from './loading-card'
import { ErrorDisplay } from './error-display'
import { HardDrive, Database, FolderOpen, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(i > 1 ? 1 : 0)} ${units[i]}`
}

function getResourceIcon(id: string | undefined | null) {
  if (!id) return HardDrive
  if (id.includes('jobs')) return Database
  if (id.includes('tmp')) return FolderOpen
  return HardDrive
}

function getResourceLabel(resource: DiskSpaceResource): string {
  if (!resource.id) return resource.path || 'Unknown'
  const idParts = resource.id.split('.')
  const shortId = idParts[idParts.length - 1] || resource.id
  const labels: Record<string, string> = {
    root: 'SMRT Link Root',
    jobs_root: 'Jobs Directory',
    tmp_dir: 'Temp Directory',
  }
  return labels[shortId] || shortId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function getUsageColor(pct: number): string {
  if (pct >= 90) return 'bg-red-500'
  if (pct >= 80) return 'bg-amber-500'
  if (pct >= 60) return 'bg-yellow-400'
  return 'bg-emerald-500'
}

function getUsageTextColor(pct: number): string {
  if (pct >= 90) return 'text-red-600 dark:text-red-400'
  if (pct >= 80) return 'text-amber-600 dark:text-amber-400'
  return 'text-foreground'
}

interface StoragePanelProps {
  compact?: boolean
}

export function StoragePanel({ compact = false }: StoragePanelProps) {
  const fetcher = useCallback(() => getDiskSpace(), [])
  const { data, error, loading, lastUpdated, refresh } = usePolling<DiskSpaceResource[]>({
    fetcher,
    intervalMs: getRefreshInterval('disk-space'),
    enabled: isEndpointEnabled('disk-space'),
  })

  if (loading && !data) return <LoadingCard lines={compact ? 3 : 5} />
  if (error && !data) return <ErrorDisplay message={error} onRetry={refresh} />

  const resources = Array.isArray(data) ? data : []

  if (resources.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <HardDrive className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No disk space data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {!compact && (
        <SectionHeader
          title="SMRT Link Server Storage"
          icon={HardDrive}
          lastUpdated={lastUpdated}
          onRefresh={refresh}
          loading={loading}
        />
      )}
      <div className={cn(
        'grid gap-4',
        compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
      )}>
        {resources.map((resource) => {
          const used = resource.totalSpace - resource.freeSpace
          const usedPct = resource.totalSpace > 0 ? (used / resource.totalSpace) * 100 : 0
          const usablePct = resource.totalSpace > 0 ? (resource.usableSpace / resource.totalSpace) * 100 : 0
          const Icon = getResourceIcon(resource.id)
          const resourceKey = resource.id || resource.path || String(Math.random())

          return (
            <Card key={resourceKey} className={cn(
              'transition-all',
              usedPct >= 90 && 'ring-2 ring-red-500/50 shadow-red-100 dark:shadow-red-900/20',
              usedPct >= 80 && usedPct < 90 && 'ring-1 ring-amber-500/30'
            )}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  {getResourceLabel(resource)}
                  {usedPct >= 80 && (
                    <AlertTriangle className={cn(
                      'h-3.5 w-3.5 ml-auto',
                      usedPct >= 90 ? 'text-red-500' : 'text-amber-500'
                    )} />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Usage bar */}
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className={cn('text-2xl font-bold tabular-nums', getUsageTextColor(usedPct))}>
                      {usedPct.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground">used</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', getUsageColor(usedPct))}
                      style={{ width: `${Math.min(usedPct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Used</p>
                    <p className="text-xs font-semibold font-mono">{formatBytes(used)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Free</p>
                    <p className="text-xs font-semibold font-mono">{formatBytes(resource.freeSpace)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
                    <p className="text-xs font-semibold font-mono">{formatBytes(resource.totalSpace)}</p>
                  </div>
                </div>

                {/* Usable space note */}
                <div className="pt-1 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Usable</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {formatBytes(resource.usableSpace)} ({usablePct.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* Path */}
                {resource.path && (
                  <p className="text-[10px] text-muted-foreground font-mono truncate" title={resource.path}>
                    {resource.path}
                  </p>
                )}
                {resource.id && (
                  <p className="text-[10px] text-muted-foreground font-mono truncate" title={resource.id}>
                    {resource.id}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      {error && <ErrorDisplay message={error} onRetry={refresh} />}
    </div>
  )
}
