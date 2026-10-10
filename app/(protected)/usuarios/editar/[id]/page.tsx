import { notFound, redirect } from "next/navigation"
import { getUserAuth } from "@/app/actions/auth"
import { getUserById } from "@/app/actions/users"
import UserEditForm from "./UserEditForm"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function UserEditPage({ params }: PageProps) {
  const { data: currentUser } = await getUserAuth()

  if (!currentUser) {
    redirect("/login")
  }

  const { id } = await params
  const response = await getUserById(id)

  if (!response.success || !response.data) {
    if (response.error?.includes("permisos") || response.error?.includes("permiso")) {
      redirect("/unauthorized")
    }
    notFound()
  }

  const rawUser = response.data

  const targetUser = {
    ...rawUser,
    nombre: rawUser.nombre ?? "",
    apellido: rawUser.apellido ?? "",
    alias: rawUser.alias ?? "",
    cbuCvu: rawUser.cbuCvu ?? "",
    bancoOProveedor: rawUser.bancoOProveedor ?? "",
  }

  return (
    <div className="mx-auto max-w-4xl p-4 w-full">
      <UserEditForm 
        userData={targetUser} 
        currentUserRole={currentUser.rol} 
      />
    </div>
  )
}