// Schedule Form Wrapper that handles both date-specific and weekly schedules
import { useState } from 'react'
import { ScheduleForm } from './schedule-form'
import { WeeklyScheduleForm } from './weekly-schedule-form'
import { ScheduleTypeSelector, ScheduleType } from './schedule-type-selector'
import type { Schedule } from './schedule-form'

interface ScheduleFormWrapperProps {
  initialData?: Partial<Schedule>
  onSubmit: (data: Schedule) => void
  onCancel?: () => void
}

export function ScheduleFormWrapper({ initialData, onSubmit, onCancel }: ScheduleFormWrapperProps) {
  const [scheduleType, setScheduleType] = useState<ScheduleType>(
    initialData?.scheduleType || 'date-specific'
  )

  const isEditing = !!initialData?.id

  // Don't show type selector if editing - preserve the original type
  const showTypeSelector = !isEditing

  const handleSubmit = (data: Schedule) => {
    onSubmit(data)
  }

  const handleTypeSelect = (type: ScheduleType) => {
    setScheduleType(type)
  }

  return (
    <div className="w-full max-w-6xl mx-auto no-print">
      {showTypeSelector && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Choose Schedule Type</h3>
          <ScheduleTypeSelector onSelect={handleTypeSelect} selected={scheduleType} />
        </div>
      )}

      {scheduleType === 'date-specific' ? (
        <ScheduleForm
          initialData={{
            ...initialData,
            scheduleType: 'date-specific',
          }}
          onSubmit={handleSubmit}
          onCancel={onCancel}
        />
      ) : (
        <WeeklyScheduleForm
          initialData={{
            ...initialData,
            scheduleType: 'weekly',
          }}
          onSubmit={handleSubmit}
          onCancel={onCancel}
        />
      )}
    </div>
  )
}
