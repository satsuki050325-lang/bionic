import { supabase } from '../lib/supabase.js'

export function getWeeklyDigestKey(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(date)
  const year = parts.find((p) => p.type === 'year')?.value
  const month = parts.find((p) => p.type === 'month')?.value
  const day = parts.find((p) => p.type === 'day')?.value

  // ISO週番号を計算する
  const localDate = new Date(`${year}-${month}-${day}`)
  const startOfYear = new Date(localDate.getFullYear(), 0, 1)
  const weekNum = Math.ceil(
    ((localDate.getTime() - startOfYear.getTime()) / 86400000 +
      startOfYear.getDay() +
      1) /
      7
  )
  return `research_digest:${year}-W${String(weekNum).padStart(2, '0')}`
}

export async function enqueueResearchDigestJob(params: {
  projectId: string
  requestedBy: string
  dedupeKey: string
}): Promise<{ created: boolean; jobId?: string }> {
  const { data, error } = await supabase
    .from('engine_jobs')
    .insert({
      project_id: params.projectId,
      type: 'research_digest',
      status: 'pending',
      requested_by: params.requestedBy,
      payload: {},
      dedupe_key: params.dedupeKey,
    })
    .select('id')
    .single()

  if (error) {
    // 23505 = unique violation = 今週分は作成済み
    if (error.code === '23505') {
      console.log(`[scheduler] digest job already exists for ${params.dedupeKey}`)
      return { created: false }
    }
    console.error('[scheduler] failed to enqueue job:', error)
    return { created: false }
  }

  console.log(`[scheduler] digest job created: ${data.id} (${params.dedupeKey})`)
  return { created: true, jobId: data.id }
}
