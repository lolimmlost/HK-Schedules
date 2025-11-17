// Weekly Schedule Form with day-of-week selection
import * as React from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { User, Calendar, List, Plus, Trash2, PlusCircle, Clock } from 'lucide-react'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { v4 as uuidv4 } from 'uuid'
import { DayOfWeek, scheduleSchema, type Schedule } from './schedule-form'

const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
]

interface WeeklyScheduleFormProps {
  initialData?: Partial<Schedule>
  onSubmit: (data: Schedule) => void
  onCancel?: () => void
}

export function WeeklyScheduleForm({ initialData, onSubmit, onCancel }: WeeklyScheduleFormProps) {
  const isEditing = !!initialData?.id

  const form = useForm<Schedule>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      id: initialData?.id || uuidv4(),
      title: initialData?.title || '',
      description: initialData?.description || '',
      category: (initialData?.category as any) || 'general',
      scheduleType: 'weekly' as const,
      weeklyEntries: initialData?.weeklyEntries?.length
        ? initialData.weeklyEntries
        : [
            {
              id: uuidv4(),
              dayOfWeek: 'monday' as DayOfWeek,
              time: '09:00',
              duration: 60,
              task: 'General Task',
              assignee: 'Unassigned',
              status: 'pending' as const,
              recurrence: 'none' as const,
            },
          ],
      version: '2.0',
      recurrence: (initialData?.recurrence as any) || 'none',
      entries: [], // Empty for weekly schedules
      date: '', // Not used for weekly schedules
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'weeklyEntries',
  })

  const onSubmitForm = (data: Schedule) => {
    // Process weekly entries
    const processedData = {
      ...data,
      weeklyEntries:
        data.weeklyEntries?.map((entry) => ({
          ...entry,
          duration: typeof entry.duration === 'string' ? parseInt(entry.duration) : entry.duration,
        })) || [],
      entries: [], // Clear date-specific entries for weekly schedules
    }
    onSubmit(processedData)
    form.reset()
  }

  const addWeeklyEntry = () => {
    append({
      id: uuidv4(),
      dayOfWeek: 'monday' as DayOfWeek,
      time: '09:00',
      duration: 60,
      task: 'General Task',
      assignee: 'Unassigned',
      status: 'pending' as const,
      recurrence: 'none' as const,
    })
  }

  const watchWeeklyEntries = form.watch('weeklyEntries')
  const hasWeeklyEntries = watchWeeklyEntries && watchWeeklyEntries.length > 0

  React.useEffect(() => {
    if (isEditing && initialData) {
      try {
        form.reset({
          ...initialData,
          weeklyEntries: initialData.weeklyEntries || [],
          title: initialData.title || '',
          category: initialData.category || 'general',
          recurrence: initialData.recurrence || 'none',
          scheduleType: 'weekly',
        })
      } catch (error) {
        console.error('Form reset error:', error)
        form.reset({
          id: uuidv4(),
          title: '',
          description: '',
          category: 'general',
          scheduleType: 'weekly' as const,
          weeklyEntries: [
            {
              id: uuidv4(),
              dayOfWeek: 'monday' as DayOfWeek,
              time: '09:00',
              duration: 60,
              task: 'General Task',
              assignee: 'Unassigned',
              status: 'pending' as const,
              recurrence: 'none' as const,
            },
          ],
          version: '2.0',
          recurrence: 'none',
          entries: [],
          date: '',
        })
      }
    }
  }, [initialData, isEditing, form])

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">
            {isEditing ? 'Edit Weekly Schedule' : 'Create Weekly Schedule'}
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          {isEditing
            ? 'Update the weekly schedule details below'
            : 'Create a recurring weekly schedule by selecting days of the week'}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-6">
          {/* Schedule Level Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Schedule Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                {...form.register('title')}
                className={form.formState.errors.title ? 'border-destructive' : ''}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                onValueChange={(value: string) =>
                  form.setValue(
                    'category',
                    value as 'general' | 'housekeeping' | 'maintenance' | 'other'
                  )
                }
                defaultValue={form.watch('category')}
              >
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
              {...form.register('description')}
              className={form.formState.errors.description ? 'border-destructive' : ''}
              placeholder="Optional description for the weekly schedule"
              rows={3}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {form.watch('description')?.length || 0}/500 characters
            </p>
          </div>

          {/* Weekly Entries */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">
                Weekly Schedule Entries <span className="text-destructive">*</span>
              </Label>
              <Button type="button" variant="outline" onClick={addWeeklyEntry} size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>

            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                This schedule will repeat every week on the selected days. Times are relative to
                each selected day.
              </AlertDescription>
            </Alert>

            {form.formState.errors.weeklyEntries && (
              <Alert className="border-destructive bg-destructive/10">
                <List className="h-4 w-4" />
                <AlertDescription className="text-destructive">
                  {form.formState.errors.weeklyEntries.message}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        Day of Week <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        onValueChange={(value: DayOfWeek) =>
                          form.setValue(`weeklyEntries.${index}.dayOfWeek` as const, value)
                        }
                        defaultValue={form.watch(`weeklyEntries.${index}.dayOfWeek`)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day) => (
                            <SelectItem key={day.value} value={day.value}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.weeklyEntries?.[index]?.dayOfWeek && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.weeklyEntries[index]?.dayOfWeek?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Time <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="time"
                        {...form.register(`weeklyEntries.${index}.time` as const)}
                        className={
                          form.formState.errors.weeklyEntries?.[index]?.time
                            ? 'border-destructive'
                            : ''
                        }
                      />
                      {form.formState.errors.weeklyEntries?.[index]?.time && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.weeklyEntries[index]?.time?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>
                        Duration (minutes) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="480"
                        {...form.register(`weeklyEntries.${index}.duration`, {
                          valueAsNumber: true,
                        })}
                        className={
                          form.formState.errors.weeklyEntries?.[index]?.duration
                            ? 'border-destructive'
                            : ''
                        }
                      />
                      {form.formState.errors.weeklyEntries?.[index]?.duration && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.weeklyEntries[index]?.duration?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Assignee <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        {...form.register(`weeklyEntries.${index}.assignee` as const)}
                        className={
                          form.formState.errors.weeklyEntries?.[index]?.assignee
                            ? 'border-destructive'
                            : ''
                        }
                        placeholder="e.g., John Doe"
                      />
                      {form.formState.errors.weeklyEntries?.[index]?.assignee && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.weeklyEntries[index]?.assignee?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        onValueChange={(value: string) =>
                          form.setValue(
                            `weeklyEntries.${index}.status` as const,
                            value as 'pending' | 'completed'
                          )
                        }
                        defaultValue={form.watch(`weeklyEntries.${index}.status`) || 'pending'}
                      >
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
                      <Label>
                        Task <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        {...form.register(`weeklyEntries.${index}.task` as const)}
                        className={
                          form.formState.errors.weeklyEntries?.[index]?.task
                            ? 'border-destructive'
                            : ''
                        }
                        placeholder="e.g., Clean Room 101"
                      />
                      {form.formState.errors.weeklyEntries?.[index]?.task && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.weeklyEntries[index]?.task?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Recurrence</Label>
                      <Select
                        onValueChange={(value: string) =>
                          form.setValue(
                            `weeklyEntries.${index}.recurrence` as const,
                            value as 'none' | 'daily' | 'weekly' | 'monthly'
                          )
                        }
                        defaultValue={form.watch(`weeklyEntries.${index}.recurrence`) || 'none'}
                      >
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
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      {...form.register(`weeklyEntries.${index}.notes` as const)}
                      className={
                        form.formState.errors.weeklyEntries?.[index]?.notes
                          ? 'border-destructive'
                          : ''
                      }
                      placeholder="Optional notes for this entry"
                      rows={2}
                    />
                    {form.formState.errors.weeklyEntries?.[index]?.notes && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.weeklyEntries[index]?.notes?.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {!hasWeeklyEntries && (
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
              disabled={form.formState.isSubmitting || !form.formState.isValid || !hasWeeklyEntries}
            >
              {form.formState.isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {isEditing ? (
                    <>
                      <User className="h-4 w-4 mr-2" />
                      Update Weekly Schedule
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Create Weekly Schedule
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
