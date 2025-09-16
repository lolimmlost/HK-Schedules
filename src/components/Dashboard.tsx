import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Edit3, Trash2, Eye, Calendar, Clock, Users, Plus } from "lucide-react"
import { useScheduleStore } from "@/lib/useScheduleStore"
import { Schedule } from "./schedule-form"
import { formatDate } from "@/lib/utils"
import { useState } from "react"

interface DashboardProps {
  onEdit: (schedule: Schedule) => void
  onDelete: (id: string) => void
  onView: (schedule: Schedule) => void
}

export function Dashboard({ onEdit, onDelete, onView }: DashboardProps) {
  const { schedules, getSchedules } = useScheduleStore()
  const allSchedules = getSchedules()

  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Derived state for filtering
  const filteredSchedules = allSchedules.filter(schedule => {
    const matchesSearch = schedule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || schedule.category === categoryFilter
    const scheduleDate = schedule.date ? new Date(schedule.date) : null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const matchesDate = dateFilter === "all" || 
      (dateFilter === "today" && scheduleDate?.toDateString() === today.toDateString()) ||
      (dateFilter === "week" && scheduleDate && scheduleDate >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000))
    return matchesSearch && matchesCategory && matchesDate
  })

  // Pagination
  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage)
  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const categories = ["all", ...new Set(allSchedules.map(s => s.category))] as const
  const entryCount = (schedule: Schedule) => schedule.entries?.length || 1

  const getLastUpdated = (schedule: Schedule) => {
    return formatDate(schedule.date || new Date().toISOString())
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Reset to first page on search
  }

  const debouncedSearch = React.useMemo(() => {
    const timer = setTimeout(() => {}, 0)
    return handleSearch
  }, [])

  if (allSchedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-center mb-2">No Schedules Yet</h2>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          Get started by creating your first schedule. Organize your housekeeping tasks, 
          assign team members, and manage multiple schedules efficiently.
        </p>
        <Button size="lg" onClick={() => { /* Trigger add form */ }}>
          <Plus className="h-4 w-4 mr-2" />
          Create First Schedule
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Schedules Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{filteredSchedules.length} of {allSchedules.length} schedules</span>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schedules by title or description..."
                className="pl-10"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.filter(c => c !== "all").map(cat => (
                  <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Schedules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedSchedules.map(schedule => (
          <Card key={schedule.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg leading-tight">{schedule.title}</CardTitle>
                  <Badge variant="secondary" className="mt-1">
                    {schedule.category.charAt(0).toUpperCase() + schedule.category.slice(1)}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(schedule)}
                    title="View Schedule"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(schedule)}
                    title="Edit Schedule"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(schedule.id)}
                    title="Delete Schedule"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {schedule.description && (
                <CardDescription className="mb-3 line-clamp-2">
                  {schedule.description}
                </CardDescription>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>{entryCount(schedule)} entries</span>
                </div>
                {schedule.date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>{formatDate(schedule.date)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>{schedule.entries?.map(e => e.assignee).filter(Boolean).join(', ') || 'Unassigned'}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Last updated: {getLastUpdated(schedule)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing { (currentPage - 1) * itemsPerPage + 1 } to { Math.min(currentPage * itemsPerPage, filteredSchedules.length) } of { filteredSchedules.length } schedules
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}