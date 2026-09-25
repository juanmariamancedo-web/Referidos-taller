import { notFound, redirect } from "next/navigation"
import { getUserAuth } from "@/app/actions/auth"
import { getUserById } from "@/app/actions/users" // Importa tu Server Action
import ProfileForm from "@/app/usuarios/editar/ProfileForm"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function UserEditPage({ params }: PageProps) {
  // 1. Obtener usuario en sesión
  const { data: currentUser } = await getUserAuth()

  if (!currentUser) {
    redirect("/login")
  }

  const { id } = await params

  // 2. Obtener los datos llamando a la Server Action (que centraliza Prisma y las reglas de rol/negocio)
  const response = await getUserById(id)

  // Si la action falló o denegó el acceso por permisos/negocio
  if (!response.success || !response.data) {
    if (response.error?.includes("permisos") || response.error?.includes("permiso")) {
      redirect("/unauthorized")
    }
    notFound()
  }

  const targetUser = response.data

  return (
    <div className="mx-auto max-w-4xl p-6 w-full">
      {/* Encabezado */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Editar Usuario
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Modificando información de {targetUser.nombre ?? "Usuario"} ({targetUser.email})
          </p>
        </div>
      </div>

      {/* Formulario Cliente */}
      <ProfileForm 
        userData={targetUser} 
        currentUserRol={currentUser.rol} 
      />
    </div>
  )
}