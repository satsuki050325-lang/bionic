import express from 'express'
import cors from 'cors'
import { eventsRouter } from './routes/events.js'
import { statusRouter } from './routes/status.js'
import { alertsRouter } from './routes/alerts.js'
import { jobsRouter } from './routes/jobs.js'
import { researchRouter } from './routes/research.js'
import { actionsRouter } from './routes/actions.js'
import { vercelWebhookRouter } from './routes/webhooks/vercel.js'
import { engineAuthMiddleware } from './middleware/auth.js'
import { startScheduler } from './scheduler/index.js'

const app = express()

app.use(
  '/api/webhooks/vercel',
  express.raw({ type: 'application/json', limit: '1mb' }),
  vercelWebhookRouter
)

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

function validateEnvironment(): void {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.BIONIC_ENGINE_TOKEN) {
      console.error('[engine] BIONIC_ENGINE_TOKEN is required in production. Exiting.')
      process.exit(1)
    }
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[engine] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in production. Exiting.')
      process.exit(1)
    }
    console.log('[engine] production environment validated.')
  }
}

validateEnvironment()
app.listen(Number(PORT), HOST, () => {
  console.log(`Bionic Engine running on http://${HOST}:${PORT}`)
  startScheduler()
})
