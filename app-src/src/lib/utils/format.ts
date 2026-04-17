/**
 * Formatadores de dados para exibição na UI GovTables.
 *
 * REGRA MONETÁRIA: valores do banco chegam como string (NUMERIC → string via Supabase).
 * Nunca converter para number nativo em cálculos. Usar apenas para exibição.
 */

/** Formata valor monetário em BRL com 4 casas decimais (precisão original do catálogo) */
export function formatBRL(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—"
  const num = typeof value === "string" ? parseFloat(value) : value
  if (isNaN(num)) return "—"
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(num)
}

/** Formata valor monetário em BRL com 2 casas decimais (exibição compacta) */
export function formatBRLShort(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—"
  const num = typeof value === "string" ? parseFloat(value) : value
  if (isNaN(num)) return "—"
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

/** Formata data ISO para mês/ano em pt-BR (ex: "jan/2025") */
export function formatMesRef(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  const [year, month] = dateStr.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
}

/** Formata número inteiro com separador de milhar pt-BR */
export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—"
  return new Intl.NumberFormat("pt-BR").format(value)
}

/** Tipo de item em português */
export function formatTipoItem(tipo: string | null | undefined): string {
  if (!tipo) return "—"
  const map: Record<string, string> = {
    insumo: "Insumo",
    composicao_analitica: "Composição Analítica",
  }
  return map[tipo] ?? tipo
}
