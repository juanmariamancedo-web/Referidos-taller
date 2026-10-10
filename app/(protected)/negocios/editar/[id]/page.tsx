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

  // 4. Serializar los campos Decimal de Prisma a Number o Primitive Types
  const serializedBusiness = {
    ...business,
    valorDescuentoDefault: business.valorDescuentoDefault ? Number(business.valorDescuentoDefault) : null,
    montoComisionDefault: business.montoComisionDefault ? Number(business.montoComisionDefault) : null,
    porcentajeFee: business.porcentajeFee ? Number(business.porcentajeFee) : null,
  }

  return (
    <div className="mx-auto max-w-4xl p-4 w-full">
      {/* Formulario Cliente con los datos precargados y serializados */}
      <EditBusinessForm business={serializedBusiness} />
    </div>
  )
}