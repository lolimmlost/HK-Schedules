import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Calendar, Clock, Edit, Trash2, Loader2, Filter, Repeat } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useScheduleFilter } from '@/lib/useScheduleFilter'
import { ScheduleDesktopTable } from './ScheduleDesktopTable'
//import { ScheduleMobileCards } from "./ScheduleMobileCards"
import type { Schedule, Entry, WeeklyScheduleEntry } from './schedule-form'
import { useScheduleStore } from '@/lib/useScheduleStore'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { getWeeklyScheduleDescription } from '@/lib/weekly-schedule-utils'
interface ScheduleTableProps {
  schedules: Schedule[] | { schedules: Schedule[] } | null
  onEdit: (schedule: Schedule) => void
  onDelete: (id: string) => void
  onAddSchedule?: () => void
}

interface EditState {
  entryId: string
  field: 'status' | 'assignee' | 'time'
  previousValue: string
  isWeekly?: boolean
}

export function ScheduleTable({ schedules, onEdit, onDelete }: ScheduleTableProps) {
  // Ensure schedules is always an array - handle both array and storage object formats
  const safeSchedules: Schedule[] = Array.isArray(schedules)
    ? schedules
    : schedules?.schedules || []

  // Migrate legacy schedules to new format
  const migrateLegacySchedule = (legacy: Schedule): Schedule => {
    if (legacy.entries && legacy.entries.length > 0) {
      // Already migrated
      return legacy
    }

    // For legacy single-entry, create from title/description if no entries
    const task = legacy.title || legacy.description || 'General task'
    const entry: Entry = {
      id: `${legacy.id}-entry-1`,
      time: '09:00', // Default
      duration: 60,
      task,
      assignee: 'Unassigned',
      status: 'pending' as const,
      recurrence: 'none' as const,
      notes: undefined,
    }

    return {
      ...legacy,
      entries: [{ ...entry, recurrence: 'none' }],
      version: '2.0',
    }
  }

  const migratedSchedules = React.useMemo(() => {
    return safeSchedules.map(migrateLegacySchedule)
  }, [safeSchedules])

  // Debug logging
  React.useEffect(() => {
    console.log('ScheduleTable received schedules:', safeSchedules)
    if (safeSchedules.length === 0) {
      console.log(
        'No schedules - checking localStorage:',
        localStorage.getItem('housekeeperSchedules')
      )
    }
  }, [safeSchedules])

  // All hooks first - unconditional
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [isSorted, setIsSorted] = React.useState<'name' | 'date' | 'start' | null>(null)
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')
  const [selectedAssignee, setSelectedAssignee] = React.useState<string>('all')

  // Expanded state management for desktop view
  const [expandedSchedules, setExpandedSchedules] = React.useState<Set<string>>(new Set())

  // Inline edit state
  const [editing, setEditing] = useState<EditState | null>(null)

  const { updateSchedule, getHousekeepers } = useScheduleStore()
  const { toast } = useToast()

  const housekeepers = getHousekeepers()

  // Undo timeout
  const undoTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Use the filtering hook
  const {
    allAssignees,
    filteredEntriesBySchedule,
    filteredSchedules,
    filteredEntryCount,
    assigneeCount,
  } = useScheduleFilter(migratedSchedules, selectedAssignee)

  // Proper hook for responsive detection
  const [isSmallScreen, setIsSmallScreen] = React.useState(window.innerWidth < 768)

  React.useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  console.log(
    '🔍 ScheduleTable render debug - isSmallScreen:',
    isSmallScreen,
    'schedules.length:',
    safeSchedules.length,
    'window.innerWidth:',
    window.innerWidth
  )

  // Compute empty state after all hooks
  const handleDelete = async (id: string) => {
    if (deletingId === id) return // Already deleting

    if (!confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
      return
    }

    setDeletingId(id)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    onDelete(id)
    setDeletingId(null)
  }

  const handleInlineEdit = (
    schedule: Schedule,
    entry: Entry | WeeklyScheduleEntry,
    field: 'status' | 'assignee' | 'time',
    newValue: string,
    isWeekly = false
  ) => {
    const previousValue = entry[field] as string

    // Optimistic update
    let updatedSchedule
    if (isWeekly) {
      updatedSchedule = {
        ...schedule,
        weeklyEntries:
          schedule.weeklyEntries?.map((e) =>
            e.id === entry.id ? { ...e, [field]: newValue } : e
          ) || [],
      }
    } else {
      updatedSchedule = {
        ...schedule,
        entries:
          schedule.entries?.map((e) => (e.id === entry.id ? { ...e, [field]: newValue } : e)) || [],
      }
    }
    updateSchedule(updatedSchedule)

    // Set undo state
    setEditing({ entryId: entry.id, field, previousValue, isWeekly })

    // Toast with undo
    toast({
      title: `Updated ${field}`,
      description: `${field} changed to "${newValue}"`,
      duration: 5000,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Undo
            let undoneSchedule
            if (isWeekly) {
              undoneSchedule = {
                ...schedule,
                weeklyEntries:
                  schedule.weeklyEntries?.map((e) =>
                    e.id === entry.id ? { ...e, [field]: previousValue } : e
                  ) || [],
              }
            } else {
              undoneSchedule = {
                ...schedule,
                entries:
                  schedule.entries?.map((e) =>
                    e.id === entry.id ? { ...e, [field]: previousValue } : e
                  ) || [],
              }
            }
            updateSchedule(undoneSchedule)
            setEditing(null)
            if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
          }}
        >
          Undo
        </Button>
      ),
    })

    // Auto-dismiss undo after timeout
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    undoTimeoutRef.current = setTimeout(() => {
      setEditing(null)
    }, 5000)
  }

  // Close edit on escape (simplified)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editing) {
        const schedule = migratedSchedules.find((s) =>
          s.entries?.some((e) => e.id === editing.entryId)
        )
        if (schedule && editing) {
          const entry = schedule.entries?.find((e) => e.id === editing.entryId)
          if (entry) {
            handleInlineEdit(schedule, entry, editing.field, editing.previousValue)
          }
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [editing, migratedSchedules])

  const sortedSchedules = React.useMemo(() => {
    if (!isSorted) return filteredSchedules

    return [...filteredSchedules].sort((a, b) => {
      let aValue, bValue

      switch (isSorted) {
        case 'name':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'date':
          aValue = a.date || ''
          bValue = b.date || ''
          break
        case 'start':
          // Use first entry time
          aValue = a.entries?.[0]?.time || ''
          bValue = b.entries?.[0]?.time || ''
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
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setIsSorted(column)
      setSortDirection('asc')
    }
  }

  const toggleExpand = (scheduleId: string) => {
    setExpandedSchedules((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(scheduleId)) {
        newSet.delete(scheduleId)
      } else {
        newSet.add(scheduleId)
      }
      return newSet
    })
  }

  console.log(
    '🔍 ScheduleTable: About to render table with',
    safeSchedules.length,
    'schedules, isSmallScreen:',
    isSmallScreen
  )
  console.log('🔍 ScheduleTable: sortedSchedules:', sortedSchedules)

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Schedules</CardTitle>
              <Badge variant="secondary" className="ml-2">
                {allAssignees.length - 1} Assignees •{' '}
                {Object.keys(filteredEntriesBySchedule).length} Schedules • {filteredEntryCount}{' '}
                Tasks
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
              <label
                htmlFor="assignee-filter"
                className="text-sm font-medium text-muted-foreground"
              >
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
                        {assignee === 'all' ? '👥 All Assignees' : `👤 ${assignee}`}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {selectedAssignee !== 'all' && (
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
                // Show schedules with valid entries
                return (
                  schedule.entries &&
                  schedule.entries.length > 0 &&
                  schedule.entries.some((entry) => entry.time)
                )
              })
              .map((schedule: Schedule) => (
                <Card key={schedule.id} className="w-full">
                  <CardHeader className="flex flex-row items-start justify-between p-4 pb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground truncate">{schedule.title}</h3>
                          {schedule.scheduleType === 'weekly' && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Repeat className="h-3 w-3" />
                              <span>Weekly</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {schedule.scheduleType === 'weekly' ? (
                            <>
                              <Repeat className="h-3 w-3" />
                              <span className="text-xs">
                                {getWeeklyScheduleDescription(schedule)}
                              </span>
                            </>
                          ) : (
                            <>
                              <Calendar className="h-3 w-3" />
                              {formatDate(schedule.date)}
                            </>
                          )}
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
                      {(schedule.scheduleType === 'weekly'
                        ? schedule.weeklyEntries
                        : schedule.entries) &&
                      ((schedule.scheduleType === 'weekly'
                        ? schedule.weeklyEntries
                        : schedule.entries
                      )?.length || 0) > 0 ? (
                        (schedule.scheduleType === 'weekly'
                          ? schedule.weeklyEntries
                          : schedule.entries)!.map((entry) => (
                          <div key={entry.id} className="border-t pt-2">
                            {schedule.scheduleType === 'weekly' && 'dayOfWeek' in entry && (
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-muted-foreground flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  Day
                                </span>
                                <span className="font-medium capitalize">
                                  {String(entry.dayOfWeek)}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                Time
                              </span>
                              <Input
                                type="time"
                                value={entry.time}
                                onChange={(e) => {
                                  const scheduleWithEntry = { ...schedule }
                                  if (schedule.scheduleType === 'weekly') {
                                    const entryIndex = schedule.weeklyEntries!.findIndex(
                                      (e) => e.id === entry.id
                                    )
                                    scheduleWithEntry.weeklyEntries![entryIndex].time =
                                      e.target.value
                                  } else {
                                    const entryIndex = schedule.entries!.findIndex(
                                      (e) => e.id === entry.id
                                    )
                                    scheduleWithEntry.entries![entryIndex].time = e.target.value
                                  }
                                  handleInlineEdit(
                                    scheduleWithEntry,
                                    entry,
                                    'time',
                                    e.target.value,
                                    schedule.scheduleType === 'weekly'
                                  )
                                }}
                                className="w-32 text-right"
                                size={4}
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-muted-foreground">Assignee</span>
                              <Select
                                value={entry.assignee}
                                onValueChange={(value) => {
                                  const scheduleWithEntry = { ...schedule }
                                  if (schedule.scheduleType === 'weekly') {
                                    const entryIndex = schedule.weeklyEntries!.findIndex(
                                      (e) => e.id === entry.id
                                    )
                                    scheduleWithEntry.weeklyEntries![entryIndex].assignee = value
                                  } else {
                                    const entryIndex = schedule.entries!.findIndex(
                                      (e) => e.id === entry.id
                                    )
                                    scheduleWithEntry.entries![entryIndex].assignee = value
                                  }
                                  handleInlineEdit(
                                    scheduleWithEntry,
                                    entry,
                                    'assignee',
                                    value,
                                    schedule.scheduleType === 'weekly'
                                  )
                                }}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Unassigned">Unassigned</SelectItem>
                                  {housekeepers.map((h: string) => (
                                    <SelectItem key={h} value={h}>
                                      {h}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-muted-foreground">Status</span>
                              <Select
                                value={entry.status}
                                onValueChange={(value) => {
                                  const scheduleWithEntry = { ...schedule }
                                  if (schedule.scheduleType === 'weekly') {
                                    const entryIndex = schedule.weeklyEntries!.findIndex(
                                      (e) => e.id === entry.id
                                    )
                                    scheduleWithEntry.weeklyEntries![entryIndex].status = value as
                                      | 'pending'
                                      | 'completed'
                                  } else {
                                    const entryIndex = schedule.entries!.findIndex(
                                      (e) => e.id === entry.id
                                    )
                                    scheduleWithEntry.entries![entryIndex].status = value as
                                      | 'pending'
                                      | 'completed'
                                  }
                                  handleInlineEdit(
                                    scheduleWithEntry,
                                    entry,
                                    'status',
                                    value,
                                    schedule.scheduleType === 'weekly'
                                  )
                                }}
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="mt-1">
                              <span className="text-muted-foreground">Task</span>
                              <span className="font-medium ml-2">{entry.task}</span>
                            </div>
                            {entry.notes && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                Notes: {entry.notes}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              Time
                            </span>
                            <span className="font-medium">N/A</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Duration</span>
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                              N/A
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <span className="text-muted-foreground">Tasks</span>
                            <span className="text-xs text-muted-foreground italic">No entries</span>
                          </div>
                        </>
                      )}
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
