// Utility functions for weekly schedules
import type { Schedule, WeeklyScheduleEntry, DayOfWeek } from '@/components/schedule-form'

export const DAYS_OF_WEEK: { value: DayOfWeek; label: string; index: number }[] = [
  { value: 'monday', label: 'Monday', index: 1 },
  { value: 'tuesday', label: 'Tuesday', index: 2 },
  { value: 'wednesday', label: 'Wednesday', index: 3 },
  { value: 'thursday', label: 'Thursday', index: 4 },
  { value: 'friday', label: 'Friday', index: 5 },
  { value: 'saturday', label: 'Saturday', index: 6 },
  { value: 'sunday', label: 'Sunday', index: 0 },
]

export function getDayOfWeekLabel(dayOfWeek: DayOfWeek): string {
  return DAYS_OF_WEEK.find((day) => day.value === dayOfWeek)?.label || dayOfWeek
}

export function sortWeeklyEntriesByDay(entries: WeeklyScheduleEntry[]): WeeklyScheduleEntry[] {
  return [...entries].sort((a, b) => {
    const aIndex = DAYS_OF_WEEK.find((day) => day.value === a.dayOfWeek)?.index || 0
    const bIndex = DAYS_OF_WEEK.find((day) => day.value === b.dayOfWeek)?.index || 0
    if (aIndex !== bIndex) {
      return aIndex - bIndex
    }
    // If same day, sort by time
    return a.time.localeCompare(b.time)
  })
}

export function groupWeeklyEntriesByDay(
  entries: WeeklyScheduleEntry[]
): Record<DayOfWeek, WeeklyScheduleEntry[]> {
  const grouped: Record<DayOfWeek, WeeklyScheduleEntry[]> = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  }

  entries.forEach((entry) => {
    if (entry.dayOfWeek) {
      grouped[entry.dayOfWeek].push(entry)
    }
  })

  // Sort entries within each day by time
  Object.keys(grouped).forEach((day) => {
    grouped[day as DayOfWeek].sort((a, b) => a.time.localeCompare(b.time))
  })

  return grouped
}

export function generateWeeklyScheduleCSV(schedules: Schedule[]): string[][] {
  const rows: string[][] = []

  // Add header for weekly schedules
  rows.push([
    'Schedule Type',
    'Title',
    'Day of Week',
    'Time',
    'Duration (min)',
    'Task',
    'Assignee',
    'Status',
    'Notes',
  ])

  schedules.forEach((schedule) => {
    if (schedule.scheduleType === 'weekly' && schedule.weeklyEntries) {
      schedule.weeklyEntries.forEach((entry) => {
        rows.push([
          'Weekly',
          schedule.title || '',
          getDayOfWeekLabel(entry.dayOfWeek),
          entry.time,
          entry.duration.toString(),
          entry.task || '',
          entry.assignee || '',
          entry.status || 'pending',
          entry.notes || '',
        ])
      })
    } else if (schedule.scheduleType === 'date-specific') {
      // Handle date-specific schedules (existing format)
      schedule.entries?.forEach((entry) => {
        rows.push([
          'Date-Specific',
          schedule.title || '',
          schedule.date || '',
          entry.time,
          entry.duration.toString(),
          entry.task || '',
          entry.assignee || '',
          entry.status || 'pending',
          entry.notes || '',
        ])
      })
    }
  })

  return rows
}

export function getWeeklyScheduleDescription(schedule: Schedule): string {
  if (schedule.scheduleType !== 'weekly' || !schedule.weeklyEntries?.length) {
    return 'No weekly schedule'
  }

  const grouped = groupWeeklyEntriesByDay(schedule.weeklyEntries)
  const activeDays = Object.entries(grouped)
    .filter(([_, entries]) => entries.length > 0)
    .map(([day, _]) => getDayOfWeekLabel(day as DayOfWeek))

  if (activeDays.length === 0) {
    return 'No active days'
  }

  if (activeDays.length === 7) {
    return 'Every day'
  }

  if (
    activeDays.length === 5 &&
    !activeDays.includes('Saturday') &&
    !activeDays.includes('Sunday')
  ) {
    return 'Weekdays'
  }

  if (activeDays.length === 2 && activeDays.includes('Saturday') && activeDays.includes('Sunday')) {
    return 'Weekends'
  }

  return activeDays.join(', ')
}

export function getWeeklyScheduleTimeRange(schedule: Schedule): string {
  if (schedule.scheduleType !== 'weekly' || !schedule.weeklyEntries?.length) {
    return 'No times set'
  }

  const allTimes = schedule.weeklyEntries.map((entry) => entry.time).sort()
  if (allTimes.length === 0) return 'No times set'
  if (allTimes.length === 1) return allTimes[0]

  return `${allTimes[0]} - ${allTimes[allTimes.length - 1]}`
}

export function isWeeklyScheduleActiveOnDay(schedule: Schedule, dayOfWeek: DayOfWeek): boolean {
  if (schedule.scheduleType !== 'weekly' || !schedule.weeklyEntries) {
    return false
  }

  return schedule.weeklyEntries.some((entry) => entry.dayOfWeek === dayOfWeek)
}

export function getWeeklyEntriesForDay(
  schedule: Schedule,
  dayOfWeek: DayOfWeek
): WeeklyScheduleEntry[] {
  if (schedule.scheduleType !== 'weekly' || !schedule.weeklyEntries) {
    return []
  }

  return schedule.weeklyEntries
    .filter((entry) => entry.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.time.localeCompare(b.time))
}
