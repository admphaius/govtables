import { createClient } from "@/lib/supabase/server"

export interface CatalogStat {
  total: number
  lastRef: string | null
}

export interface DashboardStats {
  sinapi: CatalogStat
  sicro: CatalogStat
  emop: CatalogStat
  sco: CatalogStat
}

async function getTableStat(
  table: "tb_sinapi" | "tb_sicro" | "tb_emop" | "tb_sco"
): Promise<CatalogStat> {
  const client = await createClient()

  const [countResult, lastRefResult] = await Promise.all([
    client.from(table).select("*", { count: "exact", head: true }),
    client
      .from(table)
      .select("mes_referencia")
      .order("mes_referencia", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return {
    total: countResult.count ?? 0,
    lastRef: lastRefResult.data?.mes_referencia ?? null,
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [sinapi, sicro, emop, sco] = await Promise.all([
    getTableStat("tb_sinapi"),
    getTableStat("tb_sicro"),
    getTableStat("tb_emop"),
    getTableStat("tb_sco"),
  ])
  return { sinapi, sicro, emop, sco }
}
