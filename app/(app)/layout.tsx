import { TopNav } from '@/components/nav/TopNav'
import { SidePanel } from '@/components/shared/SidePanel'
import { ToastProvider } from '@/components/ui/Toast'
import { StoreHydration } from '@/components/StoreHydration'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ToastProvider>
      <StoreHydration />
      <TopNav />
      <SidePanel />
      <main className="pt-14 min-h-screen">
        {children}
      </main>
    </ToastProvider>
  )
}
