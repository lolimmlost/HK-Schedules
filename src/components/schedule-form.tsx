// Dynamic Schedule Form with react-hook-form, Zod validation, and entry arrays
import * as React from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Alert, AlertDescription } from "./ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { User, Calendar, List, Plus, Trash2, PlusCircle } from "lucide-react"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"

export interface Entry {
  id: string
  time: string
  duration: number // minutes
  task: string
  assignee: string
  status: 'pending' | 'completed'
  notes?: string
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly'
}

export const entrySchema = z.object({
  id: z.string().uuid().or(z.string().min(1, "ID required")),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  duration: z.number().min(1, "Duration must be at least 1 minute").max(480, "Duration max 8 hours"),
  task: z.string().min(1, "Task required").max(200, "Task max 200 chars"),
  assignee: z.string().min(1, "Assignee required"),
  status: z.enum(['pending', 'completed']).default('pending'),
  notes: z.string().max(300, "Notes max 300 chars").optional(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']).default('none'),
})

export const scheduleSchema = z.object({
  id: z.string().uuid().or(z.string().min(1, "Entry ID required")),
  title: z.string().min(1, "Title required").max(100, "Title max 100 chars"),
  description: z.string().max(500, "Description max 500 chars").optional(),
  category: z.enum(['general', 'housekeeping', 'maintenance', 'other']).default('general'),
  date: z.string().optional(),
  entries: z.array(entrySchema).min(1, "At least one entry required"),
  version: z.string().default('2.0'),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']).default('none'),
  // Legacy properties (optional for backward compatibility)
  name: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  tasks: z.string().optional(),
}).refine((data) => {
  // No time overlaps
  const times = data.entries.map(e => e.time)
  const uniqueTimes = new Set(times)
  return times.length === uniqueTimes.size
}, {
  message: "Entry times must be unique (no overlaps)",
  path: ['entries']
})

export type Schedule = z.infer<typeof scheduleSchema>

interface ScheduleFormProps {
  initialData?: Partial<Schedule>
  onSubmit: (data: Schedule) => void
  onCancel?: () => void
}

export function ScheduleForm({ initialData, onSubmit, onCancel }: ScheduleFormProps) {
  const isEditing = !!initialData?.id

  const form = useForm<Schedule>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      id: initialData?.id || uuidv4(),
      title: initialData?.title || "",
      description: initialData?.description || "",
      category: (initialData?.category as any) || 'general',
      date: initialData?.date || "",
      /**
       * Default entries: Provide a single valid entry to ensure form is valid on load
       * Includes required duration field to pass Zod min(1) validation
       */
      entries: initialData?.entries?.length ? initialData.entries : [{ id: uuidv4(), time: '09:00', duration: 60, task: 'General Task', assignee: 'Unassigned', status: 'pending', recurrence: 'none' }],
      version: '2.0',
      recurrence: (initialData?.recurrence as any) || 'none',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "entries",
  })

  /**
   * Handles form submission by processing data and calling the parent onSubmit handler
   * Converts any string durations to numbers and resets form after submission
   */
  const onSubmitForm = (data: Schedule) => {
    // Convert duration string to number if needed
    const processedData = {
      ...data,
      entries: data.entries.map(entry => ({
        ...entry,
        duration: typeof entry.duration === 'string' ? parseInt(entry.duration) : entry.duration,
      })),
    }
    onSubmit(processedData)
    form.reset()
  }

  const addEntry = () => {
    append({ id: uuidv4(), time: '09:00', duration: 60, task: 'General Task', assignee: 'Unassigned', status: 'pending', recurrence: 'none' })
  }

  const watchEntries = form.watch('entries')
  const hasEntries = watchEntries.length > 0

  React.useEffect(() => {
    if (isEditing && initialData) {
      try {
        form.reset({
          ...initialData,
          entries: initialData.entries || [],
          title: initialData.title || '',
          category: initialData.category || 'general',
          recurrence: initialData.recurrence || 'none'
        })
      } catch (error) {
        console.error('Form reset error:', error)
        // Fallback to empty form
        form.reset({
          id: uuidv4(),
          title: '',
          description: '',
          category: 'general',
          date: '',
          entries: [{ id: uuidv4(), time: '09:00', duration: 60, task: 'General Task', assignee: 'Unassigned', status: 'pending', recurrence: 'none' }],
          version: '2.0',
          recurrence: 'none'
        })
      }
    }
  }, [initialData, isEditing, form])

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <User className="h-5 w-5 text-primary" />
          ) : (
            <Plus className="h-5 w-5 text-primary" />
          )}
          <CardTitle className="text-xl">
            {isEditing ? "Edit Schedule" : "Add New Schedule"}
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          {isEditing 
            ? "Update the schedule details below" 
            : "Fill in the details to create a new schedule with multiple entries"
          }
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-6">
          {/* Schedule Level Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Schedule Title <span className="text-destructive">*</span></Label>
              <Input id="title" {...form.register("title")} className={form.formState.errors.title ? "border-destructive" : ""} />
              {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value: string) => form.setValue("category", value as "general" | "housekeeping" | "maintenance" | "other")} defaultValue={form.watch("category")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="housekeeping">Housekeeping</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              {...form.register("description")} 
              className={form.formState.errors.description ? "border-destructive" : ""} 
              placeholder="Optional description for the schedule"
              rows={3}
            />
            {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>}
            <p className="text-xs text-muted-foreground">{form.watch("description")?.length || 0}/500 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">
              <Calendar className="h-4 w-4 inline mr-2" />
              Date (Optional)
            </Label>
            <Input id="date" type="date" {...form.register("date")} />
          </div>

          {/* Dynamic Entries */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Schedule Entries <span className="text-destructive">*</span></Label>
              <Button type="button" variant="outline" onClick={addEntry} size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>

            {form.formState.errors.entries && (
              <Alert className="border-destructive bg-destructive/10">
                <List className="h-4 w-4" />
                <AlertDescription className="text-destructive">
                  {form.formState.errors.entries.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Entry {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => remove(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Time <span className="text-destructive">*</span></Label>
                      <Input 
                        type="time" 
                        {...form.register(`entries.${index}.time` as const)} 
                        className={form.formState.errors.entries?.[index]?.time ? "border-destructive" : ""}
                      />
                      {form.formState.errors.entries?.[index]?.time && (
                        <p className="text-sm text-destructive">{form.formState.errors.entries[index]?.time?.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Duration (minutes) <span className="text-destructive">*</span></Label>
                      <Input 
                        type="number" 
                        min="1" 
                        max="480"
                        {...form.register(`entries.${index}.duration`, { valueAsNumber: true })} 
                        className={form.formState.errors.entries?.[index]?.duration ? "border-destructive" : ""}
                      />
                      {form.formState.errors.entries?.[index]?.duration && (
                        <p className="text-sm text-destructive">{form.formState.errors.entries[index]?.duration?.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Assignee <span className="text-destructive">*</span></Label>
                      <Input 
                        {...form.register(`entries.${index}.assignee` as const)} 
                        className={form.formState.errors.entries?.[index]?.assignee ? "border-destructive" : ""}
                        placeholder="e.g., John Doe"
                      />
                      {form.formState.errors.entries?.[index]?.assignee && (
                        <p className="text-sm text-destructive">{form.formState.errors.entries[index]?.assignee?.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Task <span className="text-destructive">*</span></Label>
                      <Input 
                        {...form.register(`entries.${index}.task` as const)} 
                        className={form.formState.errors.entries?.[index]?.task ? "border-destructive" : ""}
                        placeholder="e.g., Clean Room 101"
                      />
                      {form.formState.errors.entries?.[index]?.task && (
                        <p className="text-sm text-destructive">{form.formState.errors.entries[index]?.task?.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select onValueChange={(value: string) => form.setValue(`entries.${index}.status` as const, value as "pending" | "completed")} defaultValue={form.watch(`entries.${index}.status`) || 'pending'}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Recurrence</Label>
                      <Select onValueChange={(value: string) => form.setValue(`entries.${index}.recurrence` as const, value as "none" | "daily" | "weekly" | "monthly")} defaultValue={form.watch(`entries.${index}.recurrence`) || 'none'}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select recurrence" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea 
                        {...form.register(`entries.${index}.notes` as const)} 
                        className={form.formState.errors.entries?.[index]?.notes ? "border-destructive" : ""}
                        placeholder="Optional notes for this entry"
                        rows={2}
                      />
                      {form.formState.errors.entries?.[index]?.notes && (
                        <p className="text-sm text-destructive">{form.formState.errors.entries[index]?.notes?.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {!hasEntries && (
                <Alert>
                  <Plus className="h-4 w-4" />
                  <AlertDescription>No entries yet. Click "Add Entry" to start.</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={form.formState.isSubmitting || !form.formState.isValid || !hasEntries}
            >
              {form.formState.isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  {isEditing ? (
                    <>
                      <User className="h-4 w-4 mr-2" />
                      Update Schedule
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Schedule
                    </>
                  )}
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}