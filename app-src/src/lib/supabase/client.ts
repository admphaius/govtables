/**
 * Supabase Browser Client
 * Uso: componentes Client ('use client') e hooks do lado do cliente.
 * Utiliza a anon key — sujeito às políticas RLS.
 */
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
