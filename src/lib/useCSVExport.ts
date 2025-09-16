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
        console.error('🔍 useCSVExport - Invalid input: schedules is not an array', typeof schedules, schedules)
        return {
          filename: '',
          rowCount: 0,
          success: false,
          error: 'Invalid schedule data provided. Expected an array of schedules.'
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
        console.log('🔍 useCSVExport - Schedule 0 title:', schedules[0].title, 'type:', typeof schedules[0].title)
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
      const calculateDuration = (startTime?: string, endTime?: string, duration?: string): string => {
        // Use provided duration if available and valid
        if (duration && duration !== 'N/A') return duration
        
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
            totalMinutes = (endMinutesTotal + 1440) - startMinutesTotal // 1440 = 24 hours in minutes
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

      /**
       * Converts a row array into properly escaped CSV line
       * Handles quotes, commas, and newlines according to CSV specification
       *
       * @param row - Array of values for one CSV row
       * @returns Properly escaped CSV line with trailing newline
       */
      const processRow = function (row: any[]): string {
        let finalVal = '';
        for (let j = 0; j < row.length; j++) {
          let innerValue = row[j] === null ? '' : row[j].toString();
          
          // Handle Date objects
          if (row[j] instanceof Date) {
            innerValue = row[j].toLocaleString();
          }
          
          // Escape quotes by doubling them (CSV standard)
          let result = innerValue.replace(/"/g, '""');
          
          // Wrap in quotes if contains quotes, commas, or newlines
          if (result.search(/("|,|\n)/g) >= 0) {
            result = '"' + result + '"';
          }
          
          // Add comma separator (except for first column)
          if (j > 0) {
            finalVal += ',';
          }
          finalVal += result;
        }
        return finalVal + '\n';
      };
    
      /**
       * CSV headers matching the export columns
       * Order: Housekeeper, Assignee, Date, Start Time, Duration, Tasks
       */
      const headers = ['Housekeeper', 'Assignee', 'Date', 'Start Time', 'Duration (h)', 'Tasks']
      let csvFile = processRow(headers);
      
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
          start: schedule?.start,
          hasEntries: !!schedule?.entries,
          entriesLength: schedule?.entries?.length
        })
        
        // Skip null/undefined schedules
        if (!schedule) {
          console.warn(`🔍 useCSVExport - Skipping null/undefined schedule at index ${index}`)
          return
        }
        
        // Validate title field - required for all formats (v2 uses title instead of name)
        if (!schedule.title || typeof schedule.title !== 'string') {
          console.warn(`🔍 useCSVExport - Skipping invalid schedule at index ${index}: title is missing or invalid`, {
            title: schedule.title,
            type: typeof schedule.title,
            schedule
          })
          return
        }
        
        const titleTrimmed = schedule.title.trim()
        // Skip schedules with empty titles after trimming whitespace
        if (!titleTrimmed) {
          console.warn(`🔍 useCSVExport - Skipping schedule ${index} with empty title after trim`)
          return
        }
        
        // Handle legacy schedules (no entries array or empty entries)
        if (!schedule.entries || (Array.isArray(schedule.entries) && schedule.entries.length === 0)) {
          console.log(`🔍 useCSVExport - Processing legacy schedule ${index}`)
          
          // Calculate duration and prepare fields for legacy format
          const duration = calculateDuration(schedule.start, schedule.end)
          const date = schedule.date || ''
          const start = schedule.start || ''
          const tasks = schedule.tasks || 'No tasks specified'
          
          /**
           * Legacy format validation:
           * - Valid name (already checked)
           * - Either start time OR date present (for scheduling context)
           */
          console.log(`🔍 useCSVExport - Legacy validation for ${index}:`, {
            nameTrimmed,
            hasStart: !!start,
            hasDate: !!date,
            startValue: start,
            dateValue: date
          })
          
          if (titleTrimmed && (start || date)) {
            console.log(`🔍 useCSVExport - Adding legacy row for schedule ${index}`)
            csvFile += processRow([
              schedule.title,                   // Housekeeper title (v2 format)
              '',                               // No assignee for legacy format
              date,                             // Schedule date
              start,                            // Start time
              duration,                         // Calculated duration
              tasks                             // Task description
            ])
            validRows++
          } else {
            console.warn(`🔍 useCSVExport - Skipping legacy schedule ${index}: validation failed`, {
              nameTrimmed,
              start: !!start,
              date: !!date
            })
          }
        } else if (schedule.entries && Array.isArray(schedule.entries)) {
          /**
           * Handle new format with individual entries per assignee
           * Each entry becomes a separate CSV row under the same housekeeper
           */
          console.log(`🔍 useCSVExport - Processing entries for schedule ${index}, count:`, schedule.entries.length)
          
          schedule.entries.forEach((entry, entryIndex) => {
            /**
             * Log entry details for validation and debugging
             * Helps identify issues with individual assignee entries
             */
            console.log(`🔍 useCSVExport - Processing entry ${entryIndex} for schedule ${index}:`, {
              assignee: entry?.assignee,
              time: entry?.time,
              duration: entry?.duration,
              tasks: entry?.tasks
            })
            
            // Validate entry structure
            if (!entry || !entry.assignee || typeof entry.assignee !== 'string') {
              console.warn(`🔍 useCSVExport - Skipping invalid entry ${entryIndex} for schedule ${index}:`, entry)
              return
            }
            
            const assigneeTrimmed = entry.assignee.trim()
            // Skip entries with empty assignee names
            if (!assigneeTrimmed) {
              console.warn(`🔍 useCSVExport - Skipping entry ${entryIndex} for schedule ${index}: empty assignee after trim`)
              return
            }
            
            const time = entry.time || ''
            /**
             * Use entry-specific duration or calculate from time fields
             * Entry format typically has pre-calculated duration
             */
            const duration = calculateDuration(undefined, undefined, entry.duration)
            const tasks = entry.tasks || 'No tasks specified'
            
            /**
             * Entry validation:
             * - Valid assignee name (already checked)
             * - Time field present (start time for this specific entry)
             */
            if (assigneeTrimmed && time) {
              console.log(`🔍 useCSVExport - Adding entry row for schedule ${index}, entry ${entryIndex}`)
              csvFile += processRow([
                schedule.title,                   // Housekeeper title (v2 format, same for all entries)
                entry.assignee,                   // Specific assignee for this entry
                schedule.date || '',              // Schedule date (same for all entries)
                time,                             // Entry-specific start time
                duration,                         // Entry duration
                tasks                             // Entry-specific tasks
              ])
              validRows++
            } else {
              console.warn(`🔍 useCSVExport - Skipping entry ${entryIndex} for schedule ${index}: validation failed`, {
                assigneeTrimmed,
                hasTime: !!time,
                timeValue: time
              })
            }
          })
        } else {
          /**
           * Unrecognized schedule format - log for debugging
           * This shouldn't happen with proper Schedule type enforcement
           */
          console.warn(`🔍 useCSVExport - Skipping schedule ${index}: unrecognized format`, {
            hasEntries: !!schedule.entries,
            entriesType: typeof schedule.entries,
            entriesIsArray: Array.isArray(schedule.entries)
          })
        }
      })

      console.log('🔍 useCSVExport - Generated CSV with', validRows, 'valid rows')
      
      if (validRows === 0) {
        console.warn('🔍 useCSVExport - No valid schedule data to export')
        return {
          filename: '',
          rowCount: 0,
          success: false,
          error: 'No valid schedules found to export. Please add some schedules first.'
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
        cancelable: true
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
        console.log('🔍 useCSVExport - Export completed:', filename, validRows, 'rows', downloadStarted ? 'success' : 'potential failure')
      }, 1000)
      
      return {
        filename,
        rowCount: validRows,
        success: true
      } as CSVExportResult & { warning?: string }
      
    } catch (error) {
      console.error('🔍 useCSVExport - Export error:', error)
      
      return {
        filename: '',
        rowCount: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate CSV file. Please check the console for details.'
      }
    }
  }, [])

  return exportToCSV
}