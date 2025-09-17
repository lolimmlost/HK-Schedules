import * as React from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  Td,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronDown, ChevronRight, User, Calendar, Edit, Trash2, Loader2 } from "lucide-react"
import { formatDate, getDuration } from "@/lib/utils"
import type { Schedule, Entry } from "./schedule-form"

interface ScheduleDesktopTableProps {
  schedules: Schedule[]
  filteredEntriesBySchedule: { [scheduleId: string]: Entry[] }
  onEdit: (schedule: Schedule) => void
  onDelete: (id: string) => void
  deletingId: string | null
  isSorted: 'name' | 'date' | 'start' | null
  sortDirection: 'asc' | 'desc'
  onToggleSort: (column: 'name' | 'date' | 'start') => void
  onToggleExpand: (scheduleId: string) => void
  expandedSchedules: Set<string>
  selectedAssignee: string
}

export function ScheduleDesktopTable({
  schedules,
  filteredEntriesBySchedule,
  onEdit,
  onDelete,
  deletingId,
  isSorted,
  sortDirection,
  onToggleSort,
  onToggleExpand,
  expandedSchedules,
  selectedAssignee
}: ScheduleDesktopTableProps) {
  
  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
      return
    }
    onDelete(id)
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12" />
            <TableHead
              className="cursor-pointer hover:text-primary/80"
              onClick={() => onToggleSort('name')}
            >
              Schedule {isSorted === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-primary/80"
              onClick={() => onToggleSort('date')}
            >
              Date {isSorted === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead className="w-20 text-center">Time</TableHead>
            <TableHead className="w-20 text-center">Duration</TableHead>
            <TableHead className="max-w-md">Task / Notes</TableHead>
            <TableHead className="w-32 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.map((schedule) => {
            const scheduleEntries = filteredEntriesBySchedule[schedule.id] || schedule.entries || []
            const isExpanded = expandedSchedules.has(schedule.id)
            const firstEntry = scheduleEntries[0]
            const totalDurationMinutes = scheduleEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
            const totalDurationHours = (totalDurationMinutes / 60).toFixed(1)
            
            return (
              <React.Fragment key={schedule.id}>
                {/* Schedule Header Row */}
                <TableRow key={`${schedule.id}-header`} className="bg-accent/20 hover:bg-accent/30">
                  <Td className="w-12">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleExpand(schedule.id)}
                      className="h-8 w-8 p-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </Td>
                  <Td className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span>{schedule.title}</span>
                      {scheduleEntries.length > 1 && (
                        <Badge variant="secondary" className="text-xs">
                          {scheduleEntries.length} tasks
                        </Badge>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(schedule.date)}</span>
                    </div>
                  </Td>
                  <Td className="text-center">
                    <div className="text-sm">
                      <div>{firstEntry?.time || 'N/A'}</div>
                      {isExpanded && scheduleEntries.length > 1 && (
                        <div className="text-xs text-muted-foreground font-mono">
                          Multiple times
                        </div>
                      )}
                    </div>
                  </Td>
                  <Td className="text-center">
                    <Badge variant="outline" className="text-xs">
                      {isExpanded ? `${totalDurationHours}h` : `${(firstEntry?.duration || 0) / 60}h`}
                    </Badge>
                  </Td>
                  <Td className="max-w-xs">
                    <div className="text-sm line-clamp-2">
                      {firstEntry?.task || schedule.description || "No tasks specified"}
                      {isExpanded && scheduleEntries.length > 1 && (
                        <span className="text-muted-foreground"> + {scheduleEntries.length - 1} more</span>
                      )}
                    </div>
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(schedule)}
                        className="h-8 w-8 p-0"
                        title="Edit schedule"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(schedule.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                        disabled={deletingId === schedule.id}
                        title="Delete schedule"
                      >
                        {deletingId === schedule.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </Td>
                </TableRow>

                {/* Entry Rows - only show when expanded */}
                {isExpanded && scheduleEntries.map((entry, index) => (
                  <TableRow
                    key={`${schedule.id}-entry-${entry.id}`}
                    className={`hover:bg-accent/50 ${entry.assignee === selectedAssignee && selectedAssignee !== 'all' ? 'bg-primary/5 border-l-4 border-primary/20' : ''}`}
                  >
                    <Td className="w-12 bg-accent/20" />
                    <Td className="pl-14">
                      <Badge variant="outline" className="text-xs">
                        {entry.assignee || 'Unassigned'}
                      </Badge>
                    </Td>
                    <Td />
                    <Td className="text-center">
                      <div className="text-sm">{entry.time}</div>
                    </Td>
                    <Td className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {(entry.duration || 0) / 60}h
                      </Badge>
                    </Td>
                    <Td className="max-w-xs">
                      <div className="text-sm line-clamp-2">{entry.task}</div>
                      {entry.notes && (
                        <div className="text-xs text-muted-foreground mt-1 italic">
                          Notes: {entry.notes}
                        </div>
                      )}
                    </Td>
                    <Td />
                  </TableRow>
                ))}
              </React.Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}