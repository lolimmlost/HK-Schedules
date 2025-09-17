import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ChevronDown, User, Calendar, Clock, Edit, Trash2, Loader2 } from "lucide-react"
import { formatDate, getDuration } from "@/lib/utils"
import type { Schedule, Entry } from "./schedule-form"

interface ScheduleMobileCardsProps {
  schedules: Schedule[]
  filteredEntriesBySchedule: { [scheduleId: string]: Entry[] }
  onEdit: (schedule: Schedule) => void
  onDelete: (id: string) => void
  deletingId: string | null
  onToggleExpand: (scheduleId: string) => void
  expandedSchedules: Set<string>
  selectedAssignee: string
}

export function ScheduleMobileCards({
  schedules,
  filteredEntriesBySchedule,
  onEdit,
  onDelete,
  deletingId,
  onToggleExpand,
  expandedSchedules,
  selectedAssignee
}: ScheduleMobileCardsProps) {
  
  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
      return
    }
    onDelete(id)
  }

  return (
    <div className="space-y-4">
      {schedules.map((schedule) => {
        const scheduleEntries = filteredEntriesBySchedule[schedule.id] || []
        const isExpanded = expandedSchedules.has(schedule.id)
        const firstEntry = scheduleEntries[0]
        const totalDuration = scheduleEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
        
        return (
          <Card key={schedule.id} className="w-full">
            {/* Schedule Header */}
            <CardHeader 
              className={`flex flex-row items-start justify-between p-4 pb-2 cursor-pointer ${isExpanded ? 'rounded-t-lg' : 'rounded-lg'}`}
              onClick={() => onToggleExpand(schedule.id)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-foreground truncate">{schedule.title || schedule.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(schedule.date)}
                  </div>
                  {scheduleEntries.length > 1 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {scheduleEntries.length} tasks
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                {/* Expand/Collapse Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleExpand(schedule.id)
                  }}
                  className="h-8 w-8 p-0"
                >
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                  />
                </Button>
                
                {/* Action Buttons */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(schedule)
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(schedule.id)
                  }}
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

            {/* Schedule Summary (when collapsed) */}
            {!isExpanded && (
              <CardContent className="p-4 pt-0 pb-3 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Time
                    </span>
                    <span className="font-medium">
                      {firstEntry?.time || schedule.start || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      {firstEntry?.duration || (schedule.start && schedule.end ? `${getDuration(schedule.start, schedule.end)}h` : 'N/A')}h
                    </Badge>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-muted-foreground text-sm">Tasks</span>
                  <div className="ml-2 mt-1 text-sm line-clamp-2">
                    {firstEntry?.task || schedule.tasks || "No tasks specified"}
                    {scheduleEntries.length > 1 && (
                      <span className="text-muted-foreground"> + {scheduleEntries.length - 1} more</span>
                    )}
                  </div>
                </div>
              </CardContent>
            )}

            {/* Expanded Entry Details */}
            {isExpanded && (
              <div>
                <CardContent className="p-4 pt-0 pb-3 border-t space-y-3">
                  {/* Summary Row for Multiple Entries */}
                  {scheduleEntries.length > 1 && (
                    <div className="grid grid-cols-2 gap-4 text-sm bg-muted/20 p-2 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Duration</span>
                        <Badge variant="outline" className="text-xs">
                          {totalDuration.toFixed(1)}h
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Tasks</span>
                        <span className="font-medium">{scheduleEntries.length}</span>
                      </div>
                    </div>
                  )}

                  {/* Individual Entry Cards */}
                  {scheduleEntries.map((entry) => (
                    <div 
                      key={`${schedule.id}-entry-${entry.id}`}
                      className={`p-3 rounded-lg border ${
                        entry.assignee === selectedAssignee && selectedAssignee !== 'all' 
                          ? 'border-primary/30 bg-primary/5' 
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-secondary-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {entry.assignee}
                              </Badge>
                              <Badge variant={entry.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                {entry.status}
                              </Badge>
                            </div>
                            <div className="text-sm font-medium truncate">{entry.task}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 text-xs">
                          <span className="text-muted-foreground">{entry.time}</span>
                          <Badge variant="outline" className="px-2 py-0.5">
                            {entry.duration}h
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}