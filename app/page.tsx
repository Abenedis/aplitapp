import { DashboardHeader } from "@/components/dashboard-header"
import { DeviceGrid } from "@/components/device-grid"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DashboardHeader />
        <DeviceGrid />
      </div>
    </div>
  )
}
