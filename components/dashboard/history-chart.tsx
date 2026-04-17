'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { SectionHeader } from './section-header'
import { BarChart3 } from 'lucide-react'
import { getHistory, type StateSnapshot } from '@/lib/history-store'
import dynamic from 'next/dynamic'

const HistoryChartInner = dynamic(() => import('./history-chart-inner'), {
  ssr: false,
  loading: () => <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">Loading chart...</div>,
})

export function HistoryChart() {
  const [snapshots, setSnapshots] = useState<StateSnapshot[]>([])

  useEffect(() => {
    // Load initial history
    setSnapshots(getHistory())
    // Refresh every 15 seconds
    const interval = setInterval(() => {
      setSnapshots(getHistory())
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-4">
      <SectionHeader title="State History" icon={BarChart3} />
      <Card>
        <CardContent className="p-4">
          {snapshots.length < 2 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
              Collecting data... History will appear after a few polling cycles.
              <br />
              <span className="text-xs">({snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''} collected, stored in browser localStorage)</span>
            </div>
          ) : (
            <HistoryChartInner snapshots={snapshots} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
