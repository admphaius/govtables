import type { Metadata } from "next"
import { Building2 } from "lucide-react"
import { TopBar } from "@/components/govtech/TopBar"
import { GlassPanel } from "@/components/govtech/GlassPanel"
import { CatalogTable, TipoBadge, type CatalogColumn } from "@/components/govtech/CatalogTable"
import { CatalogFiltersForm } from "@/components/govtech/CatalogFiltersForm"
import { getSinapiWithFilters, getDistinctValues } from "@/lib/supabase/queries/catalog-filters"
import { formatBRL, formatMesRef } from "@/lib/utils/format"
import type { Database } from "@/types/supabase"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = { title: "SINAPI" }

type SinapiRow = Database["public"]["Tables"]["tb_sinapi"]["Row"]

const columns: CatalogColumn<SinapiRow>[] = [
  {
    key: "codigo",
    header: "Código",
    className: "w-24 font-mono text-xs text-muted-foreground",
    render: (row) => row.codigo,
  },
  {
    key: "descricao",
    header: "Descrição",
    className: "max-w-[340px]",
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
    key: "classe",
    header: "Classe",
    className: "w-36 text-xs text-muted-foreground",
    render: (row) => row.classe ?? "—",
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
    key: "estado_uf",
    header: "UF",
    className: "w-12 text-center",
    render: (row) => (
      <Badge variant="outline" className="text-[10px] font-mono">
        {row.estado_uf}
      </Badge>
    ),
  },
  {
    key: "mes_referencia",
    header: "Referência",
    className: "w-28 text-xs text-muted-foreground",
    render: (row) => formatMesRef(row.mes_referencia),
  },
  {
    key: "is_onerado",
    header: "Regime",
    className: "w-24 text-xs",
    render: (row) => (
      <span className={row.is_onerado ? "text-foreground" : "text-amber-400"}>
        {row.is_onerado ? "Onerado" : "Desonerado"}
      </span>
    ),
  },
]

interface SinapiPageProps {
  searchParams?: Promise<{
    q?: string
    ref?: string
    tipo?: string
    uf?: string
    onerado?: string
  }>
}

export default async function SinapiPage({ searchParams }: SinapiPageProps) {
  const params = await searchParams
  const { data, error } = await getSinapiWithFilters({
    q: params?.q,
    ref: params?.ref,
    tipo: params?.tipo,
    uf: params?.uf,
    onerado: params?.onerado as "true" | "false" | null,
  })

  const rows: SinapiRow[] = error ? [] : (data ?? [])

  // Obter lista de UFs para o filtro
  const ufs = await getDistinctValues("tb_sinapi", "estado_uf")
  const ufOptions = (ufs as string[]).map((uf) => ({ value: uf, label: uf }))

  const additionalFilters = [
    {
      name: "uf",
      label: "UF",
      options: ufOptions,
    },
    {
      name: "onerado",
      label: "Regime",
      options: [
        { value: "true", label: "Onerado" },
        { value: "false", label: "Desonerado" },
      ],
    },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="SINAPI"
        description="Sistema Nacional de Pesquisa de Custos e Índices da Construção Civil · CEF / IBGE"
        actions={
          <div className="flex items-center gap-1.5">
            <Building2 size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Nacional · Mensal
            </span>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-6 space-y-4">
        {/* Cabeçalho */}
        <GlassPanel className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 border border-primary/25 text-primary shrink-0">
            <Building2 size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">
              Catálogo nacional de insumos e composições analíticas para edificações e
              infraestrutura. Referência obrigatória em contratos federais e estaduais.
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

        {/* Filtros */}
        <CatalogFiltersForm additionalFilters={additionalFilters} />

        {/* Tabela */}
        <CatalogTable
          data={rows}
          columns={columns}
          emptyMessage="Nenhum item SINAPI encontrado com estes filtros."
        />
      </main>
    </div>
  )
}
