import { getUserAuth } from "@/app/actions/auth"
import { redirect } from "next/navigation"
import { Header } from "../components/Header/HeaderAdminPanel"
import { Page } from "@/lib/types/page"
import { cookies } from "next/headers"
import { Rol } from "@prisma/client"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. Validar autenticación primero
  const { success, data } = await getUserAuth()

  if (!success || !data) {
    redirect("/login")
  }else if(data.rol == Rol.NO_VERIFICADO) {
    redirect("/verificar-usuario")
  }

  // 2. Leer cookies de forma asíncrona
  const cookieStore = await cookies()
  const theme = cookieStore.get("theme")?.value || "light"
  const isDark = theme === "dark"

  // 3. Construir páginas dinámicas según el rol de forma limpia
  const adminPages: Page[] = [{name: "Cupones", href: "/cupones"}]

  if (data.rol === Rol.ADMIN) {
    adminPages.push(
      { name: "Negocios", href: "/negocios" },
      { name: "Usuarios", href: "/usuarios" },
    )
  }

  if (data.rol === Rol.GERENTE) {
    adminPages.push(
      { name: "Usuarios", href: "/usuarios" },
    )
  }

  return (
    <>
      <Header pages={adminPages} homeUrl="/" isDark={isDark} />
      <main className="container mx-auto pt-14 px-4">
        {children}
      </main>
    </>
  )
}