import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Plus } from "lucide-react"
import { useScheduleStore } from "@/lib/useScheduleStore"
import { Schedule } from "./schedule-form"
import { DashboardHeader } from "./DashboardHeader"
import { DashboardControls } from "./DashboardControls"
import { ScheduleCard } from "./ScheduleCard"

interface DashboardProps {
  onEdit: (schedule: Schedule) => void
  onDelete: (id: string) => void
  onView: (schedule: Schedule) => void
  onAddSchedule?: () => void
}

export function Dashboard({ onEdit, onDelete: onDeleteProp, onView, onAddSchedule }: DashboardProps) {
  const { schedules } = useScheduleStore()
  const allSchedules = schedules

  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Derived state for filtering
  const filteredSchedules = useMemo(() => {
    return allSchedules.filter(schedule => {
      const matchesSearch = schedule.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        schedule.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "all" || schedule.category === categoryFilter
      const scheduleDate = schedule.date ? new Date(schedule.date) : null
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let matchesDate = dateFilter === "all"
      if (scheduleDate) {
        if (dateFilter === "today") {
          matchesDate = scheduleDate.toDateString() === today.toDateString()
        } else if (dateFilter === "week") {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = scheduleDate >= weekAgo
        }
      }
      return matchesSearch && matchesCategory && matchesDate
    })
  }, [allSchedules, debouncedSearchTerm, categoryFilter, dateFilter])

  if (allSchedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-center mb-2">No Schedules Yet</h2>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          Get started by creating your first schedule. Organize your housekeeping tasks, 
          assign team members, and manage multiple schedules efficiently.
        </p>
        <Button size="lg" onClick={onAddSchedule ?? (() => {})}>
          <Plus className="h-4 w-4 mr-2" />
          Create First Schedule
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        totalSchedules={allSchedules.length}
        filteredCount={filteredSchedules.length}
        onAddSchedule={onAddSchedule ?? (() => {})}
        schedules={allSchedules}
      />

      <Card>
        <CardContent className="p-6">
          <DashboardControls
            schedules={allSchedules}
            searchTerm={searchTerm}
            categoryFilter={categoryFilter}
            dateFilter={dateFilter}
            onSearchChange={setSearchTerm}
            onCategoryChange={setCategoryFilter}
            onDateChange={setDateFilter}
          />
        </CardContent>
      </Card>

      {/* Schedules Grid */}
      <div className="max-h-[70vh] overflow-y-auto rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {filteredSchedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDeleteProp}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
