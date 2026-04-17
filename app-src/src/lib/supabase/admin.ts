/**
 * Supabase Admin Client (service_role)
 * Uso: EXCLUSIVO para operações de ETL, ingestão de dados e tarefas administrativas.
 *
 * ATENÇÃO:
 *   - Este cliente BYPASSA todas as políticas de RLS.
 *   - NUNCA importar em Client Components ou expor via API pública.
 *   - Usar apenas em: Route Handlers internos, Server Actions protegidas,
 *     scripts de ETL e Edge Functions.
 */
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      '[govtables] SUPABASE_SERVICE_ROLE_KEY não configurada. ' +
      'Verifique .env.local. Este cliente é exclusivo para uso server-side.'
    )
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
