import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter, Calendar } from 'lucide-react'
import { Schedule } from './schedule-form'

interface DashboardControlsProps {
  schedules: Schedule[]
  searchTerm: string
  categoryFilter: string
  dateFilter: string
  onSearchChange: (term: string) => void
  onCategoryChange: (category: string) => void
  onDateChange: (date: string) => void
}

export function DashboardControls({
  schedules,
  searchTerm,
  categoryFilter,
  dateFilter,
  onSearchChange,
  onCategoryChange,
  onDateChange,
}: DashboardControlsProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)
  const [_debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  const categories = ['all', ...new Set(schedules.map((s) => s.category))] as const

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearchTerm)
      setDebouncedSearchTerm(localSearchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearchTerm])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search schedules by title or description..."
          className="pl-10"
          value={localSearchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {/* Category Filter */}
      <Select value={categoryFilter} onValueChange={onCategoryChange}>
        <SelectTrigger>
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories
            .filter((c) => c !== 'all')
            .map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      {/* Date Filter */}
      <Select value={dateFilter} onValueChange={onDateChange}>
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
  )
}
