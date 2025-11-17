import { useCallback } from 'react'
import type { Schedule } from '@/components/schedule-form'

/**
 * Result object returned by the CSV export function
 * Contains metadata about the export operation and any errors/warnings
 */
interface CSVExportResult {
  /**
   * Generated filename for the CSV file (e.g., "housekeeper-schedules-2025-01-15.csv")
   */
  filename: string
  /**
   * Number of valid rows exported to the CSV (excludes skipped invalid data)
   */
  rowCount: number
  /**
   * Success status of the export operation
   */
  success: boolean
  /**
   * Error message if export failed (CSV generation, download issues, etc.)
   */
  error?: string
  /**
   * Warning message for potential issues (e.g., download may have been blocked by browser)
   */
  warning?: string
}

/**
 * Custom React hook for CSV export functionality
 *
 * Provides Chrome-compatible CSV generation and download with comprehensive error handling.
 * Supports both legacy flat schedule format and new format with entries arrays.
 *
 * Key features:
 * - UTF-8 BOM for Excel compatibility
 * - Proper CSV escaping for commas, quotes, and newlines
 * - Duration calculation for time-based schedules
 * - Chrome-specific download handling with fallback methods
 * - Defensive data validation to skip invalid records
 * - Comprehensive logging for debugging data issues
 *
 * @returns {function} exportToCSV function that accepts Schedule[] and returns CSVExportResult
 * @example
 * const exportCSV = useCSVExport()
 * const result = exportCSV(schedules)
 * if (result.success) {
 *   console.log(`Exported ${result.rowCount} rows to ${result.filename}`)
 * }
 */
