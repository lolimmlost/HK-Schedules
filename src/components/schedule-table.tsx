import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  Td,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { Schedule } from "./schedule-form"

interface ScheduleTableProps {
  schedules: Schedule[]
  onEdit: (schedule: Schedule) => void
  onDelete: (id: string) => void
}

export function ScheduleTable({ schedules, onEdit, onDelete }: ScheduleTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Schedules</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.length === 0 ? (
                <TableRow>
                  <td colSpan={6} className="h-24 text-center">
                    No schedules found.
                  </td>
                </TableRow>
              ) : (
                schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <Td className="font-medium">{schedule.name}</Td>
                    <Td>{schedule.date || "N/A"}</Td>
                    <Td>{schedule.start}</Td>
                    <Td>{schedule.end}</Td>
                    <Td>{schedule.tasks}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => onEdit(schedule)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(schedule.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </Td>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}