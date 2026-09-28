import { getUserAuth } from "@/app/actions/auth"
import { notFound } from "next/navigation"
import { Rol } from "@prisma/client"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. Validar autenticación primero
  const { data } = await getUserAuth()

  if(data?.rol !== Rol.NO_VERIFICADO) {
    notFound()
  }

  return (
    <>
        {children}
    </>
  )
}