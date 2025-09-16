import { useMemo } from 'react'
import { getDuration } from './utils'
import type { Schedule, Entry } from '../components/schedule-form'

// Custom hook for schedule filtering logic
export function useScheduleFilter(
  schedules: Schedule[],
  selectedAssignee: string
) {
  // Extract unique assignees from all entries across schedules
  const allAssignees = useMemo(() => {
    const assignees = new Set<string>()
    assignees.add("all") // Default option

    schedules.forEach(schedule => {
      if (schedule.entries && schedule.entries.length > 0) {
        schedule.entries.forEach(entry => {
          if (entry.assignee) {
            assignees.add(entry.assignee)
          }
        })
      } else {
        // Legacy schedules
        if (schedule.name) {
          assignees.add(schedule.name)
        }
      }
    })

    return Array.from(assignees).sort()
  }, [schedules])

  // Filter entries across all schedules based on selected assignee
  // Returns filtered entries grouped by schedule ID
  const filteredEntriesBySchedule = useMemo(() => {
    const result: { [scheduleId: string]: Entry[] } = {}

    schedules.forEach(schedule => {
      const scheduleEntries: Entry[] = []
      
      if (schedule.entries && schedule.entries.length > 0) {
        // New format: filter entries by assignee
        schedule.entries.forEach(entry => {
          if (selectedAssignee === "all" || entry.assignee === selectedAssignee) {
            scheduleEntries.push(entry)
          }
        })
      } else {
        // Legacy format: create single entry and check assignee
        if (!schedule.start || !schedule.end || !schedule.name) return // Skip invalid legacy
        
        try {
          const tasks = schedule.tasks || "No tasks specified"
          const duration = getDuration(schedule.start, schedule.end)
          const legacyEntry: Entry = {
            id: `${schedule.id}-entry-1`,
            time: schedule.start,
            duration: duration || '0',
            tasks,
            assignee: schedule.name,
            status: 'pending'
          }
          
          if (selectedAssignee === "all" || legacyEntry.assignee === selectedAssignee) {
            scheduleEntries.push(legacyEntry)
          }
        } catch (error) {
          console.warn(`🔍 useScheduleFilter - skipping invalid legacy schedule ${schedule.id}:`, error)
          // Don't add invalid legacy entries to prevent crashes
        }
      }
      
      // Only include schedules that have filtered entries
      if (scheduleEntries.length > 0) {
        result[schedule.id] = scheduleEntries
      }
    })

    return result
  }, [schedules, selectedAssignee])

  // Get count of filtered entries for display
  const filteredEntryCount = useMemo(() => {
    let count = 0
    Object.values(filteredEntriesBySchedule).forEach(entries => {
      count += entries.length
    })
    return count
  }, [filteredEntriesBySchedule])

  // Get filtered schedules (those with at least one filtered entry)
  const filteredSchedules = useMemo(() => {
    return schedules.filter(schedule => {
      return filteredEntriesBySchedule[schedule.id] && 
             filteredEntriesBySchedule[schedule.id].length > 0
    })
  }, [schedules, filteredEntriesBySchedule])

  // Get assignee-specific count for filter badge
  const assigneeCount = useMemo(() => {
    let count = 0
    Object.values(filteredEntriesBySchedule).forEach(entries => {
      count += entries.filter(entry => entry.assignee === selectedAssignee).length
    })
    return count
  }, [filteredEntriesBySchedule, selectedAssignee])

  return {
    allAssignees,
    filteredEntriesBySchedule,
    filteredSchedules,
    filteredEntryCount,
    assigneeCount,
    selectedAssignee
  }
}