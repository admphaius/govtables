"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { CatalogFilters, type FilterOption } from "./CatalogFilters"

interface CatalogFiltersFormProps {
  additionalFilters?: {
    name: string
    label: string
    placeholder?: string
    options?: FilterOption[]
  }[]
}

/**
 * Wrapper de CatalogFilters que integra com Next.js Router.
 * Atualiza a URL via searchParams quando filtros mudam.
 */
export function CatalogFiltersForm({
  additionalFilters = [],
}: CatalogFiltersFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isLoading = false // futuro: adicionar loading state

  const search = searchParams.get("q") ?? ""
  const mesRef = searchParams.get("ref") ?? ""
  const tipo = searchParams.get("tipo") ?? ""

  const handleFilterChange = (filters: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams)

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        const paramKey =
          key === "search"
            ? "q"
            : key === "mesRef"
              ? "ref"
              : key
        params.set(paramKey, value)
      } else {
        const paramKey =
          key === "search"
            ? "q"
            : key === "mesRef"
              ? "ref"
              : key
        params.delete(paramKey)
      }
    })

    router.push(`?${params.toString()}`)
  }

  const additionalFilterValues = additionalFilters.map((f) => ({
    ...f,
    value: searchParams.get(f.name) ?? "",
  }))

  return (
    <CatalogFilters
      search={search}
      mesRef={mesRef}
      tipo={tipo}
      additionalFilters={additionalFilterValues}
      onFilterChange={handleFilterChange}
      isLoading={isLoading}
    />
  )
}
