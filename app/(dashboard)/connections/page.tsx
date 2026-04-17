'use client'

import { ConnectionsPanel } from '@/components/dashboard/connections-panel'

export default function ConnectionsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold tracking-tight">Connections</h1>
      <ConnectionsPanel />
    </div>
  )
}
