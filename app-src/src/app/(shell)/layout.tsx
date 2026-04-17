import { Sidebar } from "@/components/govtech/Sidebar"

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — visível apenas em desktop */}
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar />
      </div>

      {/* Área de conteúdo principal */}
      <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
