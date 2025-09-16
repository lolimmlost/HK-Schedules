import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Calendar, Clock } from "lucide-react"

import { formatDate, getDuration } from "@/lib/utils"
import type { Schedule, Entry } from "./schedule-form"

interface PrintScheduleProps {
  schedules: Schedule[]
  housekeeper?: string
  companyName?: string
  printedAt?: Date
  className?: string
}

export function PrintSchedule({ schedules, housekeeper, companyName = "Housekeeper Services", printedAt = new Date(), className }: PrintScheduleProps) {
  // Defensive check for schedules - ensure it's always an array to prevent reduce errors
  let safeSchedules: Schedule[] = []
  if (Array.isArray(schedules)) {
    safeSchedules = schedules
  } else if (schedules && typeof schedules === 'object' && 'schedules' in schedules && Array.isArray((schedules as any).schedules)) {
    safeSchedules = (schedules as any).schedules
  } else {
    safeSchedules = []
  }

  // Filter for individual housekeeper if specified
  const filteredSchedules = safeSchedules.filter(s =>
    !housekeeper || s.entries?.some(e => e.assignee === housekeeper)
  )

  // Flatten and filter entries for the housekeeper
  const filteredEntries: Entry[] = filteredSchedules
    .filter(s => s.category === 'housekeeping') // Focus on housekeeping
    .flatMap(s => s.entries || [])
    .filter(e => !housekeeper || e.assignee === housekeeper)
    .sort((a, b) => a.time.localeCompare(b.time))

  const rootClassName = `max-w-4xl mx-auto p-8 print:p-0 print:bg-white print:pt-4 ${className || ''}`

  // Calculate total duration from entries
  const totalDuration = filteredEntries.reduce((total, entry) => total + (entry.duration * 60 * 1000), 0)

  const totalHours = Math.floor(totalDuration / (1000 * 60 * 60))
  const totalMinutes = Math.floor((totalDuration % (1000 * 60 * 60)) / (1000 * 60))

  if (filteredEntries.length === 0) {
    return (
      <div className={`max-w-4xl mx-auto p-8 print:p-0 print:bg-white ${className || ''}`}>
        <div className="text-center py-12">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4 print:hidden" />
          <h1 className="text-2xl font-bold text-gray-500 mb-2">No Schedule for {housekeeper || 'Selected'}</h1>
          <p className="text-gray-400">There are currently no assignments available to print.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={rootClassName}>
      {/* Header */}
      <div className="text-center mb-8 print:mb-6 print:pb-4">
        <h1 className="text-3xl font-bold text-foreground mb-2 print:text-3xl print:mb-4">
          {companyName}
        </h1>
        <p className="text-lg text-muted-foreground mb-4 print:text-lg print:mb-2">
          {housekeeper ? `${housekeeper}'s ` : ''}Housekeeper Schedule
        </p>
        <div className="border-t pt-4 print:border-t print:pt-4 print:border-black">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm print:text-sm">
            <div>
              <div className="font-medium">Printed on:</div>
              <div>{printedAt.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</div>
            </div>
            <div>
              <div className="font-medium">Time:</div>
              <div>{printedAt.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}</div>
            </div>
            <div className="md:col-span-2">
              <div className="font-medium">Total Assignments:</div>
              <div className="text-lg font-semibold">{filteredEntries.length}</div>
            </div>
            {totalHours > 0 && (
              <div className="md:col-span-2">
                <div className="font-medium">Total Duration:</div>
                <div className="text-lg font-semibold">{totalHours}h {totalMinutes}m</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="space-y-6 print:space-y-0">
        <Card className="print:border print:shadow-none print:bg-transparent print:mb-0">
          <CardHeader className="pb-4 print:border-b print:pb-4 print:pt-0 print:border-black">
            <div className="flex items-center gap-2 print:mb-2">
              <Calendar className="h-5 w-5" />
              <CardTitle className="text-xl print:text-xl">Individual Schedule</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground print:text-sm print:font-normal">
              Assignments for {housekeeper || 'team'} - {printedAt.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </CardHeader>
          <CardContent className="pt-0 print:p-0">
            <div className="overflow-x-auto print:overflow-visible print:table-auto">
              <table className="w-full border-collapse print:border print:border-black">
                <thead>
                  <tr className="border-b print:border-t print:border-b print:border-black bg-muted/50 print:bg-gray-100 print:sticky top-0 print:z-10">
                    <th className="border border-gray-300 print:border-black p-3 text-left font-semibold print:text-xs print:p-2">
                      Unit/Task
                    </th>
                    <th className="border border-gray-300 print:border-black p-3 text-center font-semibold print:text-xs print:p-2">
                      Time Slot
                    </th>
                    <th className="border border-gray-300 print:border-black p-3 text-center font-semibold print:text-xs print:p-2">
                      Duration
                    </th>
                    <th className="border border-gray-300 print:border-black p-3 text-center font-semibold print:text-xs print:p-2">
                      Status
                    </th>
                    <th className="border border-gray-300 print:border-black p-3 text-left font-semibold print:text-xs print:p-2">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className={`border-b print:border-b print:border-black ${index % 2 === 0 ? 'bg-background' : 'bg-muted/50 print:bg-gray-50'}`}
                    >
                      {/* Unit/Task */}
                      <td className="border border-gray-300 print:border-black p-3 print:p-2 max-w-xs">
                        <span className="break-words print:text-xs">{entry.task}</span>
                      </td>

                      {/* Time Slot */}
                      <td className="border border-gray-300 print:border-black p-3 text-center print:p-2 print:text-xs">
                        <div className="font-medium">
                          {entry.time}
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="border border-gray-300 print:border-black p-3 text-center print:p-2 print:text-xs">
                        <Badge variant="secondary" className="text-xs print:text-xs">
                          {entry.duration} min
                        </Badge>
                      </td>

                      {/* Status Checkbox */}
                      <td className="border border-gray-300 print:border-black p-3 text-center print:p-2">
                        <input
                          type="checkbox"
                          checked={entry.status === 'completed'}
                          disabled
                          className="print:scale-125 print:mx-auto"
                        />
                      </td>

                      {/* Notes */}
                      <td className="border border-gray-300 print:border-black p-3 print:p-2 max-w-md">
                        <div className="text-sm print:text-xs">
                          {entry.notes || 'N/A'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Footer */}
        {safeSchedules.length > 0 && (
          <div className="mt-8 pt-6 border-t print:mt-6 print:pt-4 print:border-t print:border-black">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:flex-row print:items-center print:justify-between print:gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground print:text-base print:gap-4">
                <div className="flex items-center gap-2 print:gap-1">
                  <Clock className="h-4 w-4 print:h-3 print:w-3" />
                  <span>Total schedules: <span className="font-medium">{safeSchedules.length}</span></span>
                </div>
                {totalHours > 0 && (
                  <div className="flex items-center gap-2 print:gap-1">
                    <Clock className="h-4 w-4 print:h-3 print:w-3" />
                    <span>Total duration: <span className="font-medium">{totalHours}h {totalMinutes}m</span></span>
                  </div>
                )}
              </div>
              <div className="text-right print:text-left print:text-sm">
                <p className="font-medium print:font-semibold">
                  Prepared by: Housekeeper Schedule Manager
                </p>
                <p className="text-xs text-muted-foreground print:text-sm">
                  Printed: {printedAt.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>
        {`
          @media print {
            @page {
              margin: 0.5in;
              size: A4 portrait;
              margin-top: 0.75in;
              margin-bottom: 0.75in;
            }
            
            body {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              font-family: Arial, sans-serif;
              font-size: 10pt;
              line-height: 1.3;
              width: 210mm;
              max-width: 210mm;
            }
            
            .print\\:border-black {
              border-color: black !important;
            }
            
            .print\\:bg-gray-100 {
              background-color: #f3f4f6 !important;
              -webkit-print-color-adjust: exact !important;
            }
            
            table {
              font-size: 9pt;
              width: 100%;
              page-break-inside: auto;
              border-collapse: collapse;
            }
            
            thead {
              display: table-header-group;
            }
            
            th, td {
              page-break-inside: avoid;
              border: 1px solid black !important;
              padding: 0.4em 0.3em;
              vertical-align: top;
              word-wrap: break-word;
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
            }
            
            .no-print {
              display: none !important;
            }
            
            .print-hidden {
              display: none !important;
            }
            
            .print-only {
              display: block !important;
            }

            /* For 130+ units: smaller font if needed */
            tbody tr:nth-child(n+31) {
              font-size: 8pt;
            }
          }
        `}
      </style>
    </div>
  )
}