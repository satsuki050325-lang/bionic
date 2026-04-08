import express from 'express'
import { eventsRouter } from './routes/events.js'
import { statusRouter } from './routes/status.js'
import { alertsRouter } from './routes/alerts.js'
import { jobsRouter } from './routes/jobs.js'

const app = express()
app.use(express.json())

app.use('/api/events', eventsRouter)
app.use('/api/status', statusRouter)
app.use('/api/alerts', alertsRouter)
app.use('/api/jobs', jobsRouter)

const PORT = process.env.PORT ?? 3001

app.listen(PORT, () => {
  console.log(`Bionic Engine running on http://localhost:${PORT}`)
})
