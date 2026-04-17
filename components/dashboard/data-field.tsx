'use client'

import { cn } from '@/lib/utils'

interface DataFieldProps {
  label: string
  value: any
  mono?: boolean
  className?: string
}

export function DataField({ label, value, mono = false, className }: DataFieldProps) {
  const displayValue = value === null || value === undefined ? '—' : String(value)
  return (
    <div className={cn('space-y-0.5', className)}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={cn('text-sm font-medium', mono && 'font-mono')}>{displayValue}</p>
    </div>
  )
}
