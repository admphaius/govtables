import { redirect } from "next/navigation"

/** Rota raiz: redireciona para o dashboard principal */
export default function RootPage() {
  redirect("/dashboard")
}
