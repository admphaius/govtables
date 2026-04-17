import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface CatalogColumn<T> {
  key: string
  header: string
  className?: string
  render: (row: T) => React.ReactNode
}

interface CatalogTableProps<T> {
  data: T[]
  columns: CatalogColumn<T>[]
  emptyMessage?: string
}

/**
 * Tabela genérica de catálogo.
 * Aceita colunas tipadas para cada sistema (SINAPI, SICRO, EMOP, SCO).
 */
export function CatalogTable<T extends { id: string }>({
  data,
  columns,
  emptyMessage = "Nenhum item encontrado.",
}: CatalogTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 py-16 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        <p className="text-xs text-muted-foreground/60">
          Importe dados via Ingestão para visualizá-los aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 whitespace-nowrap",
                    col.className,
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={row.id}
                className="border-border hover:bg-white/3 transition-colors"
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn("py-2.5 text-sm", col.className)}
                  >
                    {col.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

/** Badge padronizado para tipo de item */
export function TipoBadge({ tipo }: { tipo: string | null }) {
  if (!tipo) return <span className="text-muted-foreground">—</span>
  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-[10px] font-medium uppercase tracking-wider",
        tipo === "insumo"
          ? "bg-primary/10 text-primary border-primary/20"
          : "bg-accent/10 text-accent border-accent/20",
      )}
    >
      {tipo === "insumo" ? "Insumo" : "Composição"}
    </Badge>
  )
}
