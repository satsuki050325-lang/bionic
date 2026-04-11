'use server'

import { revalidatePath } from 'next/cache'
import { createResearchItem } from '@/lib/engine'

export async function saveResearchItem(formData: FormData) {
  const title = formData.get('title') as string
  const summary = formData.get('summary') as string
  const url = formData.get('url') as string | null
  const category = formData.get('category') as string | null
  const importanceScore = Number(formData.get('importanceScore'))

  if (!title || !summary || isNaN(importanceScore)) {
    return
  }

  await createResearchItem({
    projectId: 'project_bionic',
    title,
    summary,
    url: url || undefined,
    category: category || undefined,
    importanceScore,
  })

  revalidatePath('/research')
}
