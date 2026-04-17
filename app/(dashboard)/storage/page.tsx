'use client'

import { StoragePanel } from '@/components/dashboard/storage-panel'

export default function StoragePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Server Storage</h1>
        <p className="text-sm text-muted-foreground mt-1">
          SMRT Link server disk space usage and availability.
        </p>
        <p className="text-xs text-muted-foreground mt-1 italic">
          Note: This shows SMRT Link server storage, not Revio onboard storage (not exposed via API).
        </p>
      </div>
      <StoragePanel />
    </div>
  )
}
