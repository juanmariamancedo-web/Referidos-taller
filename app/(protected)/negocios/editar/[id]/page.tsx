"use server"

import { notFound, redirect } from "next/navigation"
import { getUserAuth } from "@/app/actions/auth"
import { getBusinessById } from "@/app/actions/business"
import EditBusinessForm from "./EditBusinessForm"

interface EditBusinessPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditBusinessPage({ params }: EditBusinessPageProps) {
  // 1. Obtención y verificación de permisos del usuario (Rango Admin)
  const { data: user } = await getUserAuth()

  if (!user || user.rol !== "ADMIN") {
    redirect("/negocios")
  }

  // 2. Extraer el ID desde los parámetros de la URL
  const { id } = await params

  // 3. Obtención de datos del negocio en el servidor
  const { success, data: business } = await getBusinessById(id)

  if (!success || !business) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-4xl p-6 w-full">
      {/* Encabezado */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Editar Negocio
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Modifica la información y configuración general del negocio.
          </p>
        </div>
      </div>

      {/* Formulario Cliente con los datos precargados */}
      <EditBusinessForm business={business} />
    </div>
  )
}