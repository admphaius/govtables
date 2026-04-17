import type { Metadata } from "next"
import Link from "next/link"
import {
  Building2, Truck, Landmark, MapPin,
  ArrowRight, Database, RefreshCw,
} from "lucide-react"
import { TopBar } from "@/components/govtech/TopBar"
import { KPICard } from "@/components/govtech/KPICard"
import { GlassPanel } from "@/components/govtech/GlassPanel"
import { BentoGrid } from "@/components/govtech/BentoGrid"
import { getDashboardStats } from "@/lib/supabase/queries/catalog-stats"
import { formatCount, formatMesRef } from "@/lib/utils/format"

export const metadata: Metadata = { title: "Dashboard" }

const catalogMeta = {
  sinapi: {
    label: "SINAPI",
    description: "Sistema Nacional de Pesquisa de Custos e Índices",
    href: "/catalogo/sinapi",
    icon: <Building2 size={16} />,
    org: "CEF / IBGE",
    scope: "Nacional",
    variant: "baltic" as const,
  },
  sicro: {
    label: "SICRO",
    description: "Sistema de Custos Referenciais de Obras",
    href: "/catalogo/sicro",
    icon: <Truck size={16} />,
    org: "DNIT",
    scope: "Nacional",
    variant: "default" as const,
  },
  emop: {
    label: "EMOP-RJ",
    description: "Tabela de Preços EMOP — Estado do Rio de Janeiro",
    href: "/catalogo/emop",
    icon: <Landmark size={16} />,
    org: "EMOP / SEINFRA-RJ",
    scope: "Estado RJ",
    variant: "default" as const,
  },
  sco: {
    label: "SCO-Rio",
    description: "Sistema de Custos de Obras — Prefeitura do Rio",
    href: "/catalogo/sco",
    icon: <MapPin size={16} />,
    org: "SMO-Rio",
    scope: "Município RJ",
    variant: "default" as const,
  },
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  const total =
    stats.sinapi.total + stats.sicro.total + stats.emop.total + stats.sco.total

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Dashboard"
        description="Visão consolidada dos catálogos de preços públicos"
      />

      <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-6 space-y-8">

        {/* Header de boas-vindas */}
        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-govtech-gradient mb-1">
            GovTables
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl">
            Plataforma de inteligência de dados para orçamentação de obras públicas.
            Consulte, compare e exporte preços referenciais de{" "}
            <span className="text-foreground font-medium">4 sistemas oficiais</span>.
          </p>
        </section>

        {/* KPI — totalizadores */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            Visão Geral
          </h3>

          <BentoGrid cols="auto">
            <KPICard
              label="Total de Itens"
              value={formatCount(total)}
              icon={<Database size={16} />}
              description="Todos os catálogos"
              variant={total > 0 ? "baltic" : "default"}
            />
            <KPICard
              label="SINAPI"
              value={formatCount(stats.sinapi.total)}
              icon={<Building2 size={16} />}
              description={
                stats.sinapi.lastRef
                  ? `Ref: ${formatMesRef(stats.sinapi.lastRef)}`
                  : "Sem dados"
              }
            />
            <KPICard
              label="SICRO"
              value={formatCount(stats.sicro.total)}
              icon={<Truck size={16} />}
              description={
                stats.sicro.lastRef
                  ? `Ref: ${formatMesRef(stats.sicro.lastRef)}`
                  : "Sem dados"
              }
            />
            <KPICard
              label="EMOP-RJ"
              value={formatCount(stats.emop.total)}
              icon={<Landmark size={16} />}
              description={
                stats.emop.lastRef
                  ? `Ref: ${formatMesRef(stats.emop.lastRef)}`
                  : "Sem dados"
              }
            />
            <KPICard
              label="SCO-Rio"
              value={formatCount(stats.sco.total)}
              icon={<MapPin size={16} />}
              description={
                stats.sco.lastRef
                  ? `Ref: ${formatMesRef(stats.sco.lastRef)}`
                  : "Sem dados"
              }
            />
          </BentoGrid>
        </section>

        {/* Cards de acesso rápido aos catálogos */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            Catálogos
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(Object.keys(catalogMeta) as Array<keyof typeof catalogMeta>).map(
              (key) => {
                const meta = catalogMeta[key]
                const stat = stats[key]
                return (
                  <Link key={key} href={meta.href} className="group">
                    <GlassPanel className="flex flex-col gap-4 p-5 h-full transition-all duration-200 hover:border-primary/30 hover:bg-white/5">
                      {/* Cabeçalho do card */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
                          {meta.icon}
                        </div>
                        <ArrowRight
                          size={14}
                          className="text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1"
                        />
                      </div>

                      {/* Nome e descrição */}
                      <div className="space-y-0.5 flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {meta.label}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {meta.description}
                        </p>
                      </div>

                      {/* Metadados */}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div>
                          <p className="text-[11px] text-muted-foreground/60">
                            {meta.org}
                          </p>
                          <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">
                            {meta.scope}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold tabular-nums text-foreground">
                            {formatCount(stat.total)}
                          </p>
                          <p className="text-[10px] text-muted-foreground/50">
                            {stat.total === 1 ? "item" : "itens"}
                          </p>
                        </div>
                      </div>
                    </GlassPanel>
                  </Link>
                )
              }
            )}
          </div>
        </section>

        {/* Estado de ingestão */}
        {total === 0 && (
          <section>
            <GlassPanel className="flex items-center gap-4 p-5 border-dashed">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/50">
                <RefreshCw size={18} className="text-muted-foreground/60" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Aguardando ingestão de dados
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Os catálogos estão vazios. Utilize a área de Ingestão para
                  carregar planilhas XLS, arquivos DBF ou conectar à API do
                  SINAPI.
                </p>
              </div>
            </GlassPanel>
          </section>
        )}
      </main>
    </div>
  )
}
