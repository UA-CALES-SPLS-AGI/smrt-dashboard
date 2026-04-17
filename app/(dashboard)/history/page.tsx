'use client'

import { HistoryChart } from '@/components/dashboard/history-chart'

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold tracking-tight">State History</h1>
      <p className="text-sm text-muted-foreground">
        Instrument state history is collected while the dashboard is open and stored in your browser&apos;s localStorage.
      </p>
      <HistoryChart />
    </div>
  )
}
