/**
 * Supabase Server Client
 * Uso: Server Components, Server Actions e Route Handlers.
 * Gerencia cookies automaticamente para sessões SSR.
 * Utiliza a anon key — sujeito às políticas RLS.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Em Server Components, set de cookie é ignorado (apenas leitura).
            // A sessão é gerenciada pelo middleware.
          }
        },
      },
    }
  )
}
