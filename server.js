import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 4000
const HOST = process.env.HOST || '0.0.0.0'

// Middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
})

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

// Utility function to calculate duration (server-side version of client-side getDuration)
function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return 'N/A'

  const [startHours, startMinutes] = startTime.split(':').map(Number)
  const [endHours, endMinutes] = endTime.split(':').map(Number)

  const startMinutesTotal = startHours * 60 + startMinutes
  const endMinutesTotal = endHours * 60 + endMinutes

  let totalMinutes
  if (endMinutesTotal >= startMinutesTotal) {
    totalMinutes = endMinutesTotal - startMinutesTotal
  } else {
    // Handle overnight shifts (end time is next day)
    totalMinutes = endMinutesTotal + 1440 - startMinutesTotal
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
}

// In development, redirect to Vite dev server on port 3001
if (process.env.NODE_ENV !== 'production') {
  // Only handle API requests, let Vite handle UI
  app.use('/export-csv', (req, res) => {
    // This endpoint is now handled by Vite proxy, but keep as fallback
    console.log('Fallback /export-csv request to Express server')
    const schedules = req.body.schedules

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ error: 'No schedules provided' })
    }

    console.log('Generating CSV for', schedules.length, 'schedules')

    // New CSV format that handles weekly, date-specific, and legacy schedules
    const headers = [
      'Schedule Type',
      'Title',
      'Date/Day',
      'Time',
      'Duration (min)',
      'Task',
      'Assignee',
      'Status',
      'Notes',
    ]

    const csvRows = [
      headers.join(','),
      ...schedules.flatMap((schedule) => {
        // Handle weekly schedules
        if (schedule.scheduleType === 'weekly' && schedule.weeklyEntries) {
          return schedule.weeklyEntries.map((entry) =>
            [
              `"Weekly"`,
              `"${(schedule.title || schedule.name || '').replace(/"/g, '""')}"`,
              `"${(entry.dayOfWeek || '').replace(/"/g, '""')}"`,
              `"${(entry.time || '').replace(/"/g, '""')}"`,
              `"${(entry.duration || '0').replace(/"/g, '""')}"`,
              `"${(entry.task || 'No task specified').replace(/"/g, '""').replace(/,/g, ';')}"`,
              `"${(entry.assignee || 'Unassigned').replace(/"/g, '""')}"`,
              `"${(entry.status || 'pending').replace(/"/g, '""')}"`,
              `"${(entry.notes || '').replace(/"/g, '""').replace(/,/g, ';')}"`,
            ].join(',')
          )
        }

        // Handle legacy schedules (no entries array)
        if (!schedule.entries || schedule.entries.length === 0) {
          const duration =
            schedule.start && schedule.end ? calculateDuration(schedule.start, schedule.end) : 'N/A'
          return [
            `"Legacy"`,
            `"${(schedule.name || schedule.title || '').replace(/"/g, '""')}"`,
            `"${(schedule.date || '').replace(/"/g, '""')}"`,
            `"${(schedule.start || '').replace(/"/g, '""')}"`,
            `"${duration.replace(/"/g, '""')}"`,
            `"${(schedule.tasks || 'No tasks specified').replace(/"/g, '""').replace(/,/g, ';')}"`,
            `"${''}"`, // No assignee for legacy
            `"${'pending'}"`,
            `"${''}"`,
          ].join(',')
        }

        // Handle new format with entries (date-specific)
        return schedule.entries.map((entry) =>
          [
            `"Date-Specific"`,
            `"${(schedule.title || schedule.name || '').replace(/"/g, '""')}"`,
            `"${(schedule.date || '').replace(/"/g, '""')}"`,
            `"${entry.time.replace(/"/g, '""')}"`,
            `"${(entry.duration || '0').replace(/"/g, '""')}"`,
            `"${(entry.task || 'No task specified').replace(/"/g, '""').replace(/,/g, ';')}"`,
            `"${(entry.assignee || 'Unassigned').replace(/"/g, '""')}"`,
            `"${(entry.status || 'pending').replace(/"/g, '""')}"`,
            `"${(entry.notes || '').replace(/"/g, '""').replace(/,/g, ';')}"`,
          ].join(',')
        )
      }),
    ]

    const csvContent = csvRows.join('\n')
    console.log('Sending CSV response with', csvRows.length - 1, 'data rows')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="housekeeper-schedules.csv"')
    res.send(csvContent)
  })

  // Redirect all other requests to Vite dev server on port 3001
  app.get('*', (req, res) => {
    res.redirect(`http://localhost:3001${req.originalUrl}`)
  })
} else {
  // Production: serve static files from dist
  app.use(express.static(path.join(__dirname, 'dist')))

  // Serve index.html for all routes in production
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  })
}

