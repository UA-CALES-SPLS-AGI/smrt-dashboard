'use client'

import { useState, useCallback } from 'react'
import { useSettings } from '@/hooks/use-settings'
import { ENDPOINT_LABELS } from '@/lib/settings-store'
import { clearHistory } from '@/lib/history-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { SectionHeader } from './section-header'
import { Settings2, Save, RotateCcw, Trash2, Server, Hash, Link2 } from 'lucide-react'
import { toast } from 'sonner'

export function SettingsPanel() {
  const { settings, updateSettings } = useSettings()
  const [apiBasePath, setApiBasePath] = useState(settings.apiBasePath)
  const [instrumentId, setInstrumentId] = useState(settings.instrumentId)
  const [serial, setSerial] = useState(settings.serial)
  const [autoDetect, setAutoDetect] = useState(settings.autoDetect)
  const [intervals, setIntervals] = useState({ ...settings.refreshIntervals })
  const [enabled, setEnabled] = useState({ ...settings.enabledEndpoints })

  const handleSave = useCallback(() => {
    updateSettings({
      apiBasePath,
      instrumentId,
      serial,
      autoDetect,
      refreshIntervals: intervals,
      enabledEndpoints: enabled,
    })
    toast.success('Settings saved! Refresh the page for changes to take full effect.')
  }, [apiBasePath, instrumentId, serial, autoDetect, intervals, enabled, updateSettings])

  const handleReset = useCallback(() => {
    localStorage.removeItem('smrt-dashboard-settings')
    window.location.reload()
  }, [])

  const handleClearHistory = useCallback(() => {
    clearHistory()
    toast.success('History cleared')
  }, [])

  // Group endpoints by category
  const categories = Object.entries(ENDPOINT_LABELS).reduce((acc, [key, meta]) => {
    if (!acc[meta.category]) acc[meta.category] = []
    acc[meta.category].push({ key, ...meta })
    return acc
  }, {} as Record<string, Array<{ key: string; label: string; category: string; description: string }>>)

  return (
    <div className="space-y-6">
      <SectionHeader title="Dashboard Settings" icon={Settings2} />
      <p className="text-sm text-muted-foreground">
        Configure the API connection, instrument parameters, and polling intervals.
        All settings are stored in your browser&apos;s localStorage.
      </p>

      {/* API Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" /> API Connection
          </CardTitle>
          <CardDescription>
            The API base path is relative to this page&apos;s origin. Apache reverse-proxies this path to the SMRT Link API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiBasePath">API Base Path</Label>
            <Input
              id="apiBasePath"
              value={apiBasePath}
              onChange={(e) => setApiBasePath(e.target.value)}
              placeholder="/smrtlink-api"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Default: <code>/smrtlink-api</code> — Apache ProxyPass maps this to <code>http://localhost:9091</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Instrument Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-4 w-4" /> Instrument Configuration
          </CardTitle>
          <CardDescription>
            Configure the instrument ID (integer for ICS endpoints) and serial number (for SMRT Link endpoints).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-detect Instrument</Label>
              <p className="text-xs text-muted-foreground">Automatically detect instrument ID and serial from the API</p>
            </div>
            <Switch checked={autoDetect} onCheckedChange={setAutoDetect} />
          </div>
          {!autoDetect && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-2">
                <Label htmlFor="instrumentId">Instrument ID (integer)</Label>
                <Input
                  id="instrumentId"
                  value={instrumentId}
                  onChange={(e) => setInstrumentId(e.target.value)}
                  placeholder="e.g. 1"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Used in <code>{'/ics/{instrumentId}/...'}</code> endpoints
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serial">Serial Number (string)</Label>
                <Input
                  id="serial"
                  value={serial}
                  onChange={(e) => setSerial(e.target.value)}
                  placeholder="e.g. 54001"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Used in <code>{'/smrt-link/instrument-config/connections/{serial}'}</code>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refresh Intervals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Hash className="h-4 w-4" /> Polling Intervals
          </CardTitle>
          <CardDescription>
            Configure how often each API endpoint is polled. Disable endpoints you don&apos;t need.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(categories).map(([category, items]) => (
            <div key={category}>
              <Badge variant="secondary" className="mb-3">{category}</Badge>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.key} className="flex items-center gap-4 py-2 border-b border-border/50 last:border-0">
                    <Switch
                      checked={enabled[item.key] !== false}
                      onCheckedChange={(checked) => setEnabled({ ...enabled, [item.key]: checked })}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="w-24 h-8 text-xs font-mono"
                        value={intervals[item.key] ?? 30000}
                        min={1000}
                        step={1000}
                        onChange={(e) => setIntervals({ ...intervals, [item.key]: parseInt(e.target.value || '30000', 10) })}
                      />
                      <span className="text-xs text-muted-foreground">ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} className="flex-1">
          <Save className="h-4 w-4 mr-2" /> Save Settings
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" /> Reset Defaults
        </Button>
        <Button variant="outline" onClick={handleClearHistory}>
          <Trash2 className="h-4 w-4 mr-2" /> Clear History
        </Button>
      </div>
    </div>
  )
}
