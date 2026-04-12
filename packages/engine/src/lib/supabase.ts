import { createClient } from '@supabase/supabase-js'
import { getConfig } from '../config.js'

const config = getConfig()

if (!config.supabase.url || !config.supabase.serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
}

export const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
