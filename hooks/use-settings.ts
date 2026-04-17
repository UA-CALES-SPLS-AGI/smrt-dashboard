'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSettings, saveSettings, type DashboardSettings } from '@/lib/settings-store'

export function useSettings() {
  const [settings, setSettingsState] = useState<DashboardSettings>(getSettings)

  useEffect(() => {
    // Listen for settings changes from other components
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<DashboardSettings>
      setSettingsState(customEvent.detail)
    }
    window.addEventListener('smrt-settings-changed', handler)
    return () => window.removeEventListener('smrt-settings-changed', handler)
  }, [])

  const updateSettings = useCallback((updates: Partial<DashboardSettings>) => {
    saveSettings(updates)
    setSettingsState(getSettings())
  }, [])

  return { settings, updateSettings }
}
