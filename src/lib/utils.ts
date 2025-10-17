import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString?: string): string {
  if (!dateString) return 'No date'

  // Extract date part (YYYY-MM-DD) from various formats
  const dateMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!dateMatch) return 'Invalid Date'

  const [, year, month, day] = dateMatch
  const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)))
  if (isNaN(date.getTime())) return 'Invalid Date'

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function getDuration(start: string, end: string): string {
  if (!start || !end) return '0h 0m'

  try {
    // Validate time format HH:MM (basic validation)
    if (!start.match(/^(\d{1,2}):(\d{2})$/) || !end.match(/^(\d{1,2}):(\d{2})$/)) {
      console.warn('🔍 getDuration - invalid time format:', start, end)
      return '0h 0m'
    }

    const startTime = new Date(`2000-01-01T${start}:00`)
    const endTime = new Date(`2000-01-01T${end}:00`)

    // Check if dates are valid
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      console.warn('🔍 getDuration - invalid time values:', start, end)
      return '0h 0m'
    }

    const diff = endTime.getTime() - startTime.getTime()

    // Handle overnight shifts
    let totalDiff = diff
    if (totalDiff < 0) {
      totalDiff += 24 * 60 * 60 * 1000 // Add 24 hours
    }

    const hours = Math.floor(totalDiff / (1000 * 60 * 60))
    const minutes = Math.floor((totalDiff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  } catch (error) {
    console.warn('🔍 getDuration error:', start, end, error)
    return '0h 0m'
  }
}
