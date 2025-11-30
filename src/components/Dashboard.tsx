import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Plus, ClipboardList, Users, Clock, CheckCircle2, TrendingUp } from 'lucide-react'
import { useScheduleStore } from '@/lib/useScheduleStore'
import { Schedule } from './schedule-form'
import { DashboardHeader } from './DashboardHeader'
import { DashboardControls } from './DashboardControls'
import { ScheduleCard } from './ScheduleCard'

interface DashboardProps {
  onEdit: (schedule: Schedule) => void
  onDelete: (id: string) => void
  onView: (schedule: Schedule) => void
  onAddSchedule?: () => void
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
}

function StatCard({ title, value, subtitle, icon, trend, trendUp }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1 text-xs">
            <TrendingUp
              className={`h-3 w-3 ${trendUp ? 'text-success' : 'text-destructive rotate-180'}`}
            />
            <span className={trendUp ? 'text-success' : 'text-destructive'}>{trend}</span>
          </div>
        )}
      </CardContent>
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
    </Card>
  )
}

export function Dashboard({
  onEdit,
  onDelete: onDeleteProp,
  onView,
  onAddSchedule,
}: DashboardProps) {
  const { schedules } = useScheduleStore()
  const allSchedules = schedules

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Derived state for filtering
  const filteredSchedules = useMemo(() => {
    return allSchedules.filter((schedule) => {
      const matchesSearch =
        schedule.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        schedule.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || schedule.category === categoryFilter
      const scheduleDate = schedule.date ? new Date(schedule.date) : null
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let matchesDate = dateFilter === 'all'
      if (scheduleDate) {
        if (dateFilter === 'today') {
          matchesDate = scheduleDate.toDateString() === today.toDateString()
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = scheduleDate >= weekAgo
        }
      }
      return matchesSearch && matchesCategory && matchesDate
    })
  }, [allSchedules, debouncedSearchTerm, categoryFilter, dateFilter])

  // Calculate stats
  const stats = useMemo(() => {
    const totalEntries = allSchedules.reduce((sum, s) => {
      if (s.scheduleType === 'weekly') {
        return sum + (s.weeklyEntries?.length || 0)
      }
      return sum + (s.entries?.length || 0)
    }, 0)

    const uniqueAssignees = new Set(
      allSchedules.flatMap((s) => {
        if (s.scheduleType === 'weekly') {
          return s.weeklyEntries?.map((e) => e.assignee).filter(Boolean) || []
        }
        return s.entries?.map((e) => e.assignee).filter(Boolean) || []
      })
    )

    const weeklySchedules = allSchedules.filter((s) => s.scheduleType === 'weekly').length

    const todaySchedules = allSchedules.filter((s) => {
      if (!s.date) return false
      const scheduleDate = new Date(s.date)
      const today = new Date()
      return scheduleDate.toDateString() === today.toDateString()
    }).length

    return {
      totalEntries,
      uniqueAssignees: uniqueAssignees.size,
      weeklySchedules,
      todaySchedules,
    }
  }, [allSchedules])

  if (allSchedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Calendar className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-center mb-2">Welcome to HK Scheduler</h2>
        <p className="text-muted-foreground text-center mb-8 max-w-md">
          Get started by creating your first schedule. Organize housekeeping tasks, assign team
          members, and manage operations efficiently.
        </p>
        <Button size="lg" onClick={onAddSchedule ?? (() => {})} className="gap-2">
          <Plus className="h-5 w-5" />
          Create Your First Schedule
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Schedules"
          value={allSchedules.length}
          subtitle="Active schedules"
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard
          title="Total Tasks"
          value={stats.totalEntries}
          subtitle="Across all schedules"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          title="Team Members"
          value={stats.uniqueAssignees}
          subtitle="Assigned staff"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Today's Schedules"
          value={stats.todaySchedules}
          subtitle="Due today"
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      {/* Filters Card */}
      <Card className="border-dashed">
        <CardContent className="p-4 md:p-6">
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
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-medium text-muted-foreground">
            Showing {filteredSchedules.length} of {allSchedules.length} schedules
          </h3>
          {(searchTerm || categoryFilter !== 'all' || dateFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setCategoryFilter('all')
                setDateFilter('all')
              }}
              className="text-xs h-7"
            >
              Clear filters
            </Button>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto rounded-xl border bg-muted/30 p-4 md:p-6">
          {filteredSchedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No schedules match your filters</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setCategoryFilter('all')
                  setDateFilter('all')
                }}
                className="mt-2"
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
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
          )}
        </div>
      </div>
    </div>
  )
}
