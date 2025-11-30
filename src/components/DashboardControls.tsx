import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter, Calendar, SlidersHorizontal } from 'lucide-react'
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

const categoryIcons: Record<string, string> = {
  housekeeping: '🏠',
  maintenance: '🔧',
  cleaning: '✨',
  inspection: '🔍',
  general: '📋',
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

  const categories = ['all', ...new Set(schedules.map((s) => s.category))] as const

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearchTerm])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value)
  }

  const hasActiveFilters = searchTerm || categoryFilter !== 'all' || dateFilter !== 'all'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <SlidersHorizontal className="h-4 w-4" />
        <span className="font-medium">Filter & Search</span>
        {hasActiveFilters && (
          <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
            Filters active
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative md:col-span-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search schedules..."
            className="pl-10 h-10 bg-background border-input focus:ring-2 focus:ring-primary/20"
            value={localSearchTerm}
            onChange={handleSearchChange}
          />
          {localSearchTerm && (
            <button
              onClick={() => {
                setLocalSearchTerm('')
                onSearchChange('')
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={onCategoryChange}>
          <SelectTrigger className="h-10 bg-background">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All Categories" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">📁</span>
                All Categories
              </span>
            </SelectItem>
            {categories
              .filter((c) => c !== 'all')
              .map((cat) => (
                <SelectItem key={cat} value={cat}>
                  <span className="flex items-center gap-2">
                    <span>{categoryIcons[cat.toLowerCase()] || '📋'}</span>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </span>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {/* Date Filter */}
        <Select value={dateFilter} onValueChange={onDateChange}>
          <SelectTrigger className="h-10 bg-background">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All Dates" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">📅</span>
                All Dates
              </span>
            </SelectItem>
            <SelectItem value="today">
              <span className="flex items-center gap-2">
                <span>☀️</span>
                Today
              </span>
            </SelectItem>
            <SelectItem value="week">
              <span className="flex items-center gap-2">
                <span>📆</span>
                This Week
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
