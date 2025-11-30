import { Button } from '@/components/ui/button'
import { LayoutDashboard, Plus, Download, Printer } from 'lucide-react'
import { useCSVExport } from '@/lib/useCSVExport'
import { Schedule } from './schedule-form'

interface DashboardHeaderProps {
  totalSchedules: number
  filteredCount: number
  onAddSchedule: () => void
  schedules: Schedule[]
}

export function DashboardHeader({
  totalSchedules,
  filteredCount: _filteredCount,
  onAddSchedule,
  schedules,
}: DashboardHeaderProps) {
  const exportToCSV = useCSVExport()

  const handleExport = () => {
    const result = exportToCSV(schedules)
    if (!result.success) {
      console.error('Export failed:', result.error)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
      {/* Title Section */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25">
          <LayoutDashboard className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedules Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage and organize your housekeeping operations
          </p>
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="no-print h-9"
          disabled={totalSchedules === 0}
        >
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="no-print h-9"
          disabled={totalSchedules === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button onClick={onAddSchedule} size="sm" className="no-print h-9 shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          New Schedule
        </Button>
      </div>
    </div>
  )
}