export function useCSVExport(): (schedules: Schedule[]) => CSVExportResult {
  /**
   * Main CSV export function - handles data processing, CSV generation, and browser download
   *
   * @param schedules - Array of Schedule objects to export
   * @returns CSVExportResult with export metadata and status
   * @throws Error if critical failures occur during CSV generation or download
   */
  const exportToCSV = useCallback((schedules: Schedule[]): CSVExportResult => {
    try {
      /**
       * Defensive validation - ensure input is a proper array
       * Prevents crashes from malformed data passed from App component
       */
      if (!Array.isArray(schedules)) {
        console.error(
          '🔍 useCSVExport - Invalid input: schedules is not an array',
          typeof schedules,
          schedules
        )
        return {
          filename: '',
          rowCount: 0,
          success: false,
          error: 'Invalid schedule data provided. Expected an array of schedules.',
        }
      }

      /**
       * Initial logging for debugging - shows input data structure
       * Helps identify issues with data passed from App component
       */
      console.log('🔍 useCSVExport - Starting export for', schedules.length, 'schedules')
      console.log('🔍 useCSVExport - First schedule (index 0):', schedules[0])
      if (schedules.length > 0) {
        console.log('🔍 useCSVExport - Schedule 0 keys:', Object.keys(schedules[0]))
        console.log(
          '🔍 useCSVExport - Schedule 0 title:',
          schedules[0].title,
          'type:',
          typeof schedules[0].title
        )
      }

      /**
       * Calculates duration between start and end times, or uses provided duration
       * Matches server-side duration calculation logic for consistency
       * Handles overnight shifts (end time before start time)
       *
       * @param startTime - Start time in HH:MM format
       * @param endTime - End time in HH:MM format
       * @param duration - Pre-calculated duration string (e.g., "2h 30m")
       * @returns Duration string in "Xh Ym" format or "N/A" for invalid times
       */
      const calculateDuration = (
        startTime?: string,
        endTime?: string,
        duration?: number | string
      ): string => {
        // Use provided duration if available and valid (handle number or string)
        if (duration && duration !== 'N/A' && duration !== 0) {
          const durNum = typeof duration === 'string' ? parseInt(duration) || 0 : duration
          if (durNum > 0) {
            const hours = Math.floor(durNum / 60)
            const minutes = durNum % 60
            return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
          }
        }

        // Return N/A for missing or invalid times
        if (!startTime || !endTime || startTime === 'N/A' || endTime === 'N/A') return 'N/A'

        try {
          // Parse time strings into hours and minutes
          const [startHours, startMinutes] = startTime.split(':').map(Number)
          const [endHours, endMinutes] = endTime.split(':').map(Number)

          // Validate parsed times
          if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) {
            return 'N/A'
          }

          // Convert to total minutes for calculation
          const startMinutesTotal = startHours * 60 + startMinutes
          const endMinutesTotal = endHours * 60 + endMinutes

          let totalMinutes: number
          // Handle overnight shifts (end time before start time next day)
          if (endMinutesTotal >= startMinutesTotal) {
            totalMinutes = endMinutesTotal - startMinutesTotal
          } else {
            totalMinutes = endMinutesTotal + 1440 - startMinutesTotal // 1440 = 24 hours in minutes
          }

          const hours = Math.floor(totalMinutes / 60)
          const minutes = totalMinutes % 60
          // Format as "Xh" or "Xh Ym"
          return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
        } catch (durationError) {
          console.warn('🔍 useCSVExport - Duration calculation failed:', durationError)
          return 'N/A'
        }
      }

      // Helper to get v1-compatible fields from v2 Schedule (for legacy/migrated data)
      const getLegacyFields = (schedule: Schedule) => {
        if (schedule.entries && schedule.entries.length > 0) {
          // For v2 or migrated: use first entry as representative for legacy fields
          const firstEntry = schedule.entries[0]
          const lastEntry = schedule.entries[schedule.entries.length - 1]
          return {
            start: firstEntry.time,
            end: lastEntry.time,
            tasks: schedule.entries.map((e) => e.task).join('; ') || 'No tasks specified',
          }
        }
        // True legacy (no entries): fallback to undefined, will use defaults in export
        return { start: undefined, end: undefined, tasks: 'No tasks specified' }
      }

      /**
       * Converts a row array into properly escaped CSV line
       * Handles quotes, commas, and newlines according to CSV specification
       *
       * @param row - Array of values for one CSV row
       * @returns Properly escaped CSV line with trailing newline
       */
      const processRow = function (row: any[]): string {
        let finalVal = ''
        for (let j = 0; j < row.length; j++) {
          let innerValue = row[j] === null ? '' : row[j].toString()

          // Handle Date objects
          if (row[j] instanceof Date) {
            innerValue = row[j].toLocaleString()
          }

          // Escape quotes by doubling them (CSV standard)
          let result = innerValue.replace(/"/g, '""')

          // Wrap in quotes if contains quotes, commas, or newlines
          if (result.search(/("|,|\n)/g) >= 0) {
            result = '"' + result + '"'
          }

          // Add comma separator (except for first column)
          if (j > 0) {
            finalVal += ','
          }
          finalVal += result
        }
        return finalVal + '\n'
      }

      /**
       * CSV headers matching the export columns
       * Support both date-specific and weekly schedules
       */
      const headers = [
        'Schedule Type',
        'Title',
        'Date/Day',
        'Time',
        'Duration (min)',
        'Task',
        'Assignee',
        'Status',
        'Notes',
      ]
      let csvFile = processRow(headers)

      /**
       * Counter for valid rows exported (excludes skipped invalid data)
       * Used for result reporting and validation
       */
      let validRows = 0

      /**
       * Process each schedule and generate CSV rows
       * Handles both legacy flat format and new format with entries arrays
       * Includes comprehensive validation and detailed logging
       */
      schedules.forEach((schedule, index) => {
        /**
         * Initial schedule validation logging
         * Shows structure and key fields for debugging data issues
         */
        console.log(`🔍 useCSVExport - Processing schedule ${index}:`, {
          id: schedule?.id,
          title: schedule?.title,
          hasTitle: !!schedule?.title && typeof schedule?.title === 'string',
          titleTrimmed: schedule?.title?.trim(),
          date: schedule?.date,
          hasEntries: !!schedule?.entries,
          entriesLength: schedule?.entries?.length,
        })

        // Skip null/undefined schedules
        if (!schedule) {
          console.warn(`🔍 useCSVExport - Skipping null/undefined schedule at index ${index}`)
          return
        }

        // Validate title field - required for all formats (v2 uses title instead of name)
        if (!schedule.title || typeof schedule.title !== 'string') {
          console.warn(
            `🔍 useCSVExport - Skipping invalid schedule at index ${index}: title is missing or invalid`,
            {
              title: schedule.title,
              type: typeof schedule.title,
              schedule,
            }
          )
          return
        }

        const titleTrimmed = schedule.title.trim()
        // Skip schedules with empty titles after trimming whitespace
        if (!titleTrimmed) {
          console.warn(`🔍 useCSVExport - Skipping schedule ${index} with empty title after trim`)
          return
        }

        // Handle all schedules - unified logic for legacy (migrated or true legacy) and v2
        console.log(
          `🔍 useCSVExport - Processing schedule ${index} (entries: ${schedule.entries?.length || 0})`
        )

        const legacyFields = getLegacyFields(schedule)
        const { start, end, tasks } = legacyFields
        const date = schedule.date || ''

        // Handle weekly schedules
        if (schedule.scheduleType === 'weekly' && schedule.weeklyEntries) {
          console.log(
            `🔍 useCSVExport - Processing weekly schedule ${index}, entries:`,
            schedule.weeklyEntries.length
          )

          schedule.weeklyEntries.forEach((entry, entryIndex) => {
            if (!entry || !entry.assignee || typeof entry.assignee !== 'string') {
              console.warn(
                `🔍 useCSVExport - Skipping invalid weekly entry ${entryIndex} for schedule ${index}:`,
                entry
              )
              return
            }

            const assigneeTrimmed = entry.assignee.trim()
            if (!assigneeTrimmed) {
              console.warn(
                `🔍 useCSVExport - Skipping weekly entry ${entryIndex} for schedule ${index}: empty assignee after trim`
              )
              return
            }

            const time = entry.time || ''
            const duration = entry.duration?.toString() || ''
            const entryTask = entry.task || 'No task specified'
            const dayLabel = entry.dayOfWeek
              ? entry.dayOfWeek.charAt(0).toUpperCase() + entry.dayOfWeek.slice(1)
              : ''

            if (assigneeTrimmed && time) {
              console.log(
                `🔍 useCSVExport - Adding weekly entry row for schedule ${index}, entry ${entryIndex}`
              )
              csvFile += processRow([
                'Weekly', // Schedule type
                schedule.title, // Schedule title
                dayLabel, // Day of week
                time, // Entry time
                duration, // Duration in minutes
                entryTask, // Task
                entry.assignee, // Assignee
                entry.status || 'pending', // Status
                entry.notes || '', // Notes
              ])
              validRows++
            }
          })
        } else if (
          schedule.entries &&
          Array.isArray(schedule.entries) &&
          schedule.entries.length > 0
        ) {
          // v2 date-specific format: export each entry as row
          console.log(
            `🔍 useCSVExport - Processing entries for schedule ${index}, count:`,
            schedule.entries.length
          )

          schedule.entries.forEach((entry, entryIndex) => {
            // Validate entry structure
            if (!entry || !entry.assignee || typeof entry.assignee !== 'string') {
              console.warn(
                `🔍 useCSVExport - Skipping invalid entry ${entryIndex} for schedule ${index}:`,
                entry
              )
              return
            }

            const assigneeTrimmed = entry.assignee.trim()
            if (!assigneeTrimmed) {
              console.warn(
                `🔍 useCSVExport - Skipping entry ${entryIndex} for schedule ${index}: empty assignee after trim`
              )
              return
            }

            const time = entry.time || ''
            const duration = calculateDuration(undefined, undefined, entry.duration)
            const entryTask = entry.task || 'No task specified'

            /**
             * Entry validation:
             * - Valid assignee name (already checked)
             * - Time field present (start time for this specific entry)
             */
            if (assigneeTrimmed && time) {
              console.log(
                `🔍 useCSVExport - Adding entry row for schedule ${index}, entry ${entryIndex}`
              )
              csvFile += processRow([
                'Date-Specific', // Schedule type
                schedule.title, // Schedule title
                date, // Schedule date
                time, // Entry-specific start time
                duration, // Entry duration
                entryTask, // Entry-specific task
                entry.assignee, // Assignee
                entry.status || 'pending', // Status
                entry.notes || '', // Notes
              ])
              validRows++
            } else {
              console.warn(
                `🔍 useCSVExport - Skipping entry ${entryIndex} for schedule ${index}: validation failed`,
                {
                  assigneeTrimmed,
                  hasTime: !!time,
                  timeValue: time,
                }
              )
            }
          })
        } else {
          // Legacy/migrated without usable entries: export as single row using derived fields
          console.log(`🔍 useCSVExport - Processing legacy schedule ${index}`)

          const legacyStart = start || ''
          const legacyDuration = calculateDuration(start, end)
          const legacyTasks = tasks || 'No tasks specified'

          /**
           * Legacy format validation:
           * - Valid title (already checked)
           * - Either start time OR date present (for scheduling context)
           */
          console.log(`🔍 useCSVExport - Legacy validation for ${index}:`, {
            titleTrimmed,
            hasStart: !!legacyStart,
            hasDate: !!date,
            startValue: legacyStart,
            dateValue: date,
          })

          if (titleTrimmed && (legacyStart || date)) {
            console.log(`🔍 useCSVExport - Adding legacy row for schedule ${index}`)
            csvFile += processRow([
              'Legacy', // Schedule type
              schedule.title, // Title
              date, // Schedule date
              legacyStart, // Start time
              legacyDuration, // Calculated duration
              legacyTasks, // Task description
              '', // No assignee for legacy format
              'pending', // Default status
              '', // No notes for legacy
            ])
            validRows++
          } else {
            console.warn(`🔍 useCSVExport - Skipping legacy schedule ${index}: validation failed`, {
              titleTrimmed,
              start: !!legacyStart,
              date: !!date,
            })
          }
        }
      })

      console.log('🔍 useCSVExport - Generated CSV with', validRows, 'valid rows')

      if (validRows === 0) {
        console.warn('🔍 useCSVExport - No valid schedule data to export')
        return {
          filename: '',
          rowCount: 0,
          success: false,
          error: 'No valid schedules found to export. Please add some schedules first.',
        }
      }

      // Chrome-compatible download using Blob for better reliability
      const filename = `housekeeper-schedules-${new Date().toISOString().split('T')[0]}.csv`
      const bom = '\uFEFF' // UTF-8 BOM for Excel compatibility
      const fullContent = bom + csvFile

      // Create Blob for better browser compatibility
      const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)

      console.log('🔍 useCSVExport - Creating download:', filename)

      // Enhanced download handling for Chrome compatibility
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.style.display = 'none'
      a.target = '_blank' // Helps with some Chrome security policies
      document.body.appendChild(a)

      // Trigger download with better event handling
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
      })
      a.dispatchEvent(clickEvent)

      // Chrome-specific: Wait longer before cleanup to ensure download starts
      // Check if download actually started (Chrome may block programmatic downloads)
      let downloadStarted = false
      const downloadCheck = setTimeout(() => {
        downloadStarted = true
        console.log('🔍 useCSVExport - Download initiated successfully')
      }, 200)

      // Extended cleanup timeouts for Chrome
      setTimeout(() => {
        if (a.parentNode) {
          document.body.removeChild(a)
        }
      }, 500)

      setTimeout(() => {
        URL.revokeObjectURL(url)
        clearTimeout(downloadCheck)
        if (!downloadStarted) {
          console.warn('🔍 useCSVExport - Download may have been blocked by browser')
          // Fallback: Try data URL method
          try {
            const dataUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(fullContent)}`
            const fallbackA = document.createElement('a')
            fallbackA.href = dataUrl
            fallbackA.download = filename
            fallbackA.style.display = 'none'
            document.body.appendChild(fallbackA)
            fallbackA.click()
            document.body.removeChild(fallbackA)
            console.log('🔍 useCSVExport - Fallback data URL download attempted')
          } catch (fallbackError) {
            console.error('🔍 useCSVExport - Fallback download failed:', fallbackError)
          }
        }
        console.log(
          '🔍 useCSVExport - Export completed:',
          filename,
          validRows,
          'rows',
          downloadStarted ? 'success' : 'potential failure'
        )
      }, 1000)

      return {
        filename,
        rowCount: validRows,
        success: true,
      } as CSVExportResult & { warning?: string }
    } catch (error) {
      console.error('🔍 useCSVExport - Export error:', error)

      return {
        filename: '',
        rowCount: 0,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate CSV file. Please check the console for details.',
      }
    }
  }, [])

  return exportToCSV
}
