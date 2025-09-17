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
  isSingleSchedule?: boolean // New prop to indicate single schedule preview
}

export function PrintSchedule({ schedules, housekeeper, companyName = "Housekeeper Services", printedAt = new Date(), className, isSingleSchedule = false }: PrintScheduleProps) {
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

  const isSingle = filteredSchedules.length === 1 || isSingleSchedule

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
      {/* Header - Simplified for single schedule */}
      <div className="text-center mb-6 print:mb-4 print:pb-2">
        <h1 className="text-2xl font-bold text-foreground mb-1 print:text-2xl print:mb-2">
          {companyName}
        </h1>
        <p className="text-base text-muted-foreground mb-3 print:text-base print:mb-1">
          {housekeeper ? `${housekeeper}'s ` : ''}{isSingle ? 'Schedule Preview' : 'Housekeeper Schedule'}
        </p>
        {!isSingle && (
          <div className="border-t pt-3 print:border-t print:pt-3 print:border-black">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm print:text-xs print:gap-2">
              <div>
                <div className="font-medium">Printed on:</div>
                <div className="print:text-xs">{printedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              </div>
              <div>
                <div className="font-medium">Time:</div>
                <div className="print:text-xs">{printedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div className="md:col-span-2">
                <div className="font-medium">Total Assignments:</div>
                <div className="text-base font-semibold print:text-sm">{filteredEntries.length}</div>
              </div>
              {totalHours > 0 && (
                <div className="md:col-span-2">
                  <div className="font-medium">Total Duration:</div>
                  <div className="text-base font-semibold print:text-sm">{totalHours}h {totalMinutes}m</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Schedule Table */}
      <div className="space-y-6 print:space-y-0">
        <Card className="print:border print:shadow-none print:bg-transparent print:mb-0">
          <CardHeader className={`pb-3 print:pb-2 print:pt-0 print:border-b print:border-black ${isSingle ? 'print:pb-1' : ''}`}>
            <div className="flex items-center gap-1.5 print:mb-1 print:gap-1">
              <Calendar className="h-4 w-4 print:h-3 print:w-3" />
              <CardTitle className={`text-lg print:text-sm ${isSingle ? 'print:text-base' : ''}`}>
                {isSingle ? 'Schedule Details' : 'Individual Schedule'}
              </CardTitle>
            </div>
            <p className={`text-xs text-muted-foreground print:text-xs ${isSingle ? 'print:hidden' : ''}`}>
              Assignments for {housekeeper || 'team'}{!isSingle && ` - ${printedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            </p>
          </CardHeader>
          <CardContent className="pt-0 print:p-0">
            <div className="overflow-x-auto print:overflow-visible print:table-auto">
              <table className="w-full border-collapse print:border print:border-black">
                <thead>
                  <tr className="border-b print:border-t print:border-b print:border-black bg-muted/50 print:bg-gray-100 print:sticky top-0 print:z-10">
                    <th className={`border border-gray-300 print:border-black p-2.5 text-left font-semibold print:text-xs print:p-1.5 ${isSingle ? 'print:w-1/5' : ''}`}>
                      Task
                    </th>
                    <th className={`border border-gray-300 print:border-black p-2.5 text-center font-semibold print:text-xs print:p-1.5 ${isSingle ? 'print:w-1/5' : ''}`}>
                      Time
                    </th>
                    <th className={`border border-gray-300 print:border-black p-2.5 text-center font-semibold print:text-xs print:p-1.5 ${isSingle ? 'print:w-1/5' : ''}`}>
                      Duration
                    </th>
                    {!isSingle && (
                      <th className="border border-gray-300 print:border-black p-2.5 text-center font-semibold print:text-xs print:p-1.5 print:w-1/5">
                        Status
                      </th>
                    )}
                    <th className={`border border-gray-300 print:border-black p-2.5 text-left font-semibold print:text-xs print:p-1.5 ${isSingle ? 'print:w-2/5' : 'print:w-1/5'}`}>
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
                      {/* Task */}
                      <td className={`border border-gray-300 print:border-black p-2.5 print:p-1.5 max-w-xs ${isSingle ? 'print:max-w-none' : ''}`}>
                        <span className="break-words text-sm print:text-xs">{entry.task}</span>
                      </td>

                      {/* Time */}
                      <td className="border border-gray-300 print:border-black p-2.5 text-center print:p-1.5 print:text-xs">
                        <div className="font-medium text-sm print:text-xs">
                          {entry.time}
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="border border-gray-300 print:border-black p-2.5 text-center print:p-1.5 print:text-xs">
                        <Badge variant="secondary" className="text-xs print:text-[10px] px-1.5 py-0.5">
                          {Math.round((entry.duration || 0) / 60)} min
                        </Badge>
                      </td>

                      {/* Status - Hide for single schedule */}
                      {!isSingle && (
                        <td className="border border-gray-300 print:border-black p-2.5 text-center print:p-1.5 print:text-xs">
                          <input
                            type="checkbox"
                            checked={entry.status === 'completed'}
                            disabled
                            className="print:scale-110 print:mx-auto"
                          />
                        </td>
                      )}

                      {/* Notes */}
                      <td className={`border border-gray-300 print:border-black p-2.5 print:p-1.5 max-w-md ${isSingle ? 'print:max-w-none' : ''}`}>
                        <div className={`text-sm print:text-xs ${isSingle ? 'print:text-[11px]' : ''}`}>
                          {entry.notes ? entry.notes : (isSingle ? '' : 'N/A')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Footer - Hide for single schedule */}
        {!isSingle && safeSchedules.length > 0 && (
          <div className="mt-6 pt-4 border-t print:mt-4 print:pt-2 print:border-t print:border-black">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:flex-row print:items-center print:justify-between print:gap-1">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground print:text-sm print:gap-2">
                <div className="flex items-center gap-1 print:gap-0.5">
                  <Clock className="h-3 w-3 print:h-2.5 print:w-2.5" />
                  <span className="text-xs print:text-xs">Total schedules: <span className="font-medium">{safeSchedules.length}</span></span>
                </div>
                {totalHours > 0 && (
                  <div className="flex items-center gap-1 print:gap-0.5">
                    <Clock className="h-3 w-3 print:h-2.5 print:w-2.5" />
                    <span className="text-xs print:text-xs">Total duration: <span className="font-medium">{totalHours}h {totalMinutes}m</span></span>
                  </div>
                )}
              </div>
              <div className="text-right print:text-left print:text-xs">
                <p className="font-medium text-xs print:font-medium">
                  Prepared by: Housekeeper Schedule Manager
                </p>
                <p className="text-xs text-muted-foreground print:text-xs">
                  Printed: {printedAt.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
              margin: 0.25in;
              size: A4 portrait;
            }
            
            body {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              font-family: Arial, sans-serif;
              font-size: 9pt;
              line-height: 1.2;
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
              font-size: 8pt;
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
              padding: 0.3em 0.2em;
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

            /* For 130+ units: even smaller font */
            tbody tr:nth-child(n+51) {
              font-size: 7pt;
            }
          }
        `}
      </style>
    </div>
  )
}