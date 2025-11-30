import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { getDuration } from './utils'
import type { Schedule, Entry } from '@/components/schedule-form'
import { scheduleSchema } from '../components/schedule-form'
import { toastHelpers } from '@/hooks/use-toast'

export interface ScheduleState {
  schedules: Schedule[]
  housekeepers: string[]
  deletedSchedules: Schedule[]
  addSchedule: (schedule: Schedule) => void
  updateSchedule: (schedule: Schedule) => void
  deleteSchedule: (id: string) => void
  undoDelete: (id: string) => void
  clearDeleted: () => void
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
  const result = scheduleSchema.safeParse(schedule)
  if (!result.success) {
    console.error('Zod validation failed:', result.error.issues)
    return false
  }

  // Additional housekeeping-specific check (unique tasks case-insensitive)
  if (schedule.category === 'housekeeping') {
    if (schedule.scheduleType === 'date-specific') {
      const tasks = schedule.entries?.map((e) => e.task.toLowerCase().trim()) || []
      const uniqueTasks = new Set(tasks)
      if (tasks.length !== uniqueTasks.size) {
        console.error('Duplicate units detected in housekeeping schedule')
        return false
      }
    } else if (schedule.scheduleType === 'weekly' && schedule.weeklyEntries) {
      const tasks = schedule.weeklyEntries.map((e) => e.task.toLowerCase().trim())
      const uniqueTasks = new Set(tasks)
      if (tasks.length !== uniqueTasks.size) {
        console.error('Duplicate units detected in housekeeping weekly schedule')
        return false
      }
    }
  }

  // Large dataset warning (not blocking)
  const entryCount =
    schedule.scheduleType === 'weekly'
      ? schedule.weeklyEntries?.length || 0
      : schedule.entries?.length || 0
  if (entryCount > 130) {
    console.warn('Large schedule: ' + entryCount + ' entries')
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
      duration: legacy.end
        ? parseInt(
            getDuration(legacy.start || '09:00', legacy.end || '10:00').replace(/[^0-9]/g, '')
          ) || 60
        : 60,
      task: legacy.tasks || 'General task',
      assignee: legacy.name || 'Unassigned',
      status: 'pending',
      recurrence: 'none',
      notes: undefined,
    }

