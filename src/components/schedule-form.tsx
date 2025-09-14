import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Calendar, Clock, List, Plus } from "lucide-react"

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

interface FormErrors {
  name?: string
  start?: string
  end?: string
  tasks?: string
}

export function ScheduleForm({ initialData, onSubmit, onCancel }: ScheduleFormProps) {
  const [formData, setFormData] = React.useState({
    name: initialData?.name || "",
    date: initialData?.date || "",
    start: initialData?.start || "",
    end: initialData?.end || "",
    tasks: initialData?.tasks || "",
  })
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(!!initialData)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Housekeeper name is required"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }

    // Start time validation
    if (!formData.start) {
      newErrors.start = "Start time is required"
    }

    // End time validation
    if (!formData.end) {
      newErrors.end = "End time is required"
    } else if (formData.start && formData.end) {
      const startTime = new Date(`2000-01-01T${formData.start}:00`)
      const endTime = new Date(`2000-01-01T${formData.end}:00`)
      if (endTime <= startTime) {
        newErrors.end = "End time must be after start time"
      }
    }

    // Tasks validation (optional but helpful)
    if (formData.tasks.trim().length > 500) {
      newErrors.tasks = "Tasks description must be less than 500 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const data: Schedule = {
      id: initialData?.id || Date.now().toString(),
      ...formData,
    }
    
    onSubmit(data)
    
    setIsSubmitting(false)
    setErrors({})
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
    setErrors({})
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

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <Card className="w-full max-w-2xl">
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
            : "Fill in the details to create a new housekeeper schedule"
          }
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasErrors && (
          <Alert variant="destructive">
            <List className="h-4 w-4" />
            <AlertDescription>
              Please fix the errors below to continue.
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Housekeeper Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={errors.name ? "border-destructive" : ""}
              placeholder="Enter housekeeper name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Date Field */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full max-w-sm"
            />
          </div>

          {/* Time Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="start" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Start Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="start"
                type="time"
                required
                value={formData.start}
                onChange={(e) => handleInputChange('start', e.target.value)}
                className={errors.start ? "border-destructive" : ""}
              />
              {errors.start && (
                <p className="text-sm text-destructive">{errors.start}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                End Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="end"
                type="time"
                required
                value={formData.end}
                onChange={(e) => handleInputChange('end', e.target.value)}
                className={errors.end ? "border-destructive" : ""}
              />
              {errors.end && (
                <p className="text-sm text-destructive">{errors.end}</p>
              )}
            </div>
          </div>

          {/* Tasks Field */}
          <div className="space-y-2">
            <Label htmlFor="tasks" className="flex items-center gap-2">
              <List className="h-4 w-4 text-muted-foreground" />
              Tasks
            </Label>
            <Textarea
              id="tasks"
              value={formData.tasks}
              onChange={(e) => handleInputChange('tasks', e.target.value)}
              className={errors.tasks ? "border-destructive" : ""}
              placeholder="Enter tasks for this schedule (vacuum, dust, clean kitchen, etc.)"
              rows={4}
            />
            {errors.tasks && (
              <p className="text-sm text-destructive">{errors.tasks}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.tasks.length}/500 characters
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={isSubmitting || hasErrors}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {isEditing ? "Updating..." : "Adding..."}
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
                      Add Schedule
                    </>
                  )}
                </>
              )}
            </Button>
            
            {isEditing && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                className="flex-1 sm:w-auto"
                disabled={isSubmitting}
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