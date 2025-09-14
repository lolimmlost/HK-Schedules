import * as React from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Calendar, Clock, Edit, Trash2, Loader2, Plus } from "lucide-react"

import type { Schedule } from "./schedule-form"

interface ScheduleTableProps {
  schedules: Schedule[]
  onEdit: (schedule: Schedule) => void
  onDelete: (id: string) => void
}

export function ScheduleTable({ schedules, onEdit, onDelete }: ScheduleTableProps) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [isSorted, setIsSorted] = React.useState<'name' | 'date' | 'start' | null>(null)
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')

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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "No date"
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDuration = (start: string, end: string) => {
    const startTime = new Date(`2000-01-01T${start}:00`)
    const endTime = new Date(`2000-01-01T${end}:00`)
    const diff = endTime.getTime() - startTime.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const sortedSchedules = React.useMemo(() => {
    if (!isSorted) return schedules

    return [...schedules].sort((a, b) => {
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
          aValue = a.start
          bValue = b.start
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [schedules, isSorted, sortDirection])

  const toggleSort = (column: 'name' | 'date' | 'start') => {
    if (isSorted === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setIsSorted(column)
      setSortDirection('asc')
    }
  }

  const isSmallScreen = window.innerWidth < 768

  if (schedules.length === 0) {
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Current Schedules</CardTitle>
            <Badge variant="secondary" className="ml-2">
              {schedules.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last updated {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop Table View */}
        {!isSmallScreen && (
          <div className="overflow-x-auto hidden sm:table-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead 
                    className="cursor-pointer hover:text-primary/80" 
                    onClick={() => toggleSort('name')}
                  >
                    Housekeeper {isSorted === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-primary/80" 
                    onClick={() => toggleSort('date')}
                  >
                    Date {isSorted === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="w-20 text-center">Time</TableHead>
                  <TableHead className="w-20 text-center">Duration</TableHead>
                  <TableHead className="max-w-xs">Tasks</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSchedules.map((schedule) => (
                  <TableRow key={schedule.id} className="border-b last:border-b-0 hover:bg-accent/50">
                    <Td className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span>{schedule.name}</span>
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
                        <div>{schedule.start}</div>
                        <div className="text-xs text-muted-foreground font-mono">{schedule.end}</div>
                      </div>
                    </Td>
                    <Td className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {getDuration(schedule.start, schedule.end)}
                      </Badge>
                    </Td>
                    <Td className="max-w-xs">
                      <div className="text-sm line-clamp-2">
                        {schedule.tasks || "No tasks specified"}
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
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Mobile Card View */}
        {isSmallScreen && (
          <div className="space-y-4">
            {sortedSchedules.map((schedule) => (
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
                      <span className="font-medium">{schedule.start} - {schedule.end}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                        {getDuration(schedule.start, schedule.end)}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Tasks</span>
                      <div className="ml-2 space-y-1">
                        {schedule.tasks ? (
                          schedule.tasks.split(',').map((task, idx) => (
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