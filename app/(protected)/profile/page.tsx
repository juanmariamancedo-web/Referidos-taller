"use server"

import { getUserAuth } from "@/app/actions/auth"
import ProfileForm from "@/app/(protected)/profile/ProfileForm"

export default async function ProfilePage() {
  // Obtención del usuario en el servidor
  const { data: userData } = await getUserAuth()

  return (
    <div className="mx-auto max-w-4xl w-full">
      <ProfileForm userData={userData} />
    </div>
  )
}