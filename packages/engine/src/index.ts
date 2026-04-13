import express from 'express'
import cors from 'cors'
import { eventsRouter } from './routes/events.js'
import { statusRouter } from './routes/status.js'
import { alertsRouter } from './routes/alerts.js'
import { jobsRouter } from './routes/jobs.js'
import { researchRouter } from './routes/research.js'
import { actionsRouter } from './routes/actions.js'
import { diagnosticsRouter } from './routes/diagnostics.js'
import { vercelWebhookRouter } from './routes/webhooks/vercel.js'
import { githubWebhookRouter } from './routes/webhooks/github.js'
import { stripeWebhookRouter } from './routes/webhooks/stripe.js'
import { sentryWebhookRouter } from './routes/webhooks/sentry.js'
import { engineAuthMiddleware } from './middleware/auth.js'
import { startScheduler } from './scheduler/index.js'
import { startDiscordBot } from './discord/index.js'
import { getConfig, validateConfigForStartup } from './config.js'

const config = getConfig()
validateConfigForStartup(config)

const app = express()

app.use(
  '/api/webhooks/vercel',
  express.raw({ type: 'application/json', limit: '1mb' }),
  vercelWebhookRouter
)

app.use(
  '/api/webhooks/github',
  express.raw({ type: 'application/json', limit: '5mb' }),
  githubWebhookRouter
)

app.use(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json', limit: '1mb' }),
  stripeWebhookRouter
)

app.use(
  '/api/webhooks/sentry',
  express.raw({ type: 'application/json', limit: '1mb' }),
  sentryWebhookRouter
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
app.use('/api/diagnostics', diagnosticsRouter)

app.listen(config.engine.port, config.engine.host, () => {
  console.log(`Bionic Engine running on http://${config.engine.host}:${config.engine.port}`)
  startScheduler()
  void startDiscordBot()
})
