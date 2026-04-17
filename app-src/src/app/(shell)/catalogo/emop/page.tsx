import type { Metadata } from "next"
import { Landmark } from "lucide-react"
import { TopBar } from "@/components/govtech/TopBar"
import { GlassPanel } from "@/components/govtech/GlassPanel"
import { CatalogTable, TipoBadge, type CatalogColumn } from "@/components/govtech/CatalogTable"
import { createClient } from "@/lib/supabase/server"
import { formatBRL, formatMesRef } from "@/lib/utils/format"
import type { Database } from "@/types/supabase"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = { title: "EMOP-RJ" }

type EmopRow = Database["public"]["Tables"]["tb_emop"]["Row"]

const columns: CatalogColumn<EmopRow>[] = [
  {
    key: "codigo",
    header: "Código",
    className: "w-24 font-mono text-xs text-muted-foreground",
    render: (row) => row.codigo,
  },
  {
    key: "descricao",
    header: "Descrição",
    className: "max-w-[300px]",
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
    key: "capitulo",
    header: "Capítulo",
    className: "w-44 text-xs text-muted-foreground",
    render: (row) => (
      <div className="space-y-0.5">
        <p className="line-clamp-1">{row.capitulo ?? "—"}</p>
        {row.subcapitulo && (
          <p className="text-[10px] text-muted-foreground/60 line-clamp-1">
            {row.subcapitulo}
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
  {
    key: "origem_legado",
    header: "Origem",
    className: "w-20 text-center",
    render: (row) =>
      row.origem_legado ? (
        <Badge variant="outline" className="text-[10px] border-amber-400/30 text-amber-400">
          DBF
        </Badge>
      ) : (
        <Badge variant="outline" className="text-[10px]">XLS</Badge>
      ),
  },
]

export default async function EmopPage() {
  const client = await createClient()

  const { data, error } = await client
    .from("tb_emop")
    .select("*")
    .order("mes_referencia", { ascending: false })
    .order("codigo", { ascending: true })
    .limit(100)

  const rows: EmopRow[] = error ? [] : (data ?? [])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="EMOP-RJ"
        description="Tabela de Preços EMOP — Estado do Rio de Janeiro · SEINFRA-RJ"
        actions={
          <div className="flex items-center gap-1.5">
            <Landmark size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Estado RJ · Mensal
            </span>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-6 space-y-4">
        <GlassPanel className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 border border-primary/25 text-primary shrink-0">
            <Landmark size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">
              Catálogo estadual do Rio de Janeiro. Inclui itens migrados de arquivos DBF
              legados do sistema SIPCI (identificados com badge{" "}
              <span className="text-amber-400 font-medium">DBF</span>).
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-semibold tabular-nums text-foreground">
              {rows.length.toLocaleString("pt-BR")}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              itens carregados
            </p>
          </div>
        </GlassPanel>

        <CatalogTable
          data={rows}
          columns={columns}
          emptyMessage="Nenhum item EMOP encontrado. Importe planilha XLS ou arquivo DBF legado."
        />
      </main>
    </div>
  )
}
