import { cn } from "@/lib/utils"

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** "default" = blur 12px | "heavy" = blur 20px (sidebar, modais) */
  variant?: "default" | "heavy"
  /** Aplica glow sutil Baltic Blue na borda */
  glow?: "baltic" | "accent" | "none"
}

/**
 * Painel base do Design System GovTables.
 * Glassmorphism: backdrop-filter blur + borda semi-transparente.
 * Uso: cards de catálogo, KPIs, modais, painéis laterais.
 */
export function GlassPanel({
  variant = "default",
  glow = "none",
  className,
  children,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        "rounded-lg",
        variant === "default" ? "glass-panel" : "glass-panel-heavy",
        glow === "baltic" && "glow-baltic",
        glow === "accent"  && "glow-accent",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
