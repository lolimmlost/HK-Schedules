// Schedule Type Selector Component
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Calendar, Clock } from 'lucide-react'

export type ScheduleType = 'date-specific' | 'weekly'

interface ScheduleTypeSelectorProps {
  onSelect: (type: ScheduleType) => void
  selected?: ScheduleType
}

export function ScheduleTypeSelector({ onSelect, selected }: ScheduleTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <Card
        className={`cursor-pointer transition-all hover:shadow-md ${
          selected === 'date-specific' ? 'ring-2 ring-primary bg-primary/5' : ''
        }`}
        onClick={() => onSelect('date-specific')}
      >
        <CardHeader className="text-center pb-4">
          <Calendar className="h-12 w-12 mx-auto mb-2 text-primary" />
          <CardTitle className="text-lg">Date-Specific Schedule</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Create schedules for specific dates. Perfect for one-time events, holidays, or special
            occasions.
          </p>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Set specific dates</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Time-based entries</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>One-time or recurring</span>
            </div>
          </div>
          {selected === 'date-specific' && (
            <Button className="w-full mt-4" variant="default" size="sm">
              Selected
            </Button>
          )}
        </CardContent>
      </Card>

      <Card
        className={`cursor-pointer transition-all hover:shadow-md ${
          selected === 'weekly' ? 'ring-2 ring-primary bg-primary/5' : ''
        }`}
        onClick={() => onSelect('weekly')}
      >
        <CardHeader className="text-center pb-4">
          <Clock className="h-12 w-12 mx-auto mb-2 text-primary" />
          <CardTitle className="text-lg">Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Create recurring weekly schedules by selecting days of the week. Ideal for regular
            housekeeping routines.
          </p>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Repeat every week</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Select days of week</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Set times per day</span>
            </div>
          </div>
          {selected === 'weekly' && (
            <Button className="w-full mt-4" variant="default" size="sm">
              Selected
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
