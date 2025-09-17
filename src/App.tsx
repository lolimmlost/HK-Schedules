import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CookieBanner } from "@/components/ui/cookie-banner"
import { ScheduleForm } from "@/components/schedule-form"
import { ScheduleTable } from "@/components/schedule-table"
import { PrintSchedule } from "@/components/print-schedule"
import { Dashboard } from "@/components/Dashboard"
import { Schedule } from "@/components/schedule-form"
import { ChevronLeft } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { getDuration } from "@/lib/utils"
import { useScheduleStore } from "@/lib/useScheduleStore"
import type { ScheduleState } from "@/lib/useScheduleStore"
import { useCSVExport } from "@/lib/useCSVExport"
import { AppHeader } from "@/components/AppHeader"
import { ActionBar } from "@/components/ActionBar"
import { ImportSection } from "@/components/ImportSection"
import { ErrorBoundary } from "@/components/ui/error-boundary"
//import { User, Plus, Download, Upload, Printer, Calendar, Clock, List } from "lucide-react"
import './index.css'

function App() {
  // State management using custom hook
  const {
    schedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    //getSchedules
  } = useScheduleStore() as ScheduleState

  // Form state
  const [editingSchedule, setEditingSchedule] = React.useState<Schedule | null>(null)
  const [showForm, setShowForm] = React.useState(false)
  const [selectedSchedule, setSelectedSchedule] = React.useState<Schedule | null>(null)
  const [viewMode, setViewMode] = React.useState<'dashboard' | 'view'>( 'dashboard')

  // Make selectedSchedule reactive to store changes
  const freshSelectedSchedule = useScheduleStore((state) =>
    selectedSchedule?.id ? state.schedules.find((s: Schedule) => s.id === selectedSchedule.id) : null
  )

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
      let skippedCount = 0
      let isLegacyFormat = false

      // Detect format and skip header row if present
      let startIndex = 0
      if (lines.length > 0) {
        const firstLineParts = lines[0].split(',').map(part => part.trim().replace(/"/g, ''))
        const hasEndColumn = firstLineParts.some(p => p.toLowerCase().includes('end'))
        const hasDurationColumn = firstLineParts.some(p => p.toLowerCase().includes('duration'))
        const colCount = firstLineParts.length

        // Legacy v1: Has "End" but no "Duration", typically 4-6 columns
        if (hasEndColumn && !hasDurationColumn && colCount >= 4 && colCount <= 6) {
          isLegacyFormat = true
          console.log('🔍 App - Detected legacy v1 CSV format')
          startIndex = 1 // Skip header
        }
        // v2: Has "Duration", >=6 columns, case-insensitive header matching
        else if (colCount >= 6 &&
            firstLineParts.some(p => p.toLowerCase().includes('housekeeper') || p.toLowerCase().includes('name')) &&
            firstLineParts.some(p => p.toLowerCase().includes('date')) &&
            firstLineParts.some(p => p.toLowerCase().includes('start') || p.toLowerCase().includes('time')) &&
            hasDurationColumn) {
          startIndex = 1
          console.log('🔍 App - Detected v2 CSV format')
        } else {
          console.warn('🔍 App - Unknown CSV format, treating as data from line 0')
        }
      }

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const parts = line.split(',').map(part => part.trim().replace(/"/g, ''))
        if (parts.length < 4) {
          console.warn(`🔍 App - Skipping row ${i}: too few columns (${parts.length})`)
          skippedCount++
          continue
        }

        let housekeeper, assignee, date, startTime, endTime, durationStr, tasks

        if (isLegacyFormat) {
          // v1 format: Name, Date, Start, End, Tasks (5 cols)
          housekeeper = parts[0]
          assignee = housekeeper // No separate assignee in v1
          date = parts[1]
          startTime = parts[2]
          endTime = parts[3]
          tasks = parts.slice(4).join(', ')
          
          // Skip header-like rows but be less strict for older data
          if (!housekeeper || !startTime || !endTime) {
            console.warn(`🔍 App - Skipping legacy row ${i}: missing required fields`, {housekeeper, startTime, endTime})
            skippedCount++
            continue
          }
          if (housekeeper.toLowerCase().includes('housekeeper') || housekeeper.toLowerCase().includes('name')) {
            console.log(`🔍 App - Skipping legacy row ${i}: likely header`, housekeeper)
            skippedCount++
            continue
          }

          try {
            // Calculate duration from start/end using existing utility
            const durationText = getDuration(startTime, endTime)
            const durationMinutes = parseInt(durationText.replace(/[^0-9]/g, '')) || 60 // Fallback 60m
            console.log(`🔍 App - Legacy duration calc: ${startTime}-${endTime} → ${durationMinutes}m`)

            // Convert to v2 structure
            const newSchedule: Schedule = {
              id: uuidv4(),
              title: assignee,
              category: 'housekeeping' as const,
              description: tasks || 'Imported legacy schedule',
              date: date.trim(),
              entries: [{
                id: uuidv4(),
                time: startTime,
                duration: durationMinutes,
                task: tasks || 'General housekeeping',
                assignee,
                status: 'pending' as const,
                recurrence: 'none' as const
              }],
              version: '2.0',
              recurrence: 'none' as const
            }
            
            addSchedule(newSchedule)
            console.log('🔍 App - imported legacy schedule:', newSchedule.title, 'Duration:', durationMinutes + 'm')
          } catch (error) {
            console.warn('🔍 App - failed to import legacy schedule:', housekeeper, error)
            skippedCount++
          }
        } else {
          // v2 format: Housekeeper, Assignee, Date, Start, Duration, Tasks (>=6 cols)
          if (parts.length < 6) {
            skippedCount++
            continue
          }
          housekeeper = parts[0]
          assignee = parts[1] || housekeeper
          date = parts[2]
          startTime = parts[3]
          durationStr = parts[4]
          tasks = parts.slice(5).join(', ')

          // Skip obvious header rows for v2
          if (housekeeper?.toLowerCase().includes('housekeeper') || housekeeper?.toLowerCase().includes('name')) {
            console.log(`🔍 App - Skipping v2 row ${i}: likely header`, housekeeper)
            skippedCount++
            continue
          }

          if (housekeeper && startTime && date) {
            // Validate time format (HH:MM), more flexible for older data
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
            if (!timeRegex.test(startTime)) {
              console.warn(`🔍 App - Skipping v2 row ${i}: invalid time format`, startTime)
              skippedCount++
              continue
            }

            try {
              // Parse duration like "1h" or "2.5h", fallback to 60 min, handle older numeric formats
              let durationHours = 1 // default
              if (durationStr) {
                const durationMatch = durationStr.match(/(\d+(?:\.\d+)?)(h|hr|hours?)/i)
                if (durationMatch) {
                  durationHours = parseFloat(durationMatch[1])
                } else if (!isNaN(parseFloat(durationStr))) {
                  // If numeric, assume hours (common in older CSVs)
                  durationHours = parseFloat(durationStr)
                } else if (durationStr.toLowerCase().includes('min') || durationStr.toLowerCase().includes('m')) {
                  // Parse minutes
                  const minMatch = durationStr.match(/(\d+(?:\.\d+)?)(min|m)/i)
                  if (minMatch) {
                    const durationMins = parseFloat(minMatch[1])
                    durationHours = durationMins / 60
                  }
                }
              }

              const durationMinutes = Math.max(1, Math.round(durationHours * 60)) // At least 1 min, round to whole

              // Convert to v2 structure
              const newSchedule: Schedule = {
                id: uuidv4(),
                title: assignee || housekeeper,
                category: 'housekeeping' as const,
                description: tasks || 'Imported schedule',
                date: date.trim(),
                entries: [{
                  id: uuidv4(),
                  time: startTime,
                  duration: durationMinutes,
                  task: tasks || 'General housekeeping',
                  assignee: assignee || housekeeper,
                  status: 'pending' as const,
                  recurrence: 'none' as const
                }],
                version: '2.0',
                recurrence: 'none' as const
              }
              
              addSchedule(newSchedule)
              importedCount++
              console.log('🔍 App - imported v2 schedule:', newSchedule.title, 'Duration:', durationMinutes + 'm')
            } catch (error) {
              console.warn('🔍 App - failed to import v2 schedule:', housekeeper, error)
              skippedCount++
            }
          } else {
            console.warn(`🔍 App - Skipping v2 row ${i}: missing required fields`, {housekeeper, startTime, date})
            skippedCount++
          }
        }
      }

      event.target.value = ''
      const message = isLegacyFormat
        ? `${importedCount} legacy schedules imported successfully${skippedCount > 0 ? `. ${skippedCount} rows skipped (invalid data).` : '.'}`
        : `${importedCount} schedules imported successfully${skippedCount > 0 ? `. ${skippedCount} rows skipped.` : '.'}`
      alert(message)
      console.log(`🔍 App - Import complete: ${importedCount} imported, ${skippedCount} skipped`)
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
    if (confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
      try {
        deleteSchedule(id)
        console.log(`🔍 Successfully deleted schedule: ${id}`)
      } catch (error) {
        console.error('🔍 Delete failed:', error)
        alert('Failed to delete schedule. Please try again or refresh the page.')
      }
    }
  }

  const handleCancelEdit = () => {
    setEditingSchedule(null)
    setShowForm(false)
  }

  const handleViewSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setViewMode('view')
  }

  const handleBackToDashboard = () => {
    setSelectedSchedule(null)
    setViewMode('dashboard')
  }

  // Action handlers
  /**
   * Handles CSV export of schedules with comprehensive error handling and debugging
   *
   * This function manages the complete export workflow including:
   * - Data validation and defensive copying to prevent circular references
   * - Format detection (array vs object with .schedules property)
   * - Comprehensive logging for debugging data issues
   * - Error handling for CSV generation and browser download failures
   * - User feedback via alerts for success/failure states
   *
   * @returns {void}
   */
  const handleExport = () => {
    console.log('🔍 App - handleExport called')
    console.log('🔍 App - raw schedules:', schedules)
    console.log('🔍 App - schedules type:', typeof schedules)
    console.log('🔍 App - schedules isArray:', Array.isArray(schedules))
    console.log('🔍 App - schedules length:', schedules?.length)
    console.log('🔍 App - localStorage raw:', localStorage.getItem('housekeeperSchedules'))
    
    try {
      /**
       * Ensure schedules is always a valid Schedule[] array for export
       * Handles multiple data formats from localStorage and state management
       */
      let safeSchedules: any[] = []
      
      if (Array.isArray(schedules)) {
        /**
         * Create defensive copy of schedules to break potential circular references
         * Ensures all required Schedule properties exist for CSV export
         * Prevents React state object references from causing serialization errors
         * Handles both v1 (legacy) and v2 (new) schedule formats
         */
        console.log('🔍 App - schedules is array, creating defensive copy')
        safeSchedules = schedules.map((schedule: any, index: number) => {
          // Check if legacy v1 format (has name, start, end, tasks but no entries array)
          const isLegacy = !('entries' in schedule) && (schedule.name || schedule.start || schedule.end || schedule.tasks)
          if (isLegacy) {
            // Convert legacy to export format
            return {
              id: schedule.id || `legacy-${index}`,
              title: schedule.name || schedule.title || '',
              category: (schedule.category as any) || 'general',
              description: schedule.tasks || schedule.description || '',
              date: schedule.date || '',
              start: schedule.start || '',
              end: schedule.end || '',
              entries: schedule.tasks ? [{
                assignee: schedule.name || '',
                time: schedule.start || '',
                duration: schedule.end ? parseInt(getDuration(schedule.start || '09:00', schedule.end || '10:00').replace(/[^0-9]/g, '')) || 60 : 60,
                task: schedule.tasks,
                status: 'pending' as const,
                recurrence: 'none' as const
              }] : [],
              version: '1.0',
              recurrence: 'none' as const
            }
          } else {
            // v2 format - defensive copy
            return {
              id: schedule.id || `temp-${index}`,
              title: schedule.title || '',
              category: schedule.category || 'general',
              description: schedule.description || '',
              date: schedule.date || '',
              entries: schedule.entries ? schedule.entries.map((entry: any, entryIndex: number) => ({
                id: entry.id || `temp-entry-${index}-${entryIndex}`,
                assignee: entry.assignee || '',
                time: entry.time || '',
                duration: entry.duration || 60,
                task: entry.task || '',
                status: entry.status || 'pending',
                notes: entry.notes || '',
                recurrence: entry.recurrence || 'none'
              })) : [],
              version: schedule.version || '2.0',
              recurrence: schedule.recurrence || 'none'
            }
          }
        })
      } else if (schedules && typeof schedules === 'object' && 'schedules' in schedules && Array.isArray((schedules as any).schedules)) {
        /**
         * Handle legacy object format where schedules are nested under .schedules property
         * This can occur with corrupted localStorage data or version migration issues
         */
        console.log('🔍 App - schedules has .schedules property, using that')
        safeSchedules = (schedules as any).schedules.map((s: any) => ({
          id: s.id || `legacy-${Math.random()}`,
          title: s.name || s.title || '',
          category: (s.category as any) || 'general',
          description: s.tasks || s.description || '',
          date: s.date || '',
          start: s.start || '',
          end: s.end || '',
          entries: s.tasks ? [{
            assignee: s.name || '',
            time: s.start || '',
            duration: s.end ? parseInt(getDuration(s.start || '09:00', s.end || '10:00').replace(/[^0-9]/g, '')) || 60 : 60,
            task: s.tasks,
            status: 'pending' as const,
            recurrence: 'none' as const
          }] : [],
          version: '1.0',
          recurrence: 'none' as const
        }))
      } else {
        /**
         * Fallback for unknown data formats - prevents crashes from malformed state
         * Logs the unexpected format for debugging while providing empty array fallback
         */
        console.log('🔍 App - schedules format unknown, using empty array')
        safeSchedules = []
      }
      
      /**
       * Log safeSchedules creation details for debugging
       * Verifies array structure and basic data integrity before CSV processing
       */
      console.log('🔍 App - safeSchedules created, type:', typeof safeSchedules, 'isArray:', Array.isArray(safeSchedules))
      console.log('🔍 App - safeSchedules length:', safeSchedules.length)
      
      if (safeSchedules.length > 0) {
        const firstSchedule = safeSchedules[0]
        /**
         * Detailed logging of first schedule for validation
         * Helps identify common issues: empty names, missing required fields, type mismatches
         */
        console.log('🔍 App - safeSchedules[0]:', firstSchedule)
        console.log('🔍 App - safeSchedules[0] keys:', Object.keys(firstSchedule))
        console.log('🔍 App - safeSchedules[0].title:', firstSchedule.title, 'type:', typeof firstSchedule.title, 'trimmed:', firstSchedule.title?.trim())
        console.log('🔍 App - safeSchedules[0].start:', firstSchedule.start)
        console.log('🔍 App - safeSchedules[0].date:', firstSchedule.date)
        console.log('🔍 App - safeSchedules[0].description:', firstSchedule.description)
        console.log('🔍 App - safeSchedules[0].entries:', firstSchedule.entries)
        console.log('🔍 App - safeSchedules[0] stringified length:', JSON.stringify(firstSchedule).length)
      }
      
      if (safeSchedules.length === 0) {
        console.log('🔍 App - No schedules to export')
        alert('No schedules to export. Check browser console for debug info.')
        return
      }
      
      /**
       * Pre-export validation logging
       * Shows sample data structure before passing to CSV generation
       */
      console.log('🔍 App - About to call exportCSV with safeSchedules')
      console.log('🔍 App - safeSchedules sample:', safeSchedules.slice(0, 2))
      
      /**
       * Execute CSV export using custom hook
       * The useCSVExport hook handles:
       * - CSV generation with proper field escaping and UTF-8 BOM
       * - Chrome-compatible Blob creation and download with fallback methods
       * - Support for both legacy (flat) and new (entries array) schedule formats
       * - Comprehensive data validation and error reporting
       */
      const result = exportCSV(safeSchedules)
      console.log('🔍 App - exportCSV completed, result:', result)
      
      /**
       * Handle export result and provide user feedback
       * Success: Log completion details
       * Failure: Show error alert and log details for debugging
       */
      if (result.success) {
        console.log('🔍 App - Export successful:', result.filename, result.rowCount, 'rows')
        // TODO: Add success toast notification for better UX
      } else {
        console.error('🔍 App - Export failed:', result.error)
        alert(`Export failed: ${result.error}`)
      }
      
    } catch (error) {
      /**
       * Comprehensive error handling for unexpected failures during export
       * Catches and reports:
       * - Circular reference errors during JSON serialization
       * - Memory issues with large datasets
       * - Browser download blocking (Chrome security policies)
       * - Network or permission errors
       * - Unexpected data structure issues
       */
      console.error('🔍 App - handleExport error:', error)
      console.error('🔍 App - Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('🔍 App - Error message:', errorMessage)
      alert(`Export failed with error: ${errorMessage}. Check console for details.`)
    }
  }

  const handlePrint = () => {
    window.print()
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

        {/* Main Content */}
        {!showForm && viewMode === 'dashboard' && (
          <ErrorBoundary>
            <Dashboard
              onEdit={handleEditSchedule}
              onDelete={handleDeleteSchedule}
              onView={handleViewSchedule}
              onAddSchedule={handleAddClick}
            />
          </ErrorBoundary>
        )}

        {!showForm && viewMode === 'view' && freshSelectedSchedule && (
          <div className="space-y-4 max-h-screen overflow-auto">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleBackToDashboard}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h2 className="text-2xl font-bold">{freshSelectedSchedule.title}</h2>
            </div>
            <ErrorBoundary>
              <ScheduleTable
                schedules={[freshSelectedSchedule]}
                onEdit={handleEditSchedule}
                onDelete={handleDeleteSchedule}
                onAddSchedule={handleAddClick}
              />
            </ErrorBoundary>
          </div>
        )}

        {/* Action Buttons - show in view mode */}
        {!showForm && viewMode === 'view' && (
          <Card className="no-print">
            <CardContent className="p-6">
              <ActionBar
                onAddSchedule={handleAddClick}
                onPrint={handlePrint}
                onExport={handleExport}
                scheduleCount={schedules.length}
              />
            </CardContent>
          </Card>
        )}

        {/* Import Section */}
        <ImportSection onImport={handleImport} />
      
        {/* Print Schedule - Always rendered but hidden on screen */}
        <PrintSchedule
          className="hidden print:block"
          schedules={viewMode === 'view' && freshSelectedSchedule ? [freshSelectedSchedule] : schedules}
          companyName="Housekeeper Services"
          printedAt={new Date()}
          isSingleSchedule={viewMode === 'view' && !!freshSelectedSchedule}
        />
      </div>
      <CookieBanner />
    </div>
  )
}

export default App