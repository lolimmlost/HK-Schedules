import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 4000
const HOST = process.env.HOST || '0.0.0.0'

app.use(express.json())

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
    totalMinutes = (endMinutesTotal + 1440) - startMinutesTotal
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
    
    // New CSV format that handles both legacy and entry-based schedules
    const headers = ['Housekeeper', 'Assignee', 'Date', 'Start Time', 'Duration (h)', 'Tasks']
    
    const csvRows = [
      headers.join(','),
      ...schedules.flatMap(schedule => {
        // Handle legacy schedules (no entries array)
        if (!schedule.entries || schedule.entries.length === 0) {
          const duration = schedule.start && schedule.end ? calculateDuration(schedule.start, schedule.end) : 'N/A'
          return [
            `"${schedule.name.replace(/"/g, '""')}"`,
            '', // No assignee for legacy
            `"${(schedule.date || '').replace(/"/g, '""')}"`,
            `"${(schedule.start || '').replace(/"/g, '""')}"`,
            `"${duration.replace(/"/g, '""')}"`,
            `"${(schedule.tasks || 'No tasks specified').replace(/"/g, '""').replace(/,/g, ';')}"`
          ].join(',')
        }
        
        // Handle new format with entries
        return schedule.entries.map(entry => [
          `"${schedule.name.replace(/"/g, '""')}"`,
          `"${entry.assignee.replace(/"/g, '""')}"`,
          `"${(schedule.date || '').replace(/"/g, '""')}"`,
          `"${entry.time.replace(/"/g, '""')}"`,
          `"${(entry.duration || '0').replace(/"/g, '""')}"`,
          `"${entry.tasks.replace(/"/g, '""').replace(/,/g, ';')}"`
        ].join(','))
      })
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
  
  // New CSV format that handles both legacy and entry-based schedules
  const headers = ['Housekeeper', 'Assignee', 'Date', 'Start Time', 'Duration (h)', 'Tasks']
  
  const csvRows = [
    headers.join(','),
    ...schedules.flatMap(schedule => {
      // Handle legacy schedules (no entries array)
      if (!schedule.entries || schedule.entries.length === 0) {
        const duration = schedule.start && schedule.end ? calculateDuration(schedule.start, schedule.end) : 'N/A'
        return [
          `"${schedule.name.replace(/"/g, '""')}"`,
          '', // No assignee for legacy
          `"${(schedule.date || '').replace(/"/g, '""')}"`,
          `"${(schedule.start || '').replace(/"/g, '""')}"`,
          `"${duration.replace(/"/g, '""')}"`,
          `"${(schedule.tasks || 'No tasks specified').replace(/"/g, '""').replace(/,/g, ';')}"`
        ].join(',')
      }
      
      // Handle new format with entries
      return schedule.entries.map(entry => [
        `"${schedule.name.replace(/"/g, '""')}"`,
        `"${entry.assignee.replace(/"/g, '""')}"`,
        `"${(schedule.date || '').replace(/"/g, '""')}"`,
        `"${entry.time.replace(/"/g, '""')}"`,
        `"${(entry.duration || '0').replace(/"/g, '""')}"`,
        `"${entry.tasks.replace(/"/g, '""').replace(/,/g, ';')}"`
      ].join(','))
    })
  ]

  const csvContent = csvRows.join('\n')
  console.log('Sending CSV response with', csvRows.length - 1, 'data rows')

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="housekeeper-schedules.csv"')
  res.send(csvContent)
})

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`)
  console.log(`Mode: ${process.env.NODE_ENV || 'development'}`)
  if (process.env.NODE_ENV !== 'production') {
    console.log('For development, access the app at: http://localhost:3001')
    console.log('This server (port 4000) handles API requests and redirects UI to Vite dev server')
    console.log('Cloudflare tunnel should point to: http://localhost:3001')
  }
})