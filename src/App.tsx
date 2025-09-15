import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ScheduleForm } from "@/components/schedule-form"
import { ScheduleTable } from "@/components/schedule-table"
import { PrintSchedule } from "@/components/print-schedule"
import { Schedule } from "@/components/schedule-form"
import { useScheduleStore } from "@/lib/useScheduleStore"
import { useCSVExport } from "@/lib/useCSVExport"
import { AppHeader } from "@/components/AppHeader"
import { ActionBar } from "@/components/ActionBar"
import { ImportSection } from "@/components/ImportSection"
import { User, Plus, Download, Upload, Printer, Calendar, Clock, List } from "lucide-react"
import './index.css'

function App() {
  // State management using custom hook
  const {
    schedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    getSchedules
  } = useScheduleStore()

  // Form state
  const [editingSchedule, setEditingSchedule] = React.useState<Schedule | null>(null)
  const [showForm, setShowForm] = React.useState(false)
  const [isPrinting, setIsPrinting] = React.useState(false)

  // CSV export hook
  const exportCSV = useCSVExport()

  // Import handler - kept in App for direct state access
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.trim().split('\n')
      let importedCount = 0

      // Skip header row if present
      let startIndex = 0
      if (lines.length > 0) {
        const firstLineParts = lines[0].split(',').map(part => part.trim().replace(/"/g, ''))
        if (firstLineParts.length >= 5 &&
            firstLineParts[0].toLowerCase() === 'name' &&
            firstLineParts[2].toLowerCase() === 'start' &&
            firstLineParts[3].toLowerCase() === 'end') {
          startIndex = 1
        }
      }

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const parts = line.split(',').map(part => part.trim().replace(/"/g, ''))
        if (parts.length >= 4) {
          const name = parts[0]
          const date = parts[1] || ''
          const start = parts[2]
          const end = parts[3]
          const tasks = parts.slice(4).join(', ')

          if (name && start && end && !name.toLowerCase().includes('name')) {
            addSchedule({
              id: Date.now().toString() + importedCount++,
              name,
              date,
              start,
              end,
              tasks
            })
          }
        }
      }

      event.target.value = ''
      alert(`${importedCount} schedules imported.`)
    }
    reader.readAsText(file)
  }

  // Form handlers
  const handleAddSchedule = (data: Schedule) => {
    addSchedule(data)
    setShowForm(false)
  }

  const handleUpdateSchedule = (data: Schedule) => {
    updateSchedule(data)
    setEditingSchedule(null)
    setShowForm(false)
  }

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setShowForm(true)
  }

  const handleDeleteSchedule = (id: string) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      deleteSchedule(id)
    }
  }

  const handleCancelEdit = () => {
    setEditingSchedule(null)
    setShowForm(false)
  }

  // Action handlers
  const handleExport = () => {
    console.log('🔍 App - handleExport called, raw schedules:', schedules, 'type:', typeof schedules)
    console.log('🔍 App - localStorage schedules:', localStorage.getItem('housekeeperSchedules'))
    
    // Ensure schedules is always an array - handle both array and storage object formats
    const safeSchedules = Array.isArray(schedules) ? schedules : (schedules?.schedules || [])
    
    console.log('🔍 App - safeSchedules length:', safeSchedules.length, 'first item:', safeSchedules[0])
    
    if (safeSchedules.length === 0) {
      alert('No schedules to export. Check browser console for debug info.')
      return
    }
    exportCSV(safeSchedules)
  }

  const handlePrint = () => {
    setIsPrinting(true)
    // Small delay to ensure print styles are applied
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
    }, 100)
  }

  const handleAddClick = () => {
    setShowForm(true)
  }

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 App - schedules count:', schedules.length)
  }, [schedules])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AppHeader scheduleCount={schedules.length} />

      <div className="container max-w-screen-2xl mx-auto p-4 space-y-6 py-8">
        {/* Add/Edit Form */}
        {showForm && (
          <div className="space-y-4">
            <ScheduleForm
              initialData={editingSchedule || undefined}
              onSubmit={editingSchedule ? handleUpdateSchedule : handleAddSchedule}
              onCancel={handleCancelEdit}
            />
          </div>
        )}

        {/* Action Buttons - only show when not in form mode */}
        {!showForm && (
          <Card className="no-print">
            <CardContent className="p-6">
              <ActionBar
                onAddSchedule={handleAddClick}
                onPrint={handlePrint}
                onExport={handleExport}
                isPrinting={isPrinting}
                scheduleCount={schedules.length}
              />
            </CardContent>
          </Card>
        )}

        {/* Import Section */}
        <ImportSection onImport={handleImport} />

        {/* Schedule Table - Screen View */}
        {!isPrinting && (
          <div className="no-print">
            <ScheduleTable
              schedules={schedules}
              onEdit={handleEditSchedule}
              onDelete={handleDeleteSchedule}
            />
          </div>
        )}

        {/* Print Schedule - Print View */}
        {isPrinting && (
          <PrintSchedule 
            schedules={schedules} 
            companyName="Housekeeper Services"
            printedAt={new Date()}
          />
        )}
      </div>
    </div>
  )
}

export default App