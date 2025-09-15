import { useState, useEffect } from 'react'
import type { Schedule } from '@/components/schedule-form'

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
      return parsed
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