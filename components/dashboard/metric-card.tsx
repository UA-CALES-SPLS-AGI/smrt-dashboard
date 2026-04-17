'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string | number | null | undefined
  icon: LucideIcon
  description?: string
  className?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

const variantStyles = {
  default: 'text-primary',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  danger: 'text-red-500',
}

export function MetricCard({ label, value, icon: Icon, description, className, variant = 'default' }: MetricCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className={cn('text-2xl font-bold font-mono tracking-tight', variantStyles[variant])}>
              {value ?? '—'}
            </p>
            {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
          </div>
          <div className={cn('rounded-lg p-2 bg-muted/50', variantStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
