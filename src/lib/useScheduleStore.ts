import { useState, useEffect } from 'react'
import type { Schedule, Entry } from '@/components/schedule-form'
import { v4 as uuidv4 } from 'uuid'
import { getDuration } from './utils'

interface ScheduleStore {
  schedules: Schedule[]
  addSchedule: (schedule: Schedule) => void
  updateSchedule: (schedule: Schedule) => void
  deleteSchedule: (id: string) => void
  getSchedule: (id: string) => Schedule | undefined
  getSchedules: () => Schedule[]
  setSchedules: (schedules: Schedule[]) => void
}

export function useScheduleStore(): ScheduleStore {
  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    const saved = localStorage.getItem('housekeeperSchedules')
    console.log('🔍 useScheduleStore - localStorage raw:', saved)
    try {
      const parsed = saved ? JSON.parse(saved) : []
      console.log('🔍 useScheduleStore - parsed schedules:', parsed.length, 'items')

      // Migration check for v1 data
      if (parsed.length > 0 && isLegacyData(parsed[0])) {
        if (confirm('Detected legacy v1 data. Migrate to v2 format? This will convert single-entry schedules to multi-entry format. Backup will be created.')) {
          const backup = JSON.stringify(parsed, null, 2)
          localStorage.setItem('housekeeperSchedules_backup_v1', backup)
          console.log('🔍 useScheduleStore - v1 backup created')

          const migrated = migrateV1ToV2(parsed as any[])
          localStorage.setItem('housekeeperSchedules', JSON.stringify(migrated))
          console.log('🔍 useScheduleStore - migrated to v2:', migrated.length, 'schedules')
          return migrated
        } else {
          console.log('🔍 useScheduleStore - migration skipped, using legacy data')
          // Cast to Schedule for compatibility, but display warning
          return parsed as Schedule[]
        }
      }

      return parsed as Schedule[]
    } catch (error) {
      console.error('🔍 useScheduleStore - JSON.parse error:', error)
      localStorage.removeItem('housekeeperSchedules')
      return []
    }
  })

  // Persist to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem('housekeeperSchedules', JSON.stringify(schedules))
      console.log('🔍 useScheduleStore - localStorage saved:', schedules.length, 'items')
    } catch (error) {
      console.error('🔍 useScheduleStore - localStorage save error:', error)
    }
  }, [schedules])

  const addSchedule = (schedule: Schedule) => {
    setSchedules(prev => [...prev, schedule])
  }

  const updateSchedule = (updatedSchedule: Schedule) => {
    setSchedules(prev => 
      prev.map(s => s.id === updatedSchedule.id ? updatedSchedule : s)
    )
  }

  const deleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id))
  }

  const getSchedule = (id: string): Schedule | undefined => {
    return schedules.find(s => s.id === id)
  }

  const getSchedules = (): Schedule[] => {
    return [...schedules]
  }

  const setSchedulesDirect = (newSchedules: Schedule[]) => {
    setSchedules(newSchedules)
  }

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔍 useScheduleStore - schedules updated:', schedules.length, 'items')
  }, [schedules])

  return {
    schedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    getSchedule,
    getSchedules,
    setSchedules: setSchedulesDirect
  }
}

// Migration utilities
export function isLegacyData(data: any): boolean {
  return !('version' in data) || data.version === '1.0' || ('name' in data && !('entries' in data))
}

export function migrateV1ToV2(legacySchedules: any[]): Schedule[] {
  return legacySchedules.map((legacy, index) => {
    const entry: Entry = {
      id: uuidv4(),
      time: legacy.start || '09:00',
      duration: legacy.end ? parseInt(getDuration(legacy.start || '09:00', legacy.end || '10:00').replace(/[^0-9]/g, '')) || 60 : 60,
      task: legacy.tasks || 'General task',
      assignee: legacy.name || 'Unassigned',
      status: 'pending',
      recurrence: 'none'
    }

    return {
      id: legacy.id || `migrated-${index}`,
      title: legacy.name || 'Migrated Schedule',
      description: legacy.tasks || 'Migrated from v1',
      category: 'general',
      date: legacy.date || '',
      entries: [entry],
      version: '2.0',
      recurrence: 'none'
    } as Schedule
  })
}