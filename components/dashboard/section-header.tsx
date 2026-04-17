'use client'

import { cn } from '@/lib/utils'
import { LucideIcon, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SectionHeaderProps {
  title: string
  icon: LucideIcon
  lastUpdated?: Date | null
  onRefresh?: () => void
  loading?: boolean
  className?: string
}

export function SectionHeader({ title, icon: Icon, lastUpdated, onRefresh, loading, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-display font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="flex items-center gap-2">
        {lastUpdated ? (
          <span className="text-xs text-muted-foreground font-mono">
            {lastUpdated?.toLocaleTimeString?.() ?? ''}
          </span>
        ) : null}
        {onRefresh ? (
          <Button variant="ghost" size="icon-sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
