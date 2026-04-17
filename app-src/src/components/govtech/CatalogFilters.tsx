import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FilterOption {
  value: string
  label: string
}

interface CatalogFiltersProps {
  /** Valor atual da busca */
  search?: string
  /** Valor atual do mês de referência (YYYY-MM-DD) */
  mesRef?: string
  /** Valor atual do tipo (insumo/composicao_analitica) */
  tipo?: string
  /** Filtros adicionais específicos do catálogo */
  additionalFilters?: {
    name: string
    value?: string
    label: string
    placeholder?: string
    options?: FilterOption[]
  }[]
  /** Callback quando filtros mudam */
  onFilterChange: (filters: Record<string, string | null>) => void
  /** Se está carregando */
  isLoading?: boolean
}

/** Componente de filtros genérico para páginas de catálogo */
export function CatalogFilters({
  search = "",
  mesRef = "",
  tipo = "",
  additionalFilters = [],
  onFilterChange,
  isLoading = false,
}: CatalogFiltersProps) {
  const handleReset = () => {
    onFilterChange({
      search: null,
      mesRef: null,
      tipo: null,
      ...Object.fromEntries(additionalFilters.map((f) => [f.name, null])),
    })
  }

  const hasFilters = search || mesRef || tipo || additionalFilters.some((f) => f.value)

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {/* Busca por código/descrição */}
        <div className="lg:col-span-2">
          <Input
            placeholder="Código ou descrição..."
            value={search}
            onChange={(e) => onFilterChange({ search: e.target.value || null })}
            className="h-8 text-sm"
            disabled={isLoading}
          />
        </div>

        {/* Mês de referência */}
        <div>
          <Select value={mesRef ?? ""} onValueChange={(v) => onFilterChange({ mesRef: v || null })}>
            <SelectTrigger className="h-8 text-sm" disabled={isLoading}>
              <SelectValue placeholder="Referência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os meses</SelectItem>
              {/* Gerará dinamicamente na página — placeholder */}
              <SelectItem value="2025-01">jan/2025</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tipo de item */}
        <div>
          <Select value={tipo ?? ""} onValueChange={(v) => onFilterChange({ tipo: v || null })}>
            <SelectTrigger className="h-8 text-sm" disabled={isLoading}>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os tipos</SelectItem>
              <SelectItem value="insumo">Insumo</SelectItem>
              <SelectItem value="composicao_analitica">Composição</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtros adicionais específicos do catálogo */}
        {additionalFilters.map((filter) => (
          <div key={filter.name}>
            {filter.options ? (
              <Select
                value={filter.value ?? ""}
                onValueChange={(v) => onFilterChange({ [filter.name]: v || null })}
              >
                <SelectTrigger className="h-8 text-sm" disabled={isLoading}>
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {filter.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder={filter.placeholder ?? filter.label}
                value={filter.value ?? ""}
                onChange={(e) => onFilterChange({ [filter.name]: e.target.value || null })}
                className="h-8 text-sm"
                disabled={isLoading}
              />
            )}
          </div>
        ))}
      </div>

      {/* Botão de limpar filtros */}
      {hasFilters && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 text-xs"
            disabled={isLoading}
          >
            <X size={12} className="mr-1" />
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  )
}
