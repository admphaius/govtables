import { cn } from "@/lib/utils"
import { GlassPanel } from "./GlassPanel"

type KPITrend = "up" | "down" | "neutral"
type KPIVariant = "default" | "baltic" | "accent" | "warning" | "danger"

interface KPICardProps {
  /** Rótulo descritivo do indicador */
  label: string
  /** Valor principal (ex: "R$ 1.234,56" ou "12.847") */
  value: string
  /** Variação percentual opcional (ex: "+2,3%") */
  delta?: string
  /** Direção da variação */
  trend?: KPITrend
  /** Ícone React opcional (Lucide recomendado, 20px) */
  icon?: React.ReactNode
  /** Subtexto descritivo (ex: "Referência: Jan/2025 · RJ") */
  description?: string
  /** Variante visual */
  variant?: KPIVariant
  className?: string
}

const variantStyles: Record<KPIVariant, string> = {
  default: "",
  baltic:  "glow-baltic border-govtech-pulse",
  accent:  "glow-accent  border-govtech-pulse",
  warning: "border border-amber-400/30 shadow-amber-400/10 shadow-lg",
  danger:  "border border-destructive/30  shadow-destructive/10 shadow-lg",
}

const trendStyles: Record<KPITrend, string> = {
  up:      "text-emerald-400",
  down:    "text-rose-400",
  neutral: "text-muted-foreground",
}

const trendSymbol: Record<KPITrend, string> = {
  up: "↑", down: "↓", neutral: "→",
}

/**
 * Card de KPI para o dashboard GovTables.
 * Exibe métrica principal, variação, ícone e descrição contextual.
 * Suporta variantes visuais para chamar atenção em dados críticos.
 */
export function KPICard({
  label,
  value,
  delta,
  trend = "neutral",
  icon,
  description,
  variant = "default",
  className,
}: KPICardProps) {
  return (
    <GlassPanel
      className={cn(
        "flex flex-col gap-3 p-5",
        variantStyles[variant],
        className,
      )}
    >
      {/* Header: rótulo + ícone */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {icon && (
          <span className="text-muted-foreground opacity-70">
            {icon}
          </span>
        )}
      </div>

      {/* Valor principal */}
      <p className="text-2xl font-semibold tabular-nums leading-none tracking-tight text-foreground">
        {value}
      </p>

      {/* Delta + descrição */}
      <div className="flex items-center justify-between gap-2">
        {delta && (
          <span className={cn("text-xs font-medium tabular-nums", trendStyles[trend])}>
            {trendSymbol[trend]} {delta}
          </span>
        )}
        {description && (
          <span className="text-xs text-muted-foreground truncate">
            {description}
          </span>
        )}
      </div>
    </GlassPanel>
  )
}
