import { AppShell } from '@/components/layouts/app-shell'
import { SidebarNav } from '@/components/dashboard/sidebar-nav'
import { ThemeToggle } from '@/components/theme-toggle'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      sidebar={<SidebarNav />}
      header={
        <div className="flex-1 flex items-center justify-end gap-2">
          <ThemeToggle />
        </div>
      }
    >
      {children}
    </AppShell>
  )
}
