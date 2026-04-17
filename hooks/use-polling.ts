'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UsePollingOptions<T> {
  fetcher: () => Promise<T>
  intervalMs: number
  enabled?: boolean
  onData?: (data: T) => void
}

export function usePolling<T = any>({ fetcher, intervalMs, enabled = true, onData }: UsePollingOptions<T>) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const mountedRef = useRef(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fetcherRef = useRef(fetcher)
  const onDataRef = useRef(onData)

  // Keep refs updated
  fetcherRef.current = fetcher
  onDataRef.current = onData

  const fetchData = useCallback(async () => {
    if (!enabled) return
    try {
      const result = await fetcherRef.current()
      if (mountedRef.current) {
        setData(result)
        setError(null)
        setLastUpdated(new Date())
        onDataRef.current?.(result)
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err?.message ?? 'Fetch failed')
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    mountedRef.current = true
    setLoading(true)
    fetchData()
    if (enabled && intervalMs > 0) {
      intervalRef.current = setInterval(fetchData, intervalMs)
    }
    return () => {
      mountedRef.current = false
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchData, intervalMs, enabled])

  const refresh = useCallback(() => {
    setLoading(true)
    fetchData()
  }, [fetchData])

  return { data, error, loading, lastUpdated, refresh }
}
