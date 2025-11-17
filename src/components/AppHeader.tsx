//import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'

interface AppHeaderProps {
  scheduleCount: number
}

export function AppHeader({ scheduleCount }: AppHeaderProps) {
  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Calendar className="h-6 w-6 text-primary" />
          <span className="sr-only">Housekeeper Schedule Manager</span>
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Housekeeper Schedule Manager</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-sm">
            {scheduleCount} schedule{scheduleCount !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>
    </header>
  )
}
