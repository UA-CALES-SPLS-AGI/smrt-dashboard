'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function ErrorDisplay({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="p-4 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
        <p className="text-sm text-destructive flex-1">{message ?? 'An error occurred'}</p>
        {onRetry ? (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
