'use client'

import { useCallback } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { getConnections, getFileTransferLocations } from '@/lib/smrt-api'
import { getRefreshInterval, isEndpointEnabled } from '@/lib/settings-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionHeader } from './section-header'
import { LoadingCard } from './loading-card'
import { ErrorDisplay } from './error-display'
import { StatusBadge } from './status-badge'
import { Network, FolderSync, Wifi } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ConnectionsPanel() {
  const connFetcher = useCallback(() => getConnections(), [])
  const ftFetcher = useCallback(() => getFileTransferLocations(), [])

  const { data: connections, error: connError, loading: connLoading, lastUpdated, refresh: refreshConn } = usePolling({
    fetcher: connFetcher,
    intervalMs: getRefreshInterval('connections'),
    enabled: isEndpointEnabled('connections'),
  })

  const { data: fileTransfers } = usePolling({
    fetcher: ftFetcher,
    intervalMs: getRefreshInterval('file-transfers'),
    enabled: isEndpointEnabled('file-transfers'),
  })

  if (connLoading && !connections) return <LoadingCard lines={4} />
  if (connError && !connections) return <ErrorDisplay message={connError} onRetry={refreshConn} />

  const connList = Array.isArray(connections) ? connections : []
  const ftList = Array.isArray(fileTransfers) ? fileTransfers : []

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Connections & File Transfer"
        icon={Network}
        lastUpdated={lastUpdated}
        onRefresh={refreshConn}
        loading={connLoading}
      />

      {/* Connections Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wifi className="h-4 w-4 text-primary" /> Instrument Connections ({connList.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {connList.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No connections found</p>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Serial</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Port</TableHead>
                    <TableHead>Connected</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {connList.map((conn: any, idx: number) => (
                    <TableRow key={conn?.serial ?? idx}>
                      <TableCell className="font-medium">{conn?.name ?? '\u2014'}</TableCell>
                      <TableCell className="font-mono text-xs">{conn?.serial ?? '\u2014'}</TableCell>
                      <TableCell className="font-mono text-xs">{conn?.ipAddress ?? '\u2014'}</TableCell>
                      <TableCell className="font-mono text-xs">{conn?.port ?? '\u2014'}</TableCell>
                      <TableCell><StatusBadge value={conn?.isConnected} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* File Transfer Locations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FolderSync className="h-4 w-4 text-primary" /> File Transfer Locations ({ftList.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ftList.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No file transfer locations configured</p>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Dest Path</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ftList.map((ft: any, idx: number) => (
                    <TableRow key={ft?.uuid ?? idx}>
                      <TableCell className="font-medium">{ft?.name ?? '\u2014'}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {ft?.schemeType ?? 'unknown'}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{ft?.host ?? '\u2014'}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate">{ft?.destPath ?? '\u2014'}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{ft?.description ?? '\u2014'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
