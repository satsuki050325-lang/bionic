import express from 'express'
import cors from 'cors'
import { eventsRouter } from './routes/events.js'
import { statusRouter } from './routes/status.js'
import { alertsRouter } from './routes/alerts.js'
import { jobsRouter } from './routes/jobs.js'
import { researchRouter } from './routes/research.js'
import { actionsRouter } from './routes/actions.js'
import { engineAuthMiddleware } from './middleware/auth.js'
import { startScheduler } from './scheduler/index.js'

const app = express()

app.use(express.json({ limit: '1mb' }))
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Actor-Id'],
}))
app.use(engineAuthMiddleware)

app.use('/api/events', eventsRouter)
app.use('/api/status', statusRouter)
app.use('/api/alerts', alertsRouter)
app.use('/api/jobs', jobsRouter)
app.use('/api/research', researchRouter)
app.use('/api/actions', actionsRouter)

const PORT = process.env.PORT ?? 3001
const HOST = process.env.BIONIC_ENGINE_HOST ?? '127.0.0.1'

app.listen(Number(PORT), HOST, () => {
  console.log(`Bionic Engine running on http://${HOST}:${PORT}`)
  startScheduler()
})
