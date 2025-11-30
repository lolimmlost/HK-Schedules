/**
 * Application-wide constants
 */

// Time constants
export const DEFAULT_DURATION_MINUTES = 60
export const MIN_DURATION_MINUTES = 1
export const MINUTES_PER_HOUR = 60

// Validation constants
export const MIN_HOUSEKEEPER_NAME_LENGTH = 2
export const MAX_TASK_DESCRIPTION_LENGTH = 500
export const MAX_SCHEDULE_ENTRIES_WARNING = 130

// Storage constants
export const STORAGE_KEY = 'schedule-storage'
export const HOUSEKEEPERS_STORAGE_KEY = 'housekeeperSchedules'

// Timeout constants
export const DELETE_UNDO_TIMEOUT_MS = 10000 // 10 seconds

// CSV constants
export const CSV_LEGACY_MIN_COLUMNS = 4
export const CSV_LEGACY_MAX_COLUMNS = 6
export const CSV_V2_MIN_COLUMNS = 6

// Server constants
export const DEV_VITE_PORT = 3001
export const API_SERVER_PORT = 4000
export const PREVIEW_PORT = 4173

// UI constants
export const EMPTY_STATE_MESSAGE = 'No schedules found'
export const LOADING_STATE_MESSAGE = 'Loading...'

// Time format
export const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
export const DURATION_HOUR_REGEX = /(\d+(?:\.\d+)?)(h|hr|hours?)/i
export const DURATION_MINUTE_REGEX = /(\d+(?:\.\d+)?)(min|m)/i

// Export constants
export const CSV_EXPORT_MIME_TYPE = 'text/csv;charset=utf-8;'
export const CSV_UTF8_BOM = '\uFEFF'
