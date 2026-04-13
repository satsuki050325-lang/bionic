import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '../lib/supabase.js'
import { getConfig } from '../config.js'

export interface IncidentBrief {
  summary: string
  startHere: string
  affectedServices: string[]
  topIssueType: string | null
  generatedAt: string
  cached: boolean
}

const CACHE_TTL_MS = 5 * 60 * 1000

let cachedBrief: {
  brief: IncidentBrief
  generatedAt: number
  cacheKey: string
} | null = null

function buildCacheKey(
  alerts: Array<{ id: string; updated_at?: string | null }>
): string {
  const count = alerts.length
  const latestUpdatedAt =
    alerts
      .map((a) => a.updated_at ?? '')
      .sort()
      .pop() ?? ''
  return `${count}:${latestUpdatedAt}`
}

export const incidentBriefRouter = Router()

incidentBriefRouter.get('/', async (_req, res) => {
  const config = getConfig()

  if (!config.anthropic.enabled || !config.anthropic.apiKey) {
    res.json({
      summary: null,
      startHere: null,
      affectedServices: [],
      topIssueType: null,
      generatedAt: new Date().toISOString(),
      cached: false,
      available: false,
    })
    return
  }

  const { data: alerts, error: alertError } = await supabase
    .from('engine_alerts')
    .select('id, type, severity, service_id, count, last_seen_at, updated_at')
    .eq('status', 'open')
    .order('severity', { ascending: true })
    .limit(10)

  if (alertError) {
    console.error('[incident-brief] failed to fetch alerts:', alertError)
    res.status(503).json({
      available: false,
      error: 'failed to fetch alerts from database',
    })
    return
  }

  const alertRows = alerts ?? []
  const cacheKey = buildCacheKey(alertRows)

  if (
    cachedBrief &&
    Date.now() - cachedBrief.generatedAt < CACHE_TTL_MS &&
    cachedBrief.cacheKey === cacheKey
  ) {
    res.json({ ...cachedBrief.brief, cached: true, available: true })
    return
  }

  if (alertRows.length === 0) {
    const emptyBrief: IncidentBrief = {
      summary: 'All systems nominal. No open alerts.',
      startHere: 'No action required.',
      affectedServices: [],
      topIssueType: null,
      generatedAt: new Date().toISOString(),
      cached: false,
    }
    cachedBrief = { brief: emptyBrief, generatedAt: Date.now(), cacheKey }
    res.json({ ...emptyBrief, available: true })
    return
  }

  try {
    const anthropic = new Anthropic({ apiKey: config.anthropic.apiKey })

    // Minimize what we send to the external API: no titles, no messages.
    // Only metadata needed to summarize the incident surface.
    const alertSummary = alertRows
      .map(
        (a) =>
          `- [${String(a.severity).toUpperCase()}] type=${a.type} service=${a.service_id} count=${a.count} last_seen=${a.last_seen_at}`
      )
      .join('\n')

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `You are an ops copilot. Based on these open alerts, generate a brief incident summary.

Open alerts:
${alertSummary}

Respond with JSON only, no markdown:
{
  "summary": "1-2 sentence description of what's happening and which services are affected",
  "startHere": "1 sentence on what to do first",
  "affectedServices": ["list", "of", "service", "names"],
  "topIssueType": "the most common alert type"
}

Keep it concise and actionable. Use the actual service names and issue types from the data.`,
        },
      ],
    })

    const content = message.content[0]
    if (!content || content.type !== 'text') {
      throw new Error('unexpected response type')
    }

    const parsed = JSON.parse(content.text) as {
      summary: string
      startHere: string
      affectedServices: string[]
      topIssueType: string
    }

    const brief: IncidentBrief = {
      summary: parsed.summary,
      startHere: parsed.startHere,
      affectedServices: parsed.affectedServices,
      topIssueType: parsed.topIssueType,
      generatedAt: new Date().toISOString(),
      cached: false,
    }

    cachedBrief = { brief, generatedAt: Date.now(), cacheKey }
    res.json({ ...brief, available: true })
  } catch (err) {
    console.error('[incident-brief] failed to generate brief:', err)
    res.status(500).json({ error: 'failed to generate incident brief' })
  }
})
