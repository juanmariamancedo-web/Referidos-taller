import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getUserAuth } from "@/app/actions/auth"
import { getUserById } from "@/app/actions/users"
import ProfileForm from "@/app/(protected)/usuarios/editar/ProfileForm"

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

  // 2. Obtener los datos llamando a la Server Action
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Editar Usuario
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Modificando información de {targetUser.nombre ?? "Usuario"} ({targetUser.email})
        </p>
      </div>

      {/* Formulario Cliente y sección inferior */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <ProfileForm 
          userData={targetUser} 
          currentUserRol={currentUser.rol} 
        />

        {/* Separador */}
        <hr className="my-6 border-slate-200 dark:border-slate-800" />

        {/* Sección de Cupones */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Cupones del usuario
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Consulta y gestiona todos los cupones asociados a este usuario.
            </p>
          </div>

          <Link
            href={`/cupones?userId=${targetUser.id}`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            Ver cupones de este usuario &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}