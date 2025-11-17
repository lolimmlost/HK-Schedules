import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Calendar, Clock } from 'lucide-react'

import type { Schedule, Entry, WeeklyScheduleEntry } from './schedule-form'

interface PrintScheduleProps {
  schedules: Schedule[]
  housekeeper?: string
  companyName?: string
  printedAt?: Date
  className?: string
  isSingleSchedule?: boolean // New prop to indicate single schedule preview
}

export function PrintSchedule({
  schedules,
  housekeeper,
  companyName = 'Housekeeper Services',
  printedAt = new Date(),
  className,
  isSingleSchedule = false,
}: PrintScheduleProps) {
  // Defensive check for schedules - ensure it's always an array to prevent reduce errors
  let safeSchedules: Schedule[] = []
  if (Array.isArray(schedules)) {
    safeSchedules = schedules
  } else if (
    schedules &&
    typeof schedules === 'object' &&
    'schedules' in schedules &&
    Array.isArray((schedules as any).schedules)
  ) {
    safeSchedules = (schedules as any).schedules
  } else {
    safeSchedules = []
  }

  // Filter for individual housekeeper if specified
  const filteredSchedules = safeSchedules.filter((s) => {
    if (!housekeeper) return true
    if (s.scheduleType === 'weekly') {
      return s.weeklyEntries?.some((e) => e.assignee === housekeeper)
    } else {
      return s.entries?.some((e) => e.assignee === housekeeper)
    }
  })

  // Flatten and filter entries for the housekeeper
  const allEntries: Array<Entry | WeeklyScheduleEntry> = []
  filteredSchedules.forEach((s) => {
    if (s.scheduleType === 'weekly') {
      allEntries.push(
        ...(s.weeklyEntries?.filter((e) => !housekeeper || e.assignee === housekeeper) || [])
      )
    } else {
      allEntries.push(
        ...(s.entries?.filter((e) => !housekeeper || e.assignee === housekeeper) || [])
      )
    }
  })

  // Sort entries: weekly by day then time, date-specific by time
  const filteredEntries = allEntries.sort((a, b) => {
    // For weekly schedules, sort by day then time
    if ('dayOfWeek' in a && 'dayOfWeek' in b) {
      const dayOrder = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ]
      const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek)
      if (dayDiff !== 0) return dayDiff
      return a.time.localeCompare(b.time)
    }
    // For date-specific schedules, sort by time
    return a.time.localeCompare(b.time)
  })

  const rootClassName = `max-w-4xl mx-auto p-8 print:p-0 print:bg-white print:pt-4 ${className || ''}`

  const isSingle = filteredSchedules.length === 1 || isSingleSchedule

  // Calculate total duration from entries
  const totalDuration = filteredEntries.reduce(
    (total, entry) => total + entry.duration * 60 * 1000,
    0
  )

  const totalHours = Math.floor(totalDuration / (1000 * 60 * 60))
  const totalMinutes = Math.floor((totalDuration % (1000 * 60 * 60)) / (1000 * 60))

  if (filteredEntries.length === 0) {
    return (
      <div className={`max-w-4xl mx-auto p-8 print:p-0 print:bg-white ${className || ''}`}>
        <div className="text-center py-12">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4 print:hidden" />
          <h1 className="text-2xl font-bold text-gray-500 mb-2">
            No Schedule for {housekeeper || 'Selected'}
          </h1>
          <p className="text-gray-400">There are currently no assignments available to print.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={rootClassName}>
      {/* Header - Simplified for single schedule */}
      <div className="text-center mb-6 print:mb-4 print:pb-2">
        <h1 className="text-2xl font-bold text-foreground mb-1 print:text-2xl print:mb-2">
          {companyName}
        </h1>
        <p className="text-base text-muted-foreground mb-3 print:text-base print:mb-1">
          {isSingle
            ? 'Schedule Details'
            : `${housekeeper ? `${housekeeper}'s ` : ''}Housekeeper Schedule`}
        </p>
        {!isSingle && (
          <div className="border-t pt-3 print:border-t print:pt-3 print:border-black">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm print:text-xs print:gap-2">
              <div>
                <div className="font-medium">Printed on:</div>
                <div className="print:text-xs">
                  {printedAt.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
              <div>
                <div className="font-medium">Time:</div>
                <div className="print:text-xs">
                  {printedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="font-medium">Total Assignments:</div>
                <div className="text-base font-semibold print:text-sm">
                  {filteredEntries.length}
                </div>
              </div>
              {totalHours > 0 && (
                <div className="md:col-span-2">
                  <div className="font-medium">Total Duration:</div>
                  <div className="text-base font-semibold print:text-sm">
                    {totalHours}h {totalMinutes}m
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {isSingle && filteredSchedules.length > 0 && (
          <div className="border-t pt-3 print:border-t print:pt-3 print:border-black print:mb-4">
            <div className="text-center">
              <div className="font-medium text-sm print:text-xs mb-1">Schedule Type:</div>
              <div className="text-sm font-semibold print:text-xs capitalize">
                {filteredSchedules[0].scheduleType === 'weekly'
                  ? 'Weekly Schedule'
                  : 'Date-Specific Schedule'}
              </div>
              {filteredSchedules[0].scheduleType === 'weekly' && (
                <div className="text-xs text-muted-foreground print:text-xs mt-1">
                  Repeats every week
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Schedule Table */}
      <div className="space-y-6 print:space-y-0">
        <Card className="print:border print:shadow-none print:bg-transparent print:mb-0">
          <CardHeader
            className={`pb-3 print:pb-2 print:pt-0 print:border-b print:border-black ${isSingle ? 'print:pb-1' : ''}`}
          >
            <div className="flex items-center gap-1.5 print:mb-1 print:gap-1">
              <Calendar className="h-4 w-4 print:h-3 print:w-3" />
              <CardTitle className={`text-lg print:text-sm ${isSingle ? 'print:text-base' : ''}`}>
                {isSingle
                  ? filteredSchedules[0]?.title || 'Schedule Details'
                  : 'Individual Schedule'}
              </CardTitle>
            </div>
            <p
              className={`text-xs text-muted-foreground print:text-xs ${isSingle ? 'print:hidden' : ''}`}
            >
              Assignments for {housekeeper || 'team'}
              {!isSingle &&
                ` - ${printedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            </p>
          </CardHeader>
          <CardContent className="pt-0 print:p-0">
            <div className="overflow-x-auto print:overflow-visible print:table-auto">
              <table className="w-full border-collapse print:border print:border-black">
                <thead>
                  <tr className="border-b print:border-t print:border-b print:border-black bg-muted/50 print:bg-gray-100 print:sticky top-0 print:z-10">
                    {filteredEntries.some((e) => 'dayOfWeek' in e) &&
                    filteredEntries.some((e) => !('dayOfWeek' in e)) ? (
                      // Mixed schedule types - show more generic column
                      <th className="border border-gray-300 print:border-black p-2 text-left font-semibold print:text-xs print:p-1.5 print:w-1/6">
                        When
                      </th>
                    ) : filteredEntries.some((e) => 'dayOfWeek' in e) ? (
                      // All weekly schedules
                      <th className="border border-gray-300 print:border-black p-2 text-left font-semibold print:text-xs print:p-1.5 print:w-1/6">
                        Day
                      </th>
                    ) : (
                      // All date-specific schedules
                      <th className="border border-gray-300 print:border-black p-2 text-left font-semibold print:text-xs print:p-1.5 print:w-1/6">
                        Date
                      </th>
                    )}
                    <th className="border border-gray-300 print:border-black p-2 text-center font-semibold print:text-xs print:p-1.5 print:w-1/6">
                      Time
                    </th>
                    <th className="border border-gray-300 print:border-black p-2 text-center font-semibold print:text-xs print:p-1.5 print:w-1/8">
                      Duration
                    </th>
                    <th className="border border-gray-300 print:border-black p-2 text-center font-semibold print:text-xs print:p-1.5 print:w-1/8">
                      Status
                    </th>
                    <th className="border border-gray-300 print:border-black p-2 text-left font-semibold print:text-xs print:p-1.5 print:w-2/5">
                      Task
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className={`border-b print:border-b print:border-black ${index % 2 === 0 ? 'bg-background' : 'bg-muted/50 print:bg-gray-50'}`}
                    >
                      {/* Day/Date */}
                      <td className="border border-gray-300 print:border-black p-2 print:p-1.5 print:text-xs">
                        <div className="font-medium capitalize">
                          {'dayOfWeek' in entry
                            ? entry.dayOfWeek.charAt(0).toUpperCase() + entry.dayOfWeek.slice(1)
                            : filteredEntries.some((e) => 'dayOfWeek' in e) &&
                                filteredEntries.some((e) => !('dayOfWeek' in e))
                              ? 'Date-Specific'
                              : 'TBD'}
                        </div>
                      </td>

                      {/* Time */}
                      <td className="border border-gray-300 print:border-black p-2 text-center print:p-1.5 print:text-xs">
                        <div className="font-medium">{entry.time}</div>
                      </td>

                      {/* Duration */}
                      <td className="border border-gray-300 print:border-black p-2 text-center print:p-1.5 print:text-xs">
                        <span className="text-xs">{Math.round((entry.duration || 0) / 60)}m</span>
                      </td>

                      {/* Status */}
                      <td className="border border-gray-300 print:border-black p-2 text-center print:p-1.5 print:text-xs">
                        <div
                          className={`inline-block px-2 py-1 text-xs rounded ${
                            entry.status === 'completed'
                              ? 'bg-green-100 text-green-800 print:bg-gray-200 print:text-black'
                              : 'bg-yellow-100 text-yellow-800 print:bg-white print:text-black'
                          }`}
                        >
                          {entry.status === 'completed' ? '✓' : '○'}
                        </div>
                      </td>

                      {/* Task */}
                      <td className="border border-gray-300 print:border-black p-2 print:p-1.5 print:text-sm">
                        <span className="break-words font-semibold text-base print:text-sm print:font-semibold">
                          {entry.task}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Footer - Show appropriate info based on schedule type */}
        <div className="mt-6 pt-4 border-t print:mt-4 print:pt-2 print:border-t print:border-black">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:flex-row print:items-center print:justify-between print:gap-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground print:text-sm print:gap-2">
              <div className="flex items-center gap-1 print:gap-0.5">
                <Clock className="h-3 w-3 print:h-2.5 print:w-2.5" />
                <span className="text-xs print:text-xs">
                  {isSingle ? 'Schedule entries:' : 'Total schedules:'}{' '}
                  <span className="font-medium">
                    {isSingle ? filteredEntries.length : safeSchedules.length}
                  </span>
                </span>
              </div>
              {totalHours > 0 && (
                <div className="flex items-center gap-1 print:gap-0.5">
                  <Clock className="h-3 w-3 print:h-2.5 print:w-2.5" />
                  <span className="text-xs print:text-xs">
                    Total duration:{' '}
                    <span className="font-medium">
                      {totalHours}h {totalMinutes}m
                    </span>
                  </span>
                </div>
              )}
            </div>
            <div className="text-right print:text-left print:text-xs">
              <p className="font-medium text-xs print:font-medium">
                Prepared by: Housekeeper Schedule Manager
              </p>
              <p className="text-xs text-muted-foreground print:text-xs">
                Printed:{' '}
                {printedAt.toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          @media print {
            @page {
              margin: 0.2in 0.15in;
              size: A4 portrait;
            }

            /* Hide all elements that shouldn't be printed */
            body * {
              visibility: hidden;
            }

            /* Show only the print content and its children */
            .print-content, .print-content * {
              visibility: visible;
            }

            /* Position the print content to fill the page */
            .print-content {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: auto;
            }

            /* Hide no-print elements specifically */
            .no-print {
              display: none !important;
              visibility: hidden !important;
            }

            body {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              font-family: Arial, sans-serif;
              font-size: 8pt;
              line-height: 1.1;
              width: 210mm;
              max-width: 210mm;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              color: black !important;
              overflow: visible !important;
            }

            .print\\:border-black {
              border-color: black !important;
            }

            .print\\:bg-gray-100 {
              background-color: #f3f4f6 !important;
              -webkit-print-color-adjust: exact !important;
            }

            table {
              font-size: 7pt;
              width: 100%;
              page-break-inside: auto;
              border-collapse: collapse;
              table-layout: fixed;
            }

            thead {
              display: table-header-group;
            }

            th, td {
              page-break-inside: avoid;
              border: 1px solid black !important;
              padding: 0.3em 0.2em;
              vertical-align: top;
              word-wrap: break-word;
              color: black !important;
            }

            th {
              background-color: #f3f4f6 !important;
              -webkit-print-color-adjust: exact !important;
              font-weight: bold;
              text-align: left;
              position: sticky;
              top: 0;
              z-index: 10;
            }

            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }

            tbody tr {
              page-break-inside: avoid;
            }

            h1, h2 {
              page-break-after: avoid;
              page-break-inside: avoid;
              margin-bottom: 0.5em;
              color: black !important;
            }

            /* For 130+ units: even smaller font */
            tbody tr:nth-child(n+51) {
              font-size: 7pt;
            }

            /* Force proper print layout */
            html, body {
              overflow: visible !important;
              height: auto !important;
            }
          }
        `}
      </style>
    </div>
  )
}
