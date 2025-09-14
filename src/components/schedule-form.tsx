import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface Schedule {
  id: string
  name: string
  date?: string
  start: string
  end: string
  tasks: string
}

interface ScheduleFormProps {
  initialData?: Schedule
  onSubmit: (data: Schedule) => void
  onCancel?: () => void
}

export function ScheduleForm({ initialData, onSubmit, onCancel }: ScheduleFormProps) {
  const [formData, setFormData] = React.useState({
    name: initialData?.name || "",
    date: initialData?.date || "",
    start: initialData?.start || "",
    end: initialData?.end || "",
    tasks: initialData?.tasks || "",
  })
  const [isEditing, setIsEditing] = React.useState(!!initialData)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: Schedule = {
      id: initialData?.id || Date.now().toString(),
      ...formData,
    }
    onSubmit(data)
    setFormData({
      name: "",
      date: "",
      start: "",
      end: "",
      tasks: "",
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      name: "",
      date: "",
      start: "",
      end: "",
      tasks: "",
    })
    setIsEditing(false)
    if (onCancel) onCancel()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Schedule" : "Add New Schedule"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Housekeeper Name</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div className="grid w-full max-w-sm items-end gap-2">
            <Label htmlFor="start">Start Time</Label>
            <Input
              id="start"
              type="time"
              required
              value={formData.start}
              onChange={(e) => setFormData({ ...formData, start: e.target.value })}
            />
          </div>
          <div className="grid w-full max-w-sm items-end gap-2">
            <Label htmlFor="end">End Time</Label>
            <Input
              id="end"
              type="time"
              required
              value={formData.end}
              onChange={(e) => setFormData({ ...formData, end: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tasks">Tasks</Label>
            <Textarea
              id="tasks"
              value={formData.tasks}
              onChange={(e) => setFormData({ ...formData, tasks: e.target.value })}
              placeholder="Enter tasks for this schedule..."
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">
              {isEditing ? "Update Schedule" : "Add Schedule"}
            </Button>
            {isEditing && (
              <Button type="button" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}