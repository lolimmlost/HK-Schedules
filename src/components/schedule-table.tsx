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
import { useState } from "react"

import type { Schedule } from "./schedule-form"

interface ScheduleTableProps {
  schedules: Schedule[]
  onEdit: (schedule: Schedule) => void
  onDelete: (id: string) => void
}

export function ScheduleTable({ schedules, onEdit, onDelete }: ScheduleTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-32">Housekeeper</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-20 text-center">Time</TableHead>
                <TableHead className="w-20 text-center">Duration</TableHead>
                <TableHead className="max-w-xs">Tasks</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
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

        {/* Mobile empty state - hidden on desktop */}
        <div className="md:hidden mt-4 p-4 bg-muted rounded-md text-center">
          <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <h3 className="text-lg font-medium mb-1">No schedules yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start by adding your first housekeeper schedule above.
          </p>
          <Button variant="outline" size="sm" className="w-full max-w-xs">
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}