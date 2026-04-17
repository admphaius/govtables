"use client"

import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "./Sidebar"

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu size={18} />
      </SheetTrigger>
      <SheetContent side="left" className="w-55 p-0">
        <Sidebar className="h-full w-full rounded-none border-r-0" />
      </SheetContent>
    </Sheet>
  )
}
