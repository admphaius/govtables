import { cn } from "@/lib/utils"

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** "auto" = auto-fill minmax 280px | "12" = grid de 12 colunas fixas */
  cols?: "auto" | "12"
}

/**
 * Container de layout Bento Grid.
 * "auto": preenchimento automático (dashboard de KPIs).
 * "12": grid de 12 colunas para layouts mais precisos.
 * Use BentoCell para controlar spans individuais.
 */
export function BentoGrid({
  cols = "auto",
  className,
  children,
  ...props
}: BentoGridProps) {
  return (
    <div
      className={cn(
        cols === "auto" ? "bento-grid" : "bento-grid-12",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface BentoCellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Número de colunas que a célula ocupa (grid de 12 colunas) */
  span?: 4 | 6 | 8 | 12
}

/**
 * Célula individual do BentoGrid de 12 colunas.
 * Responsive: em mobile colapsa para span-12 automaticamente.
 */
export function BentoCell({ span = 6, className, children, ...props }: BentoCellProps) {
  const spanClass = {
    4:  "bento-col-4  max-md:bento-col-12",
    6:  "bento-col-6  max-md:bento-col-12",
    8:  "bento-col-8  max-md:bento-col-12",
    12: "bento-col-12",
  }[span]

  return (
    <div className={cn(spanClass, className)} {...props}>
      {children}
    </div>
  )
}
