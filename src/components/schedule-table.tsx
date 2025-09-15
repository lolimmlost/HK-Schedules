import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
}
from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Calendar, Clock, Edit, Trash2, Loader2, Plus, Filter } from "lucide-react"
import { formatDate, getDuration } from "@/lib/utils"
import { useScheduleFilter } from "@/lib/useScheduleFilter"
import { ScheduleDesktopTable } from "./ScheduleDesktopTable"
import { ScheduleMobileCards } from "./ScheduleMobileCards"
import type { Schedule, Entry } from "./schedule-form"
interface ScheduleTableProps {
  schedules: Schedule[] | { schedules: Schedule[] } | null
  onEdit: (schedule: Schedule) => void
  onDelete: (id: string) => void
}

export function ScheduleTable({ schedules, onEdit, onDelete }: ScheduleTableProps) {
  // Ensure schedules is always an array - handle both array and storage object formats
  const safeSchedules: Schedule[] = Array.isArray(schedules) ? schedules : (schedules?.schedules || [])
  
  // Migrate legacy schedules to new format
  const migrateLegacySchedule = (legacy: Schedule): Schedule => {
    if (legacy.entries && legacy.entries.length > 0) {
      // Already migrated
      return legacy
    }
    
    if (!legacy.start || !legacy.end) {
      return legacy
    }
    
    // Handle empty tasks gracefully
    const tasks = legacy.tasks || "No tasks specified"
    
    const duration = getDuration(legacy.start, legacy.end)
    const entry: Entry = {
      id: `${legacy.id}-entry-1`,
      time: legacy.start,
      duration,
      tasks,
      assignee: legacy.name, // Legacy: housekeeper name becomes assignee
      status: 'pending'
    }
    
    return {
      ...legacy,
      entries: [entry],
      // Keep legacy fields for backward compatibility during transition
      start: legacy.start,
      end: legacy.end,
      tasks
    }
  }
  
  const migratedSchedules = React.useMemo(() => {
    return safeSchedules.map(migrateLegacySchedule)
  }, [safeSchedules])
  
  // Debug logging
  React.useEffect(() => {
    console.log('ScheduleTable received schedules:', safeSchedules)
    if (safeSchedules.length === 0) {
      console.log('No schedules - checking localStorage:', localStorage.getItem('housekeeperSchedules'))
    }
  }, [safeSchedules])

  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [isSorted, setIsSorted] = React.useState<'name' | 'date' | 'start' | null>(null)
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')
  const [selectedAssignee, setSelectedAssignee] = React.useState<string>("all")

  // Expanded state management for desktop view
  const [expandedSchedules, setExpandedSchedules] = React.useState<Set<string>>(new Set())

  // Use the filtering hook
  const {
    allAssignees,
    filteredEntriesBySchedule,
    filteredSchedules,
    filteredEntryCount,
    assigneeCount
  } = useScheduleFilter(migratedSchedules, selectedAssignee)


  const handleDelete = async (id: string) => {
    if (deletingId === id) return // Already deleting

    if (!confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
      return
    }

    setDeletingId(id)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    onDelete(id)
    setDeletingId(null)
  }



  const sortedSchedules = React.useMemo(() => {
    if (!isSorted) return filteredSchedules

    return [...filteredSchedules].sort((a, b) => {
      let aValue, bValue

      switch (isSorted) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'date':
          aValue = a.date || ''
          bValue = b.date || ''
          break
        case 'start':
          // Use first entry time or legacy start time
          aValue = a.entries?.[0]?.time || a.start || ''
          bValue = b.entries?.[0]?.time || b.start || ''
          break
        default:
          return 0
      }

      if (aValue == null || bValue == null) return 0
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredSchedules, isSorted, sortDirection])

  const toggleSort = (column: 'name' | 'date' | 'start') => {
    if (isSorted === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setIsSorted(column)
      setSortDirection('asc')
    }
  }

  const toggleExpand = (scheduleId: string) => {
    setExpandedSchedules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(scheduleId)) {
        newSet.delete(scheduleId)
      } else {
        newSet.add(scheduleId)
      }
      return newSet
    })
  }

  const isSmallScreen = window.innerWidth < 768
  console.log('🔍 ScheduleTable render debug - isSmallScreen:', isSmallScreen, 'schedules.length:', safeSchedules.length, 'window.innerWidth:', window.innerWidth)

  if (safeSchedules.length === 0) {
    console.log('🔍 ScheduleTable: Rendering empty state')
    return (
      <Card>
        <CardHeader className="flex flex-col items-center justify-center space-y-2 text-center">
          <User className="h-12 w-12 text-muted-foreground" />
          <CardTitle className="text-xl">No Schedules Yet</CardTitle>
          <p className="text-muted-foreground">
            Get started by adding your first housekeeper schedule.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <Button variant="outline" size="lg" className="w-full max-w-sm">
              <Plus className="h-4 w-4 mr-2" />
              Add First Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  console.log('🔍 ScheduleTable: About to render table with', safeSchedules.length, 'schedules, isSmallScreen:', isSmallScreen)
  console.log('🔍 ScheduleTable: sortedSchedules:', sortedSchedules)

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Current Schedules</CardTitle>
              <Badge variant="secondary" className="ml-2">
                {allAssignees.length - 1} Assignees • {Object.keys(filteredEntriesBySchedule).length} Schedules • {filteredEntryCount} Tasks
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last updated {new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Assignee Filter Section */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
              <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <label htmlFor="assignee-filter" className="text-sm font-medium text-muted-foreground">
                Filter by Assignee
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger className="w-[180px]" id="assignee-filter">
                  <SelectValue placeholder="Select assignee..." />
                </SelectTrigger>
                <SelectContent className="w-[180px] max-h-60 p-1">
                  <SelectGroup>
                    {allAssignees.map((assignee) => (
                      <SelectItem
                        key={assignee}
                        value={assignee}
                        className="flex items-center py-2.5 pl-8 pr-2 text-sm font-medium leading-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent/50 transition-colors"
                      >
                        {assignee === "all" ? "👥 All Assignees" : `👤 ${assignee}`}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {selectedAssignee !== "all" && (
                <Badge variant="outline" className="text-xs whitespace-nowrap">
                  {selectedAssignee} ({assigneeCount})
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop Table View */}
        {!isSmallScreen && (
          <ScheduleDesktopTable
            schedules={sortedSchedules}
            filteredEntriesBySchedule={filteredEntriesBySchedule}
            onEdit={onEdit}
            onDelete={onDelete}
            deletingId={deletingId}
            isSorted={isSorted}
            sortDirection={sortDirection}
            onToggleSort={toggleSort}
            onToggleExpand={toggleExpand}
            expandedSchedules={expandedSchedules}
            selectedAssignee={selectedAssignee}
          />
        )}

        {/* Mobile Card View */}
        {isSmallScreen && (
          <div className="space-y-4">
            {filteredSchedules
              .filter((schedule: Schedule) => {
                console.log('🔍 Mobile filtering schedule:', schedule.id)
                
                // Show any schedule that has either entries or legacy fields
                const hasEntries = schedule.entries && schedule.entries.length > 0
                const hasLegacyFields = schedule.start && schedule.end // tasks is optional
                
                if (!hasEntries && !hasLegacyFields) {
                  console.log('🔍 Mobile filtering OUT schedule:', schedule.id, 'no valid data')
                  return false
                }
                
                if (hasEntries) {
                  // For new format, show if has any entries (relaxed validation)
                  const validEntry = schedule.entries!.some(entry => entry.time)
                  console.log('🔍 Mobile filtering entry-based schedule:', schedule.id, 'valid:', validEntry)
                  return validEntry
                }
                
                // Legacy format - basic validation
                console.log('🔍 Mobile filtering legacy schedule:', schedule.id, 'valid times:', !!(schedule.start && schedule.end))
                if (!schedule.start || !schedule.end) return false
                const startTime = new Date(`2000-01-01T${schedule.start}:00`)
                const endTime = new Date(`2000-01-01T${schedule.end}:00`)
                const isValidTime = startTime < endTime
                console.log('🔍 Mobile legacy time validation:', schedule.start, schedule.end, isValidTime)
                return isValidTime
              })
              .map((schedule: Schedule) => (
                <Card key={schedule.id} className="w-full">
                  <CardHeader className="flex flex-row items-start justify-between p-4 pb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-foreground truncate">{schedule.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(schedule.date)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(schedule)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(schedule.id)}
                        className="h-8 w-8 p-0 text-destructive"
                        disabled={deletingId === schedule.id}
                      >
                        {deletingId === schedule.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          Time
                        </span>
                        <span className="font-medium">
                          {schedule.entries?.[0]?.time || schedule.start} - {schedule.entries?.[0]?.time ? schedule.end : schedule.end}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                          {schedule.start && schedule.end ? getDuration(schedule.start, schedule.end) : schedule.entries?.[0]?.duration || 'N/A'}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground">Tasks</span>
                        <div className="ml-2 space-y-1">
                          {(schedule.tasks || schedule.entries?.[0]?.tasks) ? (
                            String(schedule.tasks || schedule.entries?.[0]?.tasks).split(',').map((task: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 text-xs">
                                <div className="w-1 h-1 rounded-full bg-foreground mt-1.5 flex-shrink-0"></div>
                                <span>{task.trim()}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No tasks specified</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}