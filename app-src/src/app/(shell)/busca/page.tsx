import type { Metadata } from "next"
import { Sparkles } from "lucide-react"
import { TopBar } from "@/components/govtech/TopBar"
import { SearchPanel } from "./_components/SearchPanel"

export const metadata: Metadata = { title: "Busca Semântica" }

export default function BuscaPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Busca Semântica"
        description="Pesquise serviços e insumos em todos os catálogos por linguagem natural"
        actions={
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-accent" />
            <span className="text-xs text-muted-foreground hidden sm:inline">
              pgvector · text-embedding-3-small
            </span>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-6">
        <SearchPanel />
      </main>
    </div>
  )
}