    return {
      id: legacy.id || `migrated-${index}`,
      title: legacy.name || 'Migrated Schedule',
      description: legacy.tasks || 'Migrated from v1',
      category: 'general',
      date: legacy.date || '',
      entries: [entry],
      version: '2.0',
      recurrence: 'none',
    } as Schedule
  })
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      schedules: [],
      housekeepers: [],
      deletedSchedules: [],
      /**
       * Adds a new schedule to the store after validation
       * @param schedule - The schedule object to add
       * @throws Error if validation fails
       */
      addSchedule: (schedule: Schedule) => {
        const result = scheduleSchema.safeParse(schedule)
        if (!result.success) {
          console.error('Zod validation failed for addSchedule:', result.error.issues)
          console.error('Full error details:', result.error.format())
          const errorMessage = result.error.issues
            .map((e: { message: string }) => e.message)
            .join(', ')
          toastHelpers.error('Failed to create schedule', errorMessage)
          throw new Error(`Invalid schedule data: ${errorMessage}`)
        }
        if (!validateScheduleEntries(schedule)) {
          console.error('Enhanced validation failed: Invalid schedule add')
          toastHelpers.error('Invalid schedule data', 'Please check your entries for errors')
          throw new Error('Invalid schedule data')
        }
        set((state: ScheduleState) => ({ schedules: [...state.schedules, schedule] }))
        toastHelpers.success(
          'Schedule created',
          `"${schedule.title}" has been created successfully`
        )
      },
      updateSchedule: (updatedSchedule: Schedule) => {
        console.log('🔍 Store - updateSchedule called with:', updatedSchedule)
        const result = scheduleSchema.safeParse(updatedSchedule)
        if (!result.success) {
          console.error('Zod validation failed for updateSchedule:', result.error.issues)
          toastHelpers.error('Failed to update schedule', 'Validation error')
          return // Don't update on parse failure
        }
        if (!validateScheduleEntries(updatedSchedule)) {
          console.error('Enhanced validation failed: Invalid schedule update')
          toastHelpers.error('Invalid schedule data', 'Please check your entries for errors')
          return
        }
        set((state: ScheduleState) => ({
          schedules: state.schedules.map((s: Schedule) =>
            s.id === updatedSchedule.id ? updatedSchedule : s
          ),
        }))
        toastHelpers.success(
          'Schedule updated',
          `"${updatedSchedule.title}" has been updated successfully`
        )
      },
      deleteSchedule: (id: string) => {
        const state = get()
        const deleted = state.schedules.find((s) => s.id === id)
        if (deleted) {
          set((state: ScheduleState) => ({
            schedules: state.schedules.filter((s: Schedule) => s.id !== id),
            deletedSchedules: [...state.deletedSchedules, deleted],
          }))
          toastHelpers.warning(
            'Schedule deleted',
            `"${deleted.title}" has been deleted. You have 10 seconds to undo.`
          )
          // Clear deleted after 10 seconds
          setTimeout(() => {
            set((state: ScheduleState) => ({
              deletedSchedules: state.deletedSchedules.filter((s: Schedule) => s.id !== id),
            }))
          }, 10000)
        }
      },
      undoDelete: (id: string) => {
        const state = get()
        const restored = state.deletedSchedules.find((s) => s.id === id)
        set((state: ScheduleState) => ({
          schedules: [
            ...state.schedules,
            ...state.deletedSchedules.filter((s: Schedule) => s.id === id),
          ],
          deletedSchedules: state.deletedSchedules.filter((s: Schedule) => s.id !== id),
        }))
        if (restored) {
          toastHelpers.success('Schedule restored', `"${restored.title}" has been restored`)
        }
      },
      clearDeleted: () => set({ deletedSchedules: [] }),
      getSchedule: (id: string) => {
        const state = get() as ScheduleState
        return state.schedules.find((s: Schedule) => s.id === id)
      },
      getSchedules: () => {
        const state = get() as ScheduleState
        return [...state.schedules]
      },
      setSchedules: (schedules: Schedule[]) => set({ schedules }),
      addHousekeeper: (name: string) => {
        const state = get() as ScheduleState
        if (name.trim() && !state.housekeepers.includes(name.trim())) {
          set((state: ScheduleState) => ({ housekeepers: [...state.housekeepers, name.trim()] }))
        }
      },
      removeHousekeeper: (name: string) =>
        set((state: ScheduleState) => ({
          housekeepers: state.housekeepers.filter((h: string) => h !== name),
        })),
      setHousekeepers: (names: string[]) => set({ housekeepers: names }),
      getHousekeepers: () => {
        const state = get() as ScheduleState
        return [...state.housekeepers]
      },
    }),
    {
      name: 'schedule-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: ScheduleState) => ({
        schedules: state.schedules,
        housekeepers: state.housekeepers,
      }),
      migrate: (persistedState, version) => {
        if (version === 0) {
          const state = persistedState as any
          if (isLegacyData(state.schedules?.[0])) {
            const migrated = migrateV1ToV2(state.schedules)
            // Validate migrated data
            migrated.forEach((sched: Schedule) => {
              if (!validateScheduleEntries(sched)) {
                console.warn('Migration produced invalid schedule, applying fallback:', sched.id)
                // Fallback: minimal valid schedule
                sched.entries = [
                  {
                    id: uuidv4(),
                    time: '09:00',
                    duration: 60,
                    task: 'Migrated Task',
                    assignee: 'Unassigned',
                    status: 'pending',
                    recurrence: 'none',
                  },
                ]
              }
            })
            state.schedules = migrated
          }
          return state
        }
        return persistedState
      },
    }
  )
)
