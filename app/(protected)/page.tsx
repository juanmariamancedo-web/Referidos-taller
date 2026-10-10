"use server"

import { getUserAuth } from "@/app/actions/auth"
import AdminDashboard from "@/app/components/AdminDashboard"
import ManagerDashboard from "@/app/components/ManagerDashboard"
import SellerDashboard from "@/app/components/SellerDashboard"

export default async function MainPage() {
  const { data: userData } = await getUserAuth()

  // Si por alguna razón no hay rol, definimos un fallback o vendedor por defecto
  const role = userData?.rol?.toLowerCase() || "seller"

  return (
    <div className="space-y-6">
      {role === "admin" && <AdminDashboard userData={userData} />}
      {role === "gerente" && <ManagerDashboard userData={userData} />}
      {role !== "admin" && role !== "gerente" && <SellerDashboard userData={userData} />}
    </div>
  )
}