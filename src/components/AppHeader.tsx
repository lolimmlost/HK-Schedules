import { Badge } from '@/components/ui/badge'
import { Calendar, Building2, Clock } from 'lucide-react'

interface AppHeaderProps {
  scheduleCount: number
}

export function AppHeader({ scheduleCount }: AppHeaderProps) {
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <header className="bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-primary-foreground sticky top-0 z-50 shadow-lg">
      <div className="container flex h-16 max-w-screen-2xl items-center px-4 md:px-6">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-white/15 backdrop-blur-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold tracking-tight">HK Scheduler</h1>
            <p className="text-xs text-primary-foreground/70">Enterprise Housekeeping Management</p>
          </div>
          <h1 className="sm:hidden text-lg font-bold">HK Scheduler</h1>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side - Stats and Time */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Date/Time - hidden on mobile */}
          <div className="hidden md:flex items-center gap-2 text-sm text-primary-foreground/80">
            <Clock className="h-4 w-4" />
            <span>{currentDate}</span>
            <span className="text-primary-foreground/50">|</span>
            <span className="font-medium">{currentTime}</span>
          </div>

          {/* Schedule Count Badge */}
          <Badge
            variant="secondary"
            className="bg-white/20 text-primary-foreground border-white/30 hover:bg-white/25 transition-colors"
          >
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            {scheduleCount} {scheduleCount === 1 ? 'Schedule' : 'Schedules'}
          </Badge>
        </div>
      </div>
    </header>
  )
}
