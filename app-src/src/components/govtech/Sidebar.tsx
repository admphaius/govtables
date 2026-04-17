"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Truck,
  Landmark,
  MapPin,
  GitCompare,
  Upload,
  ChevronRight,
  Database,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: string
  disabled?: boolean
}

interface NavSection {
  title?: string
  items: NavItem[]
}

const navigation: NavSection[] = [
  {
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard size={16} />,
      },
    ],
  },
  {
    title: "Catálogos",
    items: [
      {
        href: "/catalogo/sinapi",
        label: "SINAPI",
        icon: <Building2 size={16} />,
        badge: "CEF/IBGE",
      },
      {
        href: "/catalogo/sicro",
        label: "SICRO",
        icon: <Truck size={16} />,
        badge: "DNIT",
      },
      {
        href: "/catalogo/emop",
        label: "EMOP-RJ",
        icon: <Landmark size={16} />,
        badge: "Estado RJ",
      },
      {
        href: "/catalogo/sco",
        label: "SCO-Rio",
        icon: <MapPin size={16} />,
        badge: "Município RJ",
      },
    ],
  },
  {
    title: "Ferramentas",
    items: [
      {
        href: "/busca",
        label: "Busca Semântica",
        icon: <Sparkles size={16} />,
      },
      {
        href: "/comparativo",
        label: "Comparativo",
        icon: <GitCompare size={16} />,
        disabled: true,
      },
      {
        href: "/ingest",
        label: "Ingestão",
        icon: <Upload size={16} />,
        disabled: true,
      },
    ],
  },
]

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

  if (item.disabled) {
    return (
      <div className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground/40 cursor-not-allowed select-none">
        <span className="shrink-0 opacity-50">{item.icon}</span>
        <span className="flex-1 truncate">{item.label}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider opacity-40">
          em breve
        </span>
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-all duration-150",
        isActive
          ? "bg-primary/15 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-white/5",
      )}
    >
      <span
        className={cn(
          "shrink-0 transition-colors",
          isActive ? "text-primary" : "group-hover:text-foreground",
        )}
      >
        {item.icon}
      </span>

      <span className="flex-1 truncate">{item.label}</span>

      {item.badge && !isActive && (
        <span className="text-[10px] font-medium text-muted-foreground/60 truncate hidden xl:block">
          {item.badge}
        </span>
      )}

      {isActive && (
        <ChevronRight size={12} className="text-primary shrink-0" />
      )}
    </Link>
  )
}

export function Sidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "glass-panel-heavy flex h-full w-[220px] shrink-0 flex-col",
        "border-r border-border",
        className,
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/20 border border-primary/30">
          <Database size={14} className="text-primary" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold text-govtech-gradient">
            GovTables
          </span>
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            Orçamento Público
          </span>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {navigation.map((section, i) => (
          <div key={i} className="space-y-0.5">
            {section.title && (
              <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                {section.title}
              </p>
            )}
            {section.items.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        ))}
      </nav>

      {/* Rodapé */}
      <div className="border-t border-border px-4 py-3">
        <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
          Dados públicos. Uso livre.
          <br />
          Referências: CEF · DNIT · EMOP · SMO
        </p>
      </div>
    </aside>
  )
}
