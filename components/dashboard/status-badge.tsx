'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const stateColors: Record<string, string> = {
  'IDLE': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'READY': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'RUNNING': 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  'STARTING': 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  'COMPLETE': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'PAUSED': 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  'ABORTING': 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
  'ABORTED': 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
  'ERROR': 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
  'FAILED': 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
  'UNKNOWN': 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30',
  'OPEN': 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  'CLOSED': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'LOCKED': 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
  'true': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'false': 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
}

export function StatusBadge({ value, className }: { value: string | boolean | null | undefined; className?: string }) {
  const strVal = String(value ?? 'UNKNOWN')?.toUpperCase()
  const colorClass = stateColors[strVal] ?? stateColors[String(value)] ?? 'bg-muted text-muted-foreground border-border'
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', colorClass, className)}>
      {strVal}
    </span>
  )
}
