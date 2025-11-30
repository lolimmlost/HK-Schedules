import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Edit3,
  Trash2,
  Eye,
  Clock,
  Calendar,
  Users,
  Repeat,
  ChevronRight,
  ListTodo,
} from 'lucide-react'
import { Schedule } from './schedule-form'
import { formatDate } from '@/lib/utils'
import {
  getWeeklyScheduleDescription,
  getWeeklyScheduleTimeRange,
} from '@/lib/weekly-schedule-utils'

interface ScheduleCardProps {
  schedule: Schedule
  onView: (schedule: Schedule) => void
  onEdit: (schedule: Schedule) => void
  onDelete: (id: string) => void
}

const categoryColors: Record<string, string> = {
  housekeeping: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  maintenance: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  cleaning: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  inspection: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  general: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
}

export function ScheduleCard({ schedule, onView, onEdit, onDelete }: ScheduleCardProps) {
  const entryCount = (s: Schedule) => {
    if (s.scheduleType === 'weekly') {
      return s.weeklyEntries?.length || 0
    }
    return s.entries?.length || 1
  }
  const getLastUpdated = (s: Schedule) => formatDate(s.date || new Date().toISOString())

  const isWeekly = schedule.scheduleType === 'weekly'
  const weeklyDescription = isWeekly ? getWeeklyScheduleDescription(schedule) : ''
  const weeklyTimeRange = isWeekly ? getWeeklyScheduleTimeRange(schedule) : ''

  const assignees = isWeekly
    ? [...new Set(schedule.weeklyEntries?.map((e) => e.assignee).filter(Boolean) || [])]
    : [...new Set(schedule.entries?.map((e) => e.assignee).filter(Boolean) || [])]

  const categoryClass = categoryColors[schedule.category.toLowerCase()] || categoryColors['general']

  return (
    <Card className="group hover:shadow-lg hover:border-primary/20 transition-all duration-200 overflow-hidden">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />

      <CardHeader className="pb-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base font-semibold leading-tight truncate">
                {schedule.title}
              </CardTitle>
              {isWeekly && (
                <Badge
                  variant="outline"
                  className="text-xs shrink-0 bg-primary/5 border-primary/20"
                >
                  <Repeat className="h-3 w-3 mr-1" />
                  Weekly
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={`text-xs font-medium ${categoryClass}`}>
                {schedule.category.charAt(0).toUpperCase() + schedule.category.slice(1)}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <ListTodo className="h-3 w-3" />
                {entryCount(schedule)} tasks
              </span>
            </div>
          </div>

          {/* Action buttons - show on hover on desktop */}
          <div className="flex gap-0.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onView(schedule)}
              title="View Schedule"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(schedule)}
              title="Edit Schedule"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(schedule.id)}
              title="Delete Schedule"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {schedule.description && (
          <CardDescription className="mb-4 line-clamp-2 text-sm">
            {schedule.description}
          </CardDescription>
        )}

        <div className="space-y-3">
          {/* Date/Time info */}
          <div className="flex flex-wrap gap-3 text-sm">
            {isWeekly ? (
              <>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Repeat className="h-3.5 w-3.5" />
                  <span className="text-xs">{weeklyDescription}</span>
                </div>
                {weeklyTimeRange && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-xs">{weeklyTimeRange}</span>
                  </div>
                )}
              </>
            ) : (
              schedule.date && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(schedule.date)}</span>
                </div>
              )
            )}
          </div>

          {/* Assignees */}
          {assignees.length > 0 && (
            <div className="flex items-start gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
              <div className="flex flex-wrap gap-1">
                {assignees.slice(0, 3).map((assignee, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground"
                  >
                    {assignee}
                  </span>
                ))}
                {assignees.length > 3 && (
                  <span className="text-xs text-muted-foreground px-1">
                    +{assignees.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <span className="text-xs text-muted-foreground">
              Updated {getLastUpdated(schedule)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-primary hover:text-primary gap-1"
              onClick={() => onView(schedule)}
            >
              View details
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
