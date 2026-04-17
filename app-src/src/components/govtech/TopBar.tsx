import { MobileSidebar } from "./MobileSidebar"

interface TopBarProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

/**
 * Barra superior das páginas.
 * - Mobile: exibe hamburger para abrir Sidebar via Sheet
 * - Desktop: exibe título e ações da página
 */
export function TopBar({ title, description, actions }: TopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {/* Botão de menu — visível apenas em mobile */}
        <MobileSidebar />

        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-foreground truncate">
            {title}
          </h1>
          {description && (
            <p className="text-xs text-muted-foreground truncate hidden sm:block">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex shrink-0 items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  )
}
