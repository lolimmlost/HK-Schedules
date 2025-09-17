import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useScheduleStore, validateScheduleEntries, isLegacyData, migrateV1ToV2 } from '../useScheduleStore'
import type { Schedule } from '../../components/schedule-form'
import { v4 as uuidv4 } from 'uuid'

// Mock localStorage for Node.js environment
const localStorageMock = (() => {
  let store: { [key: string]: string } = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString() },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} }
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('useScheduleStore', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('validates housekeeping schedule with unique units', () => {
    const schedule: Schedule = {
      id: 'test',
      title: 'Test Housekeeping',
      category: 'housekeeping',
      entries: [
        { id: '1', time: '09:00', duration: 60, task: 'Room 101', assignee: 'John', status: 'pending', recurrence: 'none' },
        { id: '2', time: '10:00', duration: 60, task: 'Room 102', assignee: 'John', status: 'pending', recurrence: 'none' }
      ],
      version: '2.0',
      recurrence: 'none'
    }
    expect(validateScheduleEntries(schedule)).toBe(true)
  })

  it('rejects housekeeping schedule with duplicate units', () => {
    const schedule: Schedule = {
      id: 'test',
      title: 'Test Housekeeping',
      category: 'housekeeping',
      entries: [
        { id: '1', time: '09:00', duration: 60, task: 'Room 101', assignee: 'John', status: 'pending', recurrence: 'none' },
        { id: '2', time: '10:00', duration: 60, task: 'Room 101', assignee: 'John', status: 'pending', recurrence: 'none' }
      ],
      version: '2.0',
      recurrence: 'none'
    }
    expect(validateScheduleEntries(schedule)).toBe(false)
  })

  it('rejects schedule with time overlaps', () => {
    const schedule: Schedule = {
      id: 'test',
      title: 'Test',
      category: 'general',
      entries: [
        { id: '1', time: '09:00', duration: 60, task: 'Task 1', assignee: 'John', status: 'pending', recurrence: 'none' },
        { id: '2', time: '09:00', duration: 60, task: 'Task 2', assignee: 'Jane', status: 'pending', recurrence: 'none' }
      ],
      version: '2.0',
      recurrence: 'none'
    }
    expect(validateScheduleEntries(schedule)).toBe(false)
  })

  it('warns for large schedule >130 entries', () => {
    const largeEntries = Array.from({ length: 131 }, (_, i) => ({
      id: uuidv4(),
      time: `0${Math.floor(i / 10)}:${(i % 10) * 6}:00`,
      duration: 60,
      task: `Task ${i}`,
      assignee: 'John',
      status: 'pending' as const,
      recurrence: 'none' as const
    }))

    const schedule: Schedule = {
      id: 'large',
      title: 'Large Schedule',
      category: 'housekeeping',
      entries: largeEntries,
      version: '2.0',
      recurrence: 'none'
    }

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(validateScheduleEntries(schedule)).toBe(true)
    expect(consoleWarnSpy).toHaveBeenCalledWith('Large schedule: 131 entries')
    consoleWarnSpy.mockRestore()
  })

  it('detects legacy data', () => {
    const legacy = { name: 'Old', start: '09:00', end: '10:00', version: '1.0' }
    expect(isLegacyData(legacy)).toBe(true)

    const modern: Schedule = {
      id: 'modern',
      title: 'Modern',
      category: 'general',
      entries: [],
      version: '2.0',
      recurrence: 'none'
    }
    expect(isLegacyData(modern)).toBe(false)
  })

  it('migrates v1 to v2 correctly', () => {
    const legacy = [
      { id: 'old1', name: 'John', start: '09:00', end: '10:00', tasks: 'Clean rooms', date: '2025-01-01' }
    ]
    const migrated = migrateV1ToV2(legacy)
    expect(migrated).toHaveLength(1)
    const newSchedule = migrated[0]
    expect(newSchedule.title).toBe('John')
    expect(newSchedule.entries).toHaveLength(1)
    expect(newSchedule.entries[0].task).toBe('Clean rooms')
    expect(newSchedule.entries[0].assignee).toBe('John')
    expect(newSchedule.version).toBe('2.0')
  })

  it('housekeeper management adds/removes correctly', () => {
    const { result } = renderHook(() => useScheduleStore())
    
    act(() => {
      result.current.addHousekeeper('John')
    })
    expect(result.current.housekeepers).toEqual(['John'])

    act(() => {
      result.current.addHousekeeper('John') // Duplicate
    })
    expect(result.current.housekeepers).toEqual(['John']) // No duplicate

    act(() => {
      result.current.addHousekeeper('Jane')
    })
    expect(result.current.housekeepers).toEqual(['John', 'Jane'])

    act(() => {
      result.current.removeHousekeeper('John')
    })
    expect(result.current.housekeepers).toEqual(['Jane'])
  })

  it('updateSchedule validates before updating', () => {
    const { result } = renderHook(() => useScheduleStore())
    
    // Add initial schedule
    const initialSchedule: Schedule = {
      id: 'test',
      title: 'Test',
      category: 'general',
      entries: [
        { id: '1', time: '09:00', duration: 60, task: 'Task1', assignee: 'John', status: 'pending', recurrence: 'none' }
      ],
      version: '2.0',
      recurrence: 'none'
    }
    act(() => {
      result.current.addSchedule(initialSchedule)
    })

    // Valid update
    const validUpdate: Schedule = {
      ...initialSchedule,
      entries: [
        { ...initialSchedule.entries[0], task: 'Updated Task' }
      ]
    }
    act(() => {
      result.current.updateSchedule(validUpdate)
    })
    expect(result.current.getSchedules()[0].entries[0].task).toBe('Updated Task')

    // Invalid update (duplicate time)
    const invalidUpdate: Schedule = {
      ...initialSchedule,
      entries: [
        { id: '1', time: '09:00', duration: 60, task: 'Task1', assignee: 'John', status: 'pending', recurrence: 'none' },
        { id: '2', time: '09:00', duration: 60, task: 'Task2', assignee: 'Jane', status: 'pending', recurrence: 'none' }
      ]
    }
    const prevSchedules = result.current.getSchedules()
    act(() => {
      result.current.updateSchedule(invalidUpdate)
    })
    // Should not update due to validation
    expect(result.current.getSchedules()).toEqual(prevSchedules)
  })
})