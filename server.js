import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 4000
const HOST = process.env.HOST || '0.0.0.0'

app.use(express.json())

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

    const headers = ['Name', 'Date', 'Start', 'End', 'Tasks']
    const csvRows = [
      headers.join(','),
      ...schedules.map(entry => [
        entry.name.replace(/"/g, ''),
        (entry.date || '').replace(/"/g, ''),
        entry.start.replace(/"/g, ''),
        entry.end.replace(/"/g, ''),
        entry.tasks.replace(/"/g, '').replace(/,/g, ';')
      ].join(','))
    ]

    const csvContent = csvRows.join('\n')
    
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
  const headers = ['Name', 'Date', 'Start', 'End', 'Tasks']
  const csvRows = [
    headers.join(','),
    ...schedules.map(entry => [
      entry.name.replace(/"/g, ''),
      (entry.date || '').replace(/"/g, ''),
      entry.start.replace(/"/g, ''),
      entry.end.replace(/"/g, ''),
      entry.tasks.replace(/"/g, '').replace(/,/g, ';') // Replace commas in tasks with semicolons
    ].join(','))
  ]

  const csvContent = csvRows.join('\n')
  console.log('Sending CSV response')

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