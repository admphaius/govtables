/**
 * Query builders para aplicar filtros ao Supabase.
 * Cada catálogo tem seus filtros específicos.
 */

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/supabase"

export interface CatalogFilters {
  q?: string | null
  ref?: string | null
  tipo?: string | null
}

export interface SinapiFilters extends CatalogFilters {
  uf?: string | null
  onerado?: "true" | "false" | null
}

export interface SicroFilters extends CatalogFilters {
  regiao?: string | null
  uf?: string | null
  segmento?: string | null
}

export interface EmopFilters extends CatalogFilters {
  capitulo?: string | null
}

export interface ScoFilters extends CatalogFilters {
  grupo?: string | null
}

/** Filtros SINAPI com desoneração e UF */
export async function getSinapiWithFilters(filters: SinapiFilters) {
  const client = await createClient()
  let query = client.from("tb_sinapi").select("*")

  if (filters.q) {
    query = query.or(`codigo.ilike.%${filters.q}%,descricao.ilike.%${filters.q}%`)
  }
  if (filters.ref) {
    query = query.eq("mes_referencia", filters.ref)
  }
  if (filters.tipo && (filters.tipo === "insumo" || filters.tipo === "composicao_analitica")) {
    query = query.eq("tipo", filters.tipo)
  }
  if (filters.uf) {
    query = query.eq("estado_uf", filters.uf)
  }
  if (filters.onerado !== null && filters.onerado !== undefined) {
    query = query.eq("is_onerado", filters.onerado === "true")
  }

  return query
    .order("mes_referencia", { ascending: false })
    .order("codigo", { ascending: true })
    .limit(100)
}

/** Filtros SICRO com região e segmento */
export async function getSicroWithFilters(filters: SicroFilters) {
  const client = await createClient()
  let query = client.from("tb_sicro").select("*")

  if (filters.q) {
    query = query.or(`codigo.ilike.%${filters.q}%,descricao.ilike.%${filters.q}%`)
  }
  if (filters.ref) {
    query = query.eq("mes_referencia", filters.ref)
  }
  if (filters.tipo && (filters.tipo === "insumo" || filters.tipo === "composicao_analitica")) {
    query = query.eq("tipo", filters.tipo)
  }
  if (filters.regiao) {
    query = query.eq("regiao_geografica", filters.regiao)
  }
  if (filters.uf) {
    query = query.eq("estado_uf", filters.uf)
  }
  if (filters.segmento) {
    query = query.eq("segmento", filters.segmento)
  }

  return query
    .order("mes_referencia", { ascending: false })
    .order("codigo", { ascending: true })
    .limit(100)
}

/** Filtros EMOP com capítulo */
export async function getEmopWithFilters(filters: EmopFilters) {
  const client = await createClient()
  let query = client.from("tb_emop").select("*")

  if (filters.q) {
    query = query.or(`codigo.ilike.%${filters.q}%,descricao.ilike.%${filters.q}%`)
  }
  if (filters.ref) {
    query = query.eq("mes_referencia", filters.ref)
  }
  if (filters.tipo && (filters.tipo === "insumo" || filters.tipo === "composicao_analitica")) {
    query = query.eq("tipo", filters.tipo)
  }
  if (filters.capitulo) {
    query = query.eq("capitulo", filters.capitulo)
  }

  return query
    .order("mes_referencia", { ascending: false })
    .order("codigo", { ascending: true })
    .limit(100)
}

/** Filtros SCO com grupo */
export async function getScoWithFilters(filters: ScoFilters) {
  const client = await createClient()
  let query = client.from("tb_sco").select("*")

  if (filters.q) {
    query = query.or(`codigo.ilike.%${filters.q}%,descricao.ilike.%${filters.q}%`)
  }
  if (filters.ref) {
    query = query.eq("mes_referencia", filters.ref)
  }
  if (filters.tipo && (filters.tipo === "insumo" || filters.tipo === "composicao_analitica")) {
    query = query.eq("tipo", filters.tipo)
  }
  if (filters.grupo) {
    query = query.eq("grupo", filters.grupo)
  }

  return query
    .order("mes_referencia", { ascending: false })
    .order("codigo", { ascending: true })
    .limit(100)
}

/** Obter lista de valores únicos para dropdowns (ex: UFs, regiões) */
export async function getDistinctValues(
  table: "tb_sinapi" | "tb_sicro" | "tb_emop" | "tb_sco",
  column: string
) {
  const client = await createClient()
  const { data } = await client
    .from(table)
    .select(column)
    .not(column, "is", null)
    .order(column, { ascending: true })

  if (!data || !Array.isArray(data)) return []
  const values = data.map((row: any) => row[column])
  return [...new Set(values)].filter(Boolean)
}
