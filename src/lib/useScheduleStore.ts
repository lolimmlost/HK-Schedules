import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { StateCreator } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { getDuration } from './utils'
import type { Schedule, Entry } from '@/components/schedule-form'

interface ScheduleState {
  schedules: Schedule[]
  housekeepers: string[]
  addSchedule: (schedule: Schedule) => void
  updateSchedule: (schedule: Schedule) => void
  deleteSchedule: (id: string) => void
  getSchedule: (id: string) => Schedule | undefined
  getSchedules: () => Schedule[]
  setSchedules: (schedules: Schedule[]) => void
  addHousekeeper: (name: string) => void
  removeHousekeeper: (name: string) => void
  setHousekeepers: (names: string[]) => void
  getHousekeepers: () => string[]
}

// Validation function for entries (exported for tests)
export function validateScheduleEntries(schedule: Schedule): boolean {
  if (!schedule.entries || schedule.entries.length === 0) return false

  // Check for duplicate tasks (units for housekeeping)
  if (schedule.category === 'housekeeping') {
    const tasks = schedule.entries.map(e => e.task.toLowerCase().trim())
    const uniqueTasks = new Set(tasks)
    if (tasks.length !== uniqueTasks.size) {
      console.error('Duplicate units detected')
      return false
    }
  }

  // Check for time overlaps
  const times = schedule.entries.map(e => e.time)
  const sortedTimes = [...times].sort()
  for (let i = 0; i < sortedTimes.length - 1; i++) {
    if (sortedTimes[i] === sortedTimes[i + 1]) {
      console.error('Time overlaps detected')
      return false
    }
  }

  // Large dataset warning (not blocking)
  if (schedule.entries.length > 130) {
    console.warn('Large schedule: ' + schedule.entries.length + ' entries')
  }

  return true
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
      recurrence: 'none',
      notes: undefined
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

export const useScheduleStore = create(
  persist(
    (set, get) => ({
      schedules: [],
      housekeepers: [],
      addSchedule: (schedule) => {
        console.log('🔍 Store - addSchedule called with:', schedule)
        if (!validateScheduleEntries(schedule)) {
          console.error('Validation failed: Invalid schedule add')
          throw new Error('Invalid schedule data')
        }
        set((state) => ({ schedules: [...state.schedules, schedule] }))
        console.log('🔍 Store - schedule added successfully')
      },
      updateSchedule: (updatedSchedule) => {
        console.log('🔍 Store - updateSchedule called with:', updatedSchedule)
        if (!validateScheduleEntries(updatedSchedule)) {
          console.error('Validation failed: Invalid schedule update')
          return
        }
        set((state) => ({
          schedules: state.schedules.map(s => s.id === updatedSchedule.id ? updatedSchedule : s)
        }))
      },
      deleteSchedule: (id) => set((state) => ({
        schedules: state.schedules.filter(s => s.id !== id)
      })),
      getSchedule: (id) => {
        const state = get()
        return state.schedules.find(s => s.id === id)
      },
      getSchedules: () => {
        const state = get()
        return [...state.schedules]
      },
      setSchedules: (schedules) => set({ schedules }),
      addHousekeeper: (name) => {
        const state = get()
        if (name.trim() && !state.housekeepers.includes(name.trim())) {
          set((state) => ({ housekeepers: [...state.housekeepers, name.trim()] }))
        }
      },
      removeHousekeeper: (name) => set((state) => ({
        housekeepers: state.housekeepers.filter(h => h !== name)
      })),
      setHousekeepers: (names) => set({ housekeepers: names }),
      getHousekeepers: () => {
        const state = get()
        return [...state.housekeepers]
      }
    }),
    {
      name: 'schedule-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ schedules: state.schedules, housekeepers: state.housekeepers }),
      migrate: (persistedState, version) => {
        if (version === 0) {
          const state = persistedState as any
          if (isLegacyData(state.schedules?.[0])) {
            state.schedules = migrateV1ToV2(state.schedules)
          }
          return state
        }
        return persistedState
      }
    }
  )
)