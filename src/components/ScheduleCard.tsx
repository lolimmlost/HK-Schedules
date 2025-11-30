import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit3, Trash2, Eye, Clock, Calendar, Users, Repeat } from 'lucide-react'
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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg leading-tight">{schedule.title}</CardTitle>
              {isWeekly && (
                <Badge variant="outline" className="text-xs">
                  <Repeat className="h-3 w-3 mr-1" />
                  Weekly
                </Badge>
              )}
            </div>
            <Badge variant="secondary" className="mt-1">
              {schedule.category.charAt(0).toUpperCase() + schedule.category.slice(1)}
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(schedule)}
              title="View Schedule"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(schedule)}
              title="Edit Schedule"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(schedule.id)}
              title="Delete Schedule"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {schedule.description && (
          <CardDescription className="mb-3 line-clamp-2">{schedule.description}</CardDescription>
        )}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span>{entryCount(schedule)} entries</span>
          </div>

          {isWeekly ? (
            <>
              <div className="flex items-center gap-2">
                <Repeat className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs">{weeklyDescription}</span>
              </div>
              {weeklyTimeRange && (
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">{weeklyTimeRange}</span>
                </div>
              )}
            </>
          ) : (
            <>
              {schedule.date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>{formatDate(schedule.date)}</span>
                </div>
              )}
            </>
          )}

          <div className="flex items-center gap-2">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span>
              {isWeekly
                ? schedule.weeklyEntries
                    ?.map((e) => e.assignee)
                    .filter(Boolean)
                    .join(', ') || 'Unassigned'
                : schedule.entries
                    ?.map((e) => e.assignee)
                    .filter(Boolean)
                    .join(', ') || 'Unassigned'}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Last updated: {getLastUpdated(schedule)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
