import { Router } from 'express'
import type {
  CreateResearchItemInput,
  CreateResearchItemResult,
  ListResearchItemsResult,
} from '@bionic/shared'
import { supabase } from '../lib/supabase.js'

export const researchRouter = Router()

researchRouter.get('/', async (req, res) => {
  const { category, is_digest_sent, limit } = req.query

  let query = supabase
    .from('research_items')
    .select('*')
    .order('importance_score', { ascending: false })

  if (category) query = query.eq('category', category as string)
  if (is_digest_sent !== undefined) query = query.eq('is_digest_sent', is_digest_sent === 'true')
  if (limit) query = query.limit(Number(limit))

  const { data, error } = await query

  if (error) {
    console.error('Failed to fetch research items:', error)
    res.status(500).json({ error: 'failed to fetch research items' })
    return
  }

  const result: ListResearchItemsResult = {
    items: (data ?? []).map((row) => ({
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      summary: row.summary,
      url: row.url ?? null,
      category: row.category ?? null,
      importanceScore: row.importance_score,
      isDigestSent: row.is_digest_sent,
      createdAt: row.created_at,
    })),
  }

  res.status(200).json(result)
})

researchRouter.post('/', async (req, res) => {
  const input = req.body as CreateResearchItemInput

  if (!input.title || !input.summary || input.importanceScore === undefined) {
    res.status(400).json({ error: 'title, summary, importanceScore are required' })
    return
  }

  if (input.importanceScore < 0 || input.importanceScore > 100) {
    res.status(400).json({ error: 'importanceScore must be between 0 and 100' })
    return
  }

  const { data, error } = await supabase
    .from('research_items')
    .insert({
      project_id: input.projectId ?? 'default',
      title: input.title,
      summary: input.summary,
      url: input.url ?? null,
      category: input.category ?? null,
      importance_score: input.importanceScore,
      is_digest_sent: false,
    })
    .select()
    .single()

  if (error || !data) {
    console.error('Failed to insert research item:', error)
    res.status(500).json({ error: 'failed to save research item' })
    return
  }

  const result: CreateResearchItemResult = {
    item: {
      id: data.id,
      projectId: data.project_id,
      title: data.title,
      summary: data.summary,
      url: data.url ?? null,
      category: data.category ?? null,
      importanceScore: data.importance_score,
      isDigestSent: data.is_digest_sent,
      createdAt: data.created_at,
    },
  }

  res.status(201).json(result)
})
