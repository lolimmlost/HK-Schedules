import { Button } from '@/components/ui/button'
import { Users, Plus, Download } from 'lucide-react'
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
  filteredCount,
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

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex items-center gap-2">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Schedules Dashboard</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={handleExport} className="no-print">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button onClick={onAddSchedule} className="no-print">
          <Plus className="h-4 w-4 mr-2" />
          Add New Schedule
        </Button>
        <div className="text-sm text-muted-foreground">
          <span>
            {filteredCount} of {totalSchedules} schedules
          </span>
        </div>
      </div>
    </div>
  )
}