// Export CSV endpoint (fallback for development, primary for production)
app.post('/export-csv', (req, res) => {
  console.log('Received POST to /export-csv with body:', req.body)
  const schedules = req.body.schedules

  if (!Array.isArray(schedules) || schedules.length === 0) {
    console.log('Invalid schedules, sending 400')
    return res.status(400).json({ error: 'No schedules provided' })
  }

  console.log('Generating CSV for', schedules.length, 'schedules')

  // New CSV format that handles weekly, date-specific, and legacy schedules
  const headers = [
    'Schedule Type',
    'Title',
    'Date/Day',
    'Time',
    'Duration (min)',
    'Task',
    'Assignee',
    'Status',
    'Notes',
  ]

  const csvRows = [
    headers.join(','),
    ...schedules.flatMap((schedule) => {
      // Handle weekly schedules
      if (schedule.scheduleType === 'weekly' && schedule.weeklyEntries) {
        return schedule.weeklyEntries.map((entry) =>
          [
            `"Weekly"`,
            `"${(schedule.title || schedule.name || '').replace(/"/g, '""')}"`,
            `"${(entry.dayOfWeek || '').replace(/"/g, '""')}"`,
            `"${(entry.time || '').replace(/"/g, '""')}"`,
            `"${(entry.duration || '0').replace(/"/g, '""')}"`,
            `"${(entry.task || 'No task specified').replace(/"/g, '""').replace(/,/g, ';')}"`,
            `"${(entry.assignee || 'Unassigned').replace(/"/g, '""')}"`,
            `"${(entry.status || 'pending').replace(/"/g, '""')}"`,
            `"${(entry.notes || '').replace(/"/g, '""').replace(/,/g, ';')}"`,
          ].join(',')
        )
      }

      // Handle legacy schedules (no entries array)
      if (!schedule.entries || schedule.entries.length === 0) {
        const duration =
          schedule.start && schedule.end ? calculateDuration(schedule.start, schedule.end) : 'N/A'
        return [
          `"Legacy"`,
          `"${(schedule.name || schedule.title || '').replace(/"/g, '""')}"`,
          `"${(schedule.date || '').replace(/"/g, '""')}"`,
          `"${(schedule.start || '').replace(/"/g, '""')}"`,
          `"${duration.replace(/"/g, '""')}"`,
          `"${(schedule.tasks || 'No tasks specified').replace(/"/g, '""').replace(/,/g, ';')}"`,
          `"${''}"`, // No assignee for legacy
          `"${'pending'}"`,
          `"${''}"`,
        ].join(',')
      }

      // Handle new format with entries (date-specific)
      return schedule.entries.map((entry) =>
        [
          `"Date-Specific"`,
          `"${(schedule.title || schedule.name || '').replace(/"/g, '""')}"`,
          `"${(schedule.date || '').replace(/"/g, '""')}"`,
          `"${entry.time.replace(/"/g, '""')}"`,
          `"${(entry.duration || '0').replace(/"/g, '""')}"`,
          `"${(entry.task || 'No task specified').replace(/"/g, '""').replace(/,/g, ';')}"`,
          `"${(entry.assignee || 'Unassigned').replace(/"/g, '""')}"`,
          `"${(entry.status || 'pending').replace(/"/g, '""')}"`,
          `"${(entry.notes || '').replace(/"/g, '""').replace(/,/g, ';')}"`,
        ].join(',')
      )
    }),
  ]

  const csvContent = csvRows.join('\n')
  console.log('Sending CSV response with', csvRows.length - 1, 'data rows')

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="housekeeper-schedules.csv"')
  res.send(csvContent)
})

// Global error handling middleware
app.use((err, req, res, _next) => {
  console.error('Error occurred:', err)

  // Handle specific error types
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON payload',
      message: 'The request body contains invalid JSON',
    })
  }

  // Default error response
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Cannot ${req.method} ${req.url}`,
  })
})

app
  .listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`)
    console.log(`Mode: ${process.env.NODE_ENV || 'development'}`)
    if (process.env.NODE_ENV !== 'production') {
      console.log('For development, access the app at: http://localhost:3001')
      console.log(
        'This server (port 4000) handles API requests and redirects UI to Vite dev server'
      )
      console.log('Cloudflare tunnel should point to: http://localhost:3001')
    }
  })
  .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Error: Port ${PORT} is already in use`)
      process.exit(1)
    } else {
      console.error('Server error:', err)
      process.exit(1)
    }
  })
