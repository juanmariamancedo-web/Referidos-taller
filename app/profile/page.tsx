"use server"

import { getUserAuth } from "@/app/actions/auth"
import ProfileForm from "@/app/profile/ProfileForm"

export default async function ProfilePage() {
  // Obtención del usuario en el servidor
  const { data: userData } = await getUserAuth()

  return (
    <div className="mx-auto max-w-4xl p-6 w-full">
      {/* Encabezado */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Perfil</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Modifica tu usuario.
          </p>
        </div>
      </div>

      {/* Formulario Cliente */}
      <ProfileForm 
        userData={userData} 
      />
    </div>
  )
}