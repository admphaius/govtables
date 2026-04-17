"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2, AlertCircle, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { GlassPanel } from "@/components/govtech/GlassPanel"
import { formatBRLShort, formatMesRef } from "@/lib/utils/format"
import { cn } from "@/lib/utils"

// ----------------------------------------------------------------
// Tipos
// ----------------------------------------------------------------
interface SearchResult {
  id: string
  catalogo: string
  codigo: string
  descricao: string
  unidade_medida: string
  preco_unitario: number | string | null
  mes_referencia: string
  extra_info: Record<string, unknown>
  similarity: number
}

interface SearchResponse {
  query: string
  catalogo: string
  total: number
  results: SearchResult[]
  error?: string
}

// ----------------------------------------------------------------
// Paleta de cores por catálogo
// ----------------------------------------------------------------
const CATALOGO_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  SINAPI: { bg: "bg-blue-500/10",   text: "text-blue-400",   border: "border-blue-500/20" },
  SICRO:  { bg: "bg-amber-500/10",  text: "text-amber-400",  border: "border-amber-500/20" },
  EMOP:   { bg: "bg-emerald-500/10",text: "text-emerald-400",border: "border-emerald-500/20" },
  SCO:    { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
}

const CATALOGO_LABELS: Record<string, string> = {
  SINAPI: "SINAPI · CEF/IBGE",
  SICRO:  "SICRO · DNIT",
  EMOP:   "EMOP · Estado RJ",
  SCO:    "SCO-Rio · Município RJ",
}

const FILTER_OPTIONS = [
  { value: "",       label: "Todos" },
  { value: "SINAPI", label: "SINAPI" },
  { value: "SICRO",  label: "SICRO" },
  { value: "EMOP",   label: "EMOP" },
  { value: "SCO",    label: "SCO" },
]

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
function SimilarityBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className="h-1 w-16 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground w-7 text-right">
        {pct}%
      </span>
    </div>
  )
}

function ExtraInfo({ catalogo, extra }: { catalogo: string; extra: Record<string, unknown> }) {
  const parts: string[] = []
  if (catalogo === "SINAPI") {
    if (extra.estado_uf)  parts.push(String(extra.estado_uf))
    if (extra.classe)     parts.push(String(extra.classe).replace(/_/g, " "))
    if (typeof extra.is_onerado === "boolean")
      parts.push(extra.is_onerado ? "Onerado" : "Desonerado")
  } else if (catalogo === "SICRO") {
    if (extra.regiao_geografica) parts.push(String(extra.regiao_geografica))
    if (extra.estado_uf)         parts.push(String(extra.estado_uf))
    if (extra.segmento)          parts.push(String(extra.segmento).replace(/_/g, " "))
  } else if (catalogo === "EMOP") {
    if (extra.capitulo)    parts.push(String(extra.capitulo))
    if (extra.subcapitulo) parts.push(String(extra.subcapitulo))
  } else if (catalogo === "SCO") {
    if (extra.grupo)    parts.push(String(extra.grupo))
    if (extra.subgrupo) parts.push(String(extra.subgrupo))
  }
  if (!parts.length) return null
  return (
    <p className="text-[11px] text-muted-foreground/60 truncate">
      {parts.join(" · ")}
    </p>
  )
}

// ----------------------------------------------------------------
// Componente principal
// ----------------------------------------------------------------
export function SearchPanel() {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("")
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastQuery, setLastQuery] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim() || query.trim().length < 3) {
      setResults(null)
      setError(null)
      return
    }

    debounceRef.current = setTimeout(() => {
      doSearch(query.trim(), filter)
    }, 500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filter])

  async function doSearch(q: string, cat: string) {
    setLoading(true)
    setError(null)
    setLastQuery(q)

    try {
      const params = new URLSearchParams({ q, limit: "30" })
      if (cat) params.set("catalogo", cat)

      const resp = await fetch(`/api/search?${params}`)
      const json: SearchResponse = await resp.json()

      if (!resp.ok || json.error) {
        setError(json.error ?? "Erro ao buscar.")
        setResults(null)
        return
      }

      setResults(json.results)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro de rede.")
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de busca */}
      <GlassPanel className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          {/* Input */}
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            {loading && (
              <Loader2
                size={13}
                className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-accent"
              />
            )}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: concreto usinado fck 25mpa, escavação mecânica..."
              className={cn(
                "w-full rounded-md border border-border bg-background/60 py-2.5 pl-9 pr-9",
                "text-sm text-foreground placeholder:text-muted-foreground/50",
                "focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/50",
                "transition-colors"
              )}
            />
          </div>

          {/* Filtro por catálogo */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={cn(
              "rounded-md border border-border bg-background/60 px-3 py-2.5",
              "text-sm text-foreground",
              "focus:outline-none focus:ring-1 focus:ring-accent/50",
              "sm:w-36"
            )}
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Dica */}
        {!query && (
          <p className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <Sparkles size={11} className="text-accent/60" />
            Busca por similaridade semântica — descreva o serviço em linguagem natural
          </p>
        )}
      </GlassPanel>

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Resultados */}
      {results !== null && !error && (
        <div className="space-y-2">
          <p className="px-1 text-xs text-muted-foreground">
            {results.length > 0
              ? `${results.length} resultado${results.length !== 1 ? "s" : ""} para "${lastQuery}"`
              : `Nenhum resultado para "${lastQuery}"`}
          </p>

          {results.length === 0 && (
            <GlassPanel className="py-12 text-center">
              <p className="text-sm text-muted-foreground">Nenhum item com similaridade suficiente.</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Tente reformular a consulta ou reduzir o filtro de catálogo.
              </p>
            </GlassPanel>
          )}

          {results.map((item) => {
            const style = CATALOGO_STYLES[item.catalogo] ?? CATALOGO_STYLES.SINAPI
            return (
              <GlassPanel
                key={item.id}
                className="flex items-start gap-3 px-4 py-3 hover:border-accent/20 transition-colors"
              >
                {/* Catálogo badge */}
                <div className="pt-0.5 shrink-0">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-semibold uppercase tracking-wider",
                      style.bg, style.text, style.border
                    )}
                  >
                    {item.catalogo}
                  </Badge>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <p className="flex-1 text-sm font-medium text-foreground leading-snug line-clamp-2">
                      {item.descricao}
                    </p>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <span className="font-mono text-[11px] text-muted-foreground/70">
                      {item.codigo}
                    </span>
                    <span className="text-[11px] text-muted-foreground/60">
                      {item.unidade_medida}
                    </span>
                    <span className="text-xs font-medium tabular-nums text-foreground">
                      {formatBRLShort(item.preco_unitario)}
                    </span>
                    <span className="text-[11px] text-muted-foreground/60">
                      {formatMesRef(item.mes_referencia)}
                    </span>
                  </div>

                  <ExtraInfo catalogo={item.catalogo} extra={item.extra_info ?? {}} />
                </div>

                {/* Similarity */}
                <div className="shrink-0 pt-1">
                  <SimilarityBar value={item.similarity} />
                </div>
              </GlassPanel>
            )
          })}

          {/* Legenda de catálogos */}
          {results.length > 0 && (
            <div className="flex flex-wrap gap-2 px-1 pt-1">
              {Object.entries(CATALOGO_LABELS).map(([cat, label]) => {
                const style = CATALOGO_STYLES[cat]
                return (
                  <span key={cat} className={cn("text-[10px] px-2 py-0.5 rounded border", style.bg, style.text, style.border)}>
                    {label}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
