import type { Metadata } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "GovTables",
    template: "%s | GovTables",
  },
  description:
    "Plataforma de inteligência de dados para orçamentação de obras públicas — SINAPI, SICRO, EMOP e SCO-Rio.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${geistMono.variable} dark h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground antialiased">
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}
