import type { Metadata } from "next"
import { MapPin } from "lucide-react"
import { TopBar } from "@/components/govtech/TopBar"
import { GlassPanel } from "@/components/govtech/GlassPanel"
import { CatalogTable, TipoBadge, type CatalogColumn } from "@/components/govtech/CatalogTable"
import { CatalogFiltersForm } from "@/components/govtech/CatalogFiltersForm"
import { getScoWithFilters, getDistinctValues } from "@/lib/supabase/queries/catalog-filters"
import { formatBRL, formatMesRef } from "@/lib/utils/format"
import type { Database } from "@/types/supabase"

export const metadata: Metadata = { title: "SCO-Rio" }

type ScoRow = Database["public"]["Tables"]["tb_sco"]["Row"]

const columns: CatalogColumn<ScoRow>[] = [
  {
    key: "codigo",
    header: "Código",
    className: "w-24 font-mono text-xs text-muted-foreground",
    render: (row) => row.codigo,
  },
  {
    key: "descricao",
    header: "Descrição",
    className: "max-w-[320px]",
    render: (row) => (
      <span className="line-clamp-2 text-foreground">{row.descricao}</span>
    ),
  },
  {
    key: "tipo",
    header: "Tipo",
    className: "w-32",
    render: (row) => <TipoBadge tipo={row.tipo} />,
  },
  {
    key: "grupo",
    header: "Grupo",
    className: "w-44 text-xs text-muted-foreground",
    render: (row) => (
      <div className="space-y-0.5">
        <p className="line-clamp-1">{row.grupo ?? "—"}</p>
        {row.subgrupo && (
          <p className="text-[10px] text-muted-foreground/60 line-clamp-1">
            {row.subgrupo}
          </p>
        )}
      </div>
    ),
  },
  {
    key: "unidade_medida",
    header: "Un.",
    className: "w-16 text-center text-xs font-mono",
    render: (row) => row.unidade_medida,
  },
  {
    key: "preco_unitario",
    header: "Preço Unit.",
    className: "w-36 text-right tabular-nums font-medium",
    render: (row) => formatBRL(row.preco_unitario),
  },
  {
    key: "mes_referencia",
    header: "Referência",
    className: "w-28 text-xs text-muted-foreground",
    render: (row) => formatMesRef(row.mes_referencia),
  },
]

interface ScoPageProps {
  searchParams?: Promise<{
    q?: string
    ref?: string
    tipo?: string
    grupo?: string
  }>
}

export default async function ScoPage({ searchParams }: ScoPageProps) {
  const params = await searchParams
  const { data, error } = await getScoWithFilters({
    q: params?.q,
    ref: params?.ref,
    tipo: params?.tipo,
    grupo: params?.grupo,
  })

  const rows: ScoRow[] = error ? [] : (data ?? [])

  // Obter lista de grupos
  const grupos = await getDistinctValues("tb_sco", "grupo")

  const additionalFilters = [
    {
      name: "grupo",
      label: "Grupo",
      options: (grupos as string[]).map((g) => ({ value: g, label: g })),
    },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="SCO-Rio"
        description="Sistema de Custos de Obras — Prefeitura do Rio de Janeiro · SMO-Rio"
        actions={
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Município RJ · Mensal
            </span>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-6 space-y-4">
        <GlassPanel className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 border border-primary/25 text-primary shrink-0">
            <MapPin size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">
              Catálogo municipal do Rio de Janeiro (SMO). Referência para contratos de
              obras e serviços da Prefeitura. Organizado por grupo e subgrupo.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-semibold tabular-nums text-foreground">
              {rows.length.toLocaleString("pt-BR")}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              itens
            </p>
          </div>
        </GlassPanel>

        <CatalogFiltersForm additionalFilters={additionalFilters} />

        <CatalogTable
          data={rows}
          columns={columns}
          emptyMessage="Nenhum item SCO encontrado com estes filtros."
        />
      </main>
    </div>
  )
}
