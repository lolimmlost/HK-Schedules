import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Calendar, Clock } from "lucide-react"
import type { Schedule } from "./schedule-form"

interface PrintScheduleProps {
  schedules: Schedule[]
  companyName?: string
  printedAt?: Date
}

export function PrintSchedule({ schedules, companyName = "Housekeeper Services", printedAt = new Date() }: PrintScheduleProps) {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "No date assigned"
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDuration = (start: string, end: string) => {
    const startTime = new Date(`2000-01-01T${start}:00`)
    const endTime = new Date(`2000-01-01T${end}:00`)
    const diff = endTime.getTime() - startTime.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const totalDuration = schedules.reduce((total, schedule) => {
    const startTime = new Date(`2000-01-01T${schedule.start}:00`)
    const endTime = new Date(`2000-01-01T${schedule.end}:00`)
    const diff = endTime.getTime() - startTime.getTime()
    return total + diff
  }, 0)

  const totalHours = Math.floor(totalDuration / (1000 * 60 * 60))
  const totalMinutes = Math.floor((totalDuration % (1000 * 60 * 60)) / (1000 * 60))

  if (schedules.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-8 print:p-0 print:bg-white">
        <div className="text-center py-12">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4 print:hidden" />
          <h1 className="text-2xl font-bold text-gray-500 mb-2">No Schedules to Print</h1>
          <p className="text-gray-400">There are currently no schedules available to print.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8 print:p-0 print:bg-white print:pt-4">
      {/* Header */}
      <div className="text-center mb-8 print:mb-6 print:pb-4">
        <h1 className="text-3xl font-bold text-foreground mb-2 print:text-4xl print:mb-4">
          {companyName}
        </h1>
        <p className="text-lg text-muted-foreground mb-4 print:text-xl print:mb-2">
          Housekeeper Schedule
        </p>
        <div className="border-t pt-4 print:border-t print:pt-4 print:border-black">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm print:text-base">
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
              <div className="font-medium">Total Schedules:</div>
              <div className="text-lg font-semibold">{schedules.length}</div>
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
              <CardTitle className="text-xl print:text-2xl">Housekeeper Schedule</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground print:text-base print:font-normal">
              Detailed schedule for housekeeper assignments - {printedAt.toLocaleDateString('en-US', {
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
                  <tr className="border-b print:border-t print:border-b print:border-black bg-muted/50 print:bg-gray-100">
                    <th className="border border-gray-300 print:border-black p-4 text-left font-semibold print:text-sm print:p-3">
                      Housekeeper
                    </th>
                    <th className="border border-gray-300 print:border-black p-4 text-left font-semibold print:text-sm print:p-3">
                      Date
                    </th>
                    <th className="border border-gray-300 print:border-black p-4 text-center font-semibold print:text-sm print:p-3">
                      Time Slot
                    </th>
                    <th className="border border-gray-300 print:border-black p-4 text-center font-semibold print:text-sm print:p-3">
                      Duration
                    </th>
                    <th className="border border-gray-300 print:border-black p-4 text-left font-semibold print:text-sm print:p-3">
                      Tasks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule, index) => (
                    <tr 
                      key={schedule.id} 
                      className={`border-b print:border-b print:border-black ${index % 2 === 0 ? 'bg-background' : 'bg-muted/50 print:bg-gray-50'}`}
                    >
                      {/* Housekeeper */}
                      <td className="border border-gray-300 print:border-black p-4 print:p-3">
                        <div className="flex items-center gap-3 print:gap-2">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center print:w-8 print:h-8 print:bg-primary/20">
                            <User className="h-5 w-5 text-primary print:h-4 print:w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate print:font-semibold">{schedule.name}</div>
                            <div className="text-xs text-muted-foreground print:hidden">
                              Housekeeper
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="border border-gray-300 print:border-black p-4 print:p-3">
                        <div className="flex items-center gap-2 print:gap-1 print:flex-col print:items-start">
                          <Calendar className="h-4 w-4 text-muted-foreground print:h-3 print:w-3" />
                          <div className="print:text-sm print:font-medium">
                            {formatDate(schedule.date)}
                          </div>
                        </div>
                      </td>

                      {/* Time Slot */}
                      <td className="border border-gray-300 print:border-black p-4 text-center print:p-3">
                        <div className="flex flex-col items-center gap-1 print:gap-0">
                          <div className="font-medium text-sm print:text-sm print:font-semibold">
                            {schedule.start} - {schedule.end}
                          </div>
                          <div className="text-xs text-muted-foreground print:hidden">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {getDuration(schedule.start, schedule.end)}
                          </div>
                          <div className="print:hidden">
                            <Badge variant="outline" className="text-xs mt-1">
                              {getDuration(schedule.start, schedule.end)}
                            </Badge>
                          </div>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="border border-gray-300 print:border-black p-4 text-center print:p-3 print:hidden">
                        <Badge variant="secondary" className="text-xs">
                          {getDuration(schedule.start, schedule.end)}
                        </Badge>
                      </td>

                      {/* Tasks */}
                      <td className="border border-gray-300 print:border-black p-4 print:p-3 max-w-md">
                        <div className="space-y-2 print:space-y-1">
                          {schedule.tasks ? (
                            schedule.tasks.split(',').map((task, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm print:text-sm print:gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0 print:w-2 print:h-2 print:mt-2 print:bg-black"></div>
                                <span className="break-words">{task.trim()}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground italic print:text-gray-600">
                              No tasks specified
                            </div>
                          )}
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
        {schedules.length > 0 && (
          <div className="mt-8 pt-6 border-t print:mt-6 print:pt-4 print:border-t print:border-black">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:flex-row print:items-center print:justify-between print:gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground print:text-base print:gap-4">
                <div className="flex items-center gap-2 print:gap-1">
                  <Clock className="h-4 w-4 print:h-3 print:w-3" />
                  <span>Total schedules: <span className="font-medium">{schedules.length}</span></span>
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
              margin: 0.75in;
              size: letter;
            }
            
            body {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 11pt;
              line-height: 1.4;
            }
            
            .print\\:border-black {
              border-color: black !important;
            }
            
            .print\\:bg-gray-100 {
              background-color: #f3f4f6 !important;
              -webkit-print-color-adjust: exact !important;
            }
            
            .print\\:text-sm {
              font-size: 10pt !important;
            }
            
            table {
              font-size: 10pt;
              page-break-inside: avoid;
              width: 100%;
            }
            
            th, td {
              page-break-inside: avoid;
              border: 1px solid black !important;
              padding: 0.5em;
              vertical-align: top;
            }
            
            th {
              background-color: #f3f4f6 !important;
              -webkit-print-color-adjust: exact !important;
              font-weight: 600;
              text-align: left;
            }
            
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            
            h1, h2 {
              page-break-after: avoid;
              page-break-inside: avoid;
              margin-bottom: 0.5em;
            }
            
            .print-hidden {
              display: none !important;
            }
            
            .print-only {
              display: block !important;
            }
          }
        `}
      </style>
    </div>
  )
}