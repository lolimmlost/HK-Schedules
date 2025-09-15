import { useCallback } from 'react'
import type { Schedule } from '@/components/schedule-form'

interface CSVExportResult {
  filename: string
  rowCount: number
  success: boolean
  error?: string
}

export function useCSVExport(): (schedules: Schedule[]) => CSVExportResult {
  const exportToCSV = useCallback((schedules: Schedule[]): CSVExportResult => {
    try {
      // Defensive check for non-array input
      if (!Array.isArray(schedules)) {
        console.error('🔍 useCSVExport - Invalid input: schedules is not an array', typeof schedules, schedules)
        return {
          filename: '',
          rowCount: 0,
          success: false,
          error: 'Invalid schedule data provided. Expected an array of schedules.'
        }
      }

      console.log('🔍 useCSVExport - Starting export for', schedules.length, 'schedules')
      
      // Helper function to calculate duration (same as server-side)
      const calculateDuration = (startTime?: string, endTime?: string, duration?: string): string => {
        if (duration && duration !== 'N/A') return duration
        if (!startTime || !endTime || startTime === 'N/A' || endTime === 'N/A') return 'N/A'
        
        try {
          const [startHours, startMinutes] = startTime.split(':').map(Number)
          const [endHours, endMinutes] = endTime.split(':').map(Number)
          
          if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) {
            return 'N/A'
          }
          
          const startMinutesTotal = startHours * 60 + startMinutes
          const endMinutesTotal = endHours * 60 + endMinutes
          
          let totalMinutes
          if (endMinutesTotal >= startMinutesTotal) {
            totalMinutes = endMinutesTotal - startMinutesTotal
          } else {
            totalMinutes = (endMinutesTotal + 1440) - startMinutesTotal
          }
          
          const hours = Math.floor(totalMinutes / 60)
          const minutes = totalMinutes % 60
          return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
        } catch {
          return 'N/A'
        }
      }

      const processRow = function (row: any[]) {
        let finalVal = '';
        for (let j = 0; j < row.length; j++) {
          let innerValue = row[j] === null ? '' : row[j].toString();
          if (row[j] instanceof Date) {
            innerValue = row[j].toLocaleString();
          }
          let result = innerValue.replace(/"/g, '""');
          if (result.search(/("|,|\n)/g) >= 0)
            result = '"' + result + '"';
          if (j > 0)
            finalVal += ',';
          finalVal += result;
        }
        return finalVal + '\n';
      };
    
      const headers = ['Housekeeper', 'Assignee', 'Date', 'Start Time', 'Duration (h)', 'Tasks']
      let csvFile = processRow(headers);
      
      let validRows = 0
      
      schedules.forEach(schedule => {
        if (!schedule || !schedule.name || typeof schedule.name !== 'string') {
          console.warn('🔍 useCSVExport - Skipping invalid schedule:', schedule)
          return
        }
        
        // Handle legacy schedules (no entries array)
        if (!schedule.entries || (Array.isArray(schedule.entries) && schedule.entries.length === 0)) {
          const duration = calculateDuration(schedule.start, schedule.end)
          const date = schedule.date || ''
          const start = schedule.start || ''
          const tasks = schedule.tasks || 'No tasks specified'
          
          if (schedule.name.trim() && (start || date)) {
            csvFile += processRow([
              schedule.name,
              '', // No assignee for legacy
              date,
              start,
              duration,
              tasks
            ])
            validRows++
          }
        } else if (schedule.entries && Array.isArray(schedule.entries)) {
          // Handle new format with entries
          schedule.entries.forEach(entry => {
            if (!entry || !entry.assignee || typeof entry.assignee !== 'string') {
              console.warn('🔍 useCSVExport - Skipping invalid entry:', entry)
              return
            }
            
            const duration = calculateDuration(undefined, undefined, entry.duration)
            const time = entry.time || ''
            const tasks = entry.tasks || 'No tasks specified'
            
            if (entry.assignee.trim() && time) {
              csvFile += processRow([
                schedule.name,
                entry.assignee,
                schedule.date || '',
                time,
                duration,
                tasks
              ])
              validRows++
            }
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
      
      // Create and trigger download with Blob URL
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()

      // Revoke URL to prevent memory leaks
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 100)
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a)
        console.log('🔍 useCSVExport - Export completed successfully:', filename, validRows, 'rows')
      }, 100)
      
      return {
        filename,
        rowCount: validRows,
        success: true
      }
      
    } catch (error) {
      console.error('🔍 useCSVExport - Export error:', error)
      return {
        filename: '',
        rowCount: 0,
        success: false,
        error: 'Failed to generate CSV file. Please check the console for details.'
      }
    }
  }, [])

  return exportToCSV
}