import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScheduleForm } from "@/components/schedule-form"
import { ScheduleTable } from "@/components/schedule-table"
import { PrintSchedule } from "@/components/print-schedule"
import { Schedule } from "@/components/schedule-form"
import { Plus, Download, Upload, Printer, Calendar, User, Clock, List } from "lucide-react"
import './index.css'

function App() {
  const [schedules, setSchedules] = React.useState<Schedule[]>(() => {
    const saved = localStorage.getItem('housekeeperSchedules')
    console.log('🔍 App Debug - localStorage raw:', saved)
    try {
      const parsed = saved ? JSON.parse(saved) : []
      console.log('🔍 App Debug - parsed schedules:', parsed, 'count:', parsed.length)
      return parsed
    } catch (error) {
      console.error('🔍 App Debug - JSON.parse error:', error)
      console.log('🔍 App Debug - falling back to empty array')
      localStorage.removeItem('housekeeperSchedules')
      return []
    }
  })

  // Debug logging for state changes
  React.useEffect(() => {
    console.log('🔍 App Debug - schedules state updated:', schedules.length, 'items')
  }, [schedules])

  const [editingSchedule, setEditingSchedule] = React.useState<Schedule | null>(null)
  const [showForm, setShowForm] = React.useState(false)
  const [isPrinting, setIsPrinting] = React.useState(false)

  React.useEffect(() => {
    try {
      localStorage.setItem('housekeeperSchedules', JSON.stringify(schedules))
      console.log('🔍 App Debug - localStorage saved:', schedules.length, 'items')
    } catch (error) {
      console.error('🔍 App Debug - localStorage save error:', error)
    }
  }, [schedules])

  const handleAddSchedule = (data: Schedule) => {
    setSchedules(prev => [...prev, data])
    setShowForm(false)
  }

  const handleUpdateSchedule = (data: Schedule) => {
    setSchedules(prev => prev.map(s => s.id === data.id ? data : s))
    setEditingSchedule(null)
    setShowForm(false)
  }

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setShowForm(true)
  }

  const handleDeleteSchedule = (id: string) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      setSchedules(prev => prev.filter(s => s.id !== id))
    }
  }

  const handleCancelEdit = () => {
    setEditingSchedule(null)
    setShowForm(false)
  }

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
            setSchedules(prev => [...prev, {
              id: Date.now().toString() + importedCount++,
              name,
              date,
              start,
              end,
              tasks
            }])
          }
        }
      }

      event.target.value = ''
      alert(`${importedCount} schedules imported.`)
    }
    reader.readAsText(file)
  }

  const handleExport = async () => {
    if (schedules.length === 0) {
      alert('No schedules to export.')
      return
    }

    try {
      const response = await fetch('/export-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schedules })
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'housekeeper-schedules.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export CSV. Please try again.')
    }
  }

  const handlePrint = () => {
    setIsPrinting(true)
    // Small delay to ensure print styles are applied
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
    }, 100)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b">
        <div className="container flex h-16 max-w-screen-2xl items-center">
          <div className="mr-4 hidden md:flex">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="sr-only">Housekeeper Schedule Manager</span>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Housekeeper Schedule Manager</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-sm">
              {schedules.length} schedule{schedules.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </header>

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

        {/* Action Buttons */}
        {!showForm && (
          <Card className="no-print">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1">
                  <Button 
                    onClick={() => setShowForm(true)} 
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Schedule
                  </Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    onClick={handlePrint} 
                    variant="outline" 
                    className="no-print flex items-center gap-2"
                    disabled={isPrinting}
                  >
                    {isPrinting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Preparing...
                      </>
                    ) : (
                      <>
                        <Printer className="h-4 w-4" />
                        Print Schedule
                      </>
                    )}
                  </Button>
                  <Button onClick={handleExport} variant="outline" className="no-print flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Section */}
        <Card className="no-print">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Import Schedules</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1">
                <Input
                  id="import-file"
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  className="w-full"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Import schedules from CSV file (format: Name,Date,Start,End,Tasks...)
              </div>
            </div>
          </CardContent>
        </Card>

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