'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Activity,
  Bell,
  Settings as SettingsIcon,
  Network,
  BarChart3,
  Settings2,
  MonitorSpeaker,
  Server,
  HardDrive,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { getSettings } from '@/lib/settings-store'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/status', label: 'Instrument Status', icon: Activity },
  { href: '/alarms', label: 'Alarms', icon: Bell },
  { href: '/configuration', label: 'Configuration', icon: SettingsIcon },
  { href: '/connections', label: 'Connections', icon: Network },
  { href: '/storage', label: 'Server Storage', icon: HardDrive },
  { href: '/history', label: 'State History', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings2 },
]

export function SidebarNav() {
  const pathname = usePathname()
  const [apiPath, setApiPath] = useState('/smrtlink-api')

  useEffect(() => {
    setApiPath(getSettings().apiBasePath)
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-2 py-3 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <MonitorSpeaker className="h-4.5 w-4.5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-display font-bold tracking-tight">SMRT Link</h1>
          <p className="text-[10px] text-muted-foreground leading-none">Instrument Monitor</p>
        </div>
      </div>
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto pt-4 border-t border-border/50">
        <p className="text-[10px] text-muted-foreground px-2">API Base Path</p>
        <p className="text-[10px] text-muted-foreground font-mono px-2 truncate">{apiPath}</p>
        <p className="text-[10px] text-muted-foreground px-2 mt-1">Static Build • Apache HTTPD</p>
      </div>
    </div>
  )
}
