import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScheduleForm } from "@/components/schedule-form"
import { ScheduleTable } from "@/components/schedule-table"
import { Schedule } from "@/components/schedule-form"
import './index.css'

function App() {
  const [schedules, setSchedules] = React.useState<Schedule[]>(() => {
    const saved = localStorage.getItem('housekeeperSchedules')
    return saved ? JSON.parse(saved) : []
  })
  const [editingSchedule, setEditingSchedule] = React.useState<Schedule | null>(null)
  const [showForm, setShowForm] = React.useState(false)

  React.useEffect(() => {
    localStorage.setItem('housekeeperSchedules', JSON.stringify(schedules))
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
    window.print()
  }

  return (
    <div className="min-h-screen bg-background p-4 print:bg-white print:p-0">
      <header className="text-center mb-8 print:mb-4">
        <h1 className="text-4xl font-bold text-foreground">Housekeeper Schedule Manager</h1>
      </header>

      <main className="max-w-6xl mx-auto space-y-6 print:space-y-4">
        {/* Add/Edit Form */}
        {showForm && (
          <ScheduleForm
            initialData={editingSchedule || undefined}
            onSubmit={editingSchedule ? handleUpdateSchedule : handleAddSchedule}
            onCancel={handleCancelEdit}
          />
        )}

        {/* Action Buttons */}
        {!showForm && (
          <Card className="no-print">
            <CardContent className="p-6 flex flex-wrap gap-4 items-center justify-between">
              <Button onClick={() => setShowForm(true)} className="bg-primary">
                Add New Schedule
              </Button>
              <div className="flex gap-2">
                <Button onClick={handlePrint} className="no-print">
                  Print Schedule
                </Button>
                <Button onClick={handleExport} className="no-print">
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Section */}
        <Card className="no-print">
          <CardHeader>
            <CardTitle>Import Schedules</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Input
              id="import-file"
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="max-w-sm"
            />
            <p className="text-sm text-muted-foreground">
              Import schedules from CSV file (format: Name,Date,Start,End,Tasks...)
            </p>
          </CardContent>
        </Card>

        {/* Schedule Table */}
        <div className="no-print">
          <ScheduleTable
            schedules={schedules}
            onEdit={handleEditSchedule}
            onDelete={handleDeleteSchedule}
          />
        </div>
        
        {/* Print-only Table */}
        <div className="print-only">
          <h2 className="text-2xl font-semibold mb-4">Current Schedules</h2>
          {schedules.length === 0 ? (
            <p>No schedules found.</p>
          ) : (
            <table className="w-full border-collapse border border-gray-300 print:border-black">
              <thead>
                <tr className="bg-gray-100 print:bg-gray-100">
                  <th className="border border-gray-300 print:border-black p-2 text-left">Name</th>
                  <th className="border border-gray-300 print:border-black p-2 text-left">Date</th>
                  <th className="border border-gray-300 print:border-black p-2 text-left">Start</th>
                  <th className="border border-gray-300 print:border-black p-2 text-left">End</th>
                  <th className="border border-gray-300 print:border-black p-2 text-left">Tasks</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="border-b">
                    <td className="border border-gray-300 print:border-black p-2">{schedule.name}</td>
                    <td className="border border-gray-300 print:border-black p-2">{schedule.date || "N/A"}</td>
                    <td className="border border-gray-300 print:border-black p-2">{schedule.start}</td>
                    <td className="border border-gray-300 print:border-black p-2">{schedule.end}</td>
                    <td className="border border-gray-300 print:border-black p-2">{schedule.tasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}

export default App