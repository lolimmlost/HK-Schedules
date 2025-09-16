//import React from 'react'
import { Button } from "@/components/ui/button"
import { Plus, Download, Printer } from "lucide-react"
//import type { Schedule } from './schedule-form'

interface ActionBarProps {
  onAddSchedule: () => void
  onPrint: () => void
  onExport: () => void
  isPrinting?: boolean
  scheduleCount: number
}

export function ActionBar({
  onAddSchedule,
  onPrint,
  onExport,
  isPrinting = false,
  scheduleCount
}: ActionBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex-1">
        <Button
          onClick={onAddSchedule}
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Schedule
        </Button>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={onPrint}
          variant="outline"
          className="no-print flex items-center gap-2"
          disabled={scheduleCount === 0}
        >
          <Printer className="h-4 w-4" />
          Print Schedule
        </Button>
        <Button
          onClick={onExport}
          variant="outline"
          className="no-print flex items-center gap-2"
          disabled={scheduleCount === 0}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
    </div>
  )
}