"use server"

import { getUserAuth } from "@/app/actions/auth"
import { getDashboardData } from "@/app/actions/dashboard"
import AdminDashboard from "@/app/components/AdminDashboard"
import ManagerDashboard from "@/app/components/ManagerDashboard"
import SellerDashboard from "@/app/components/SellerDashboard"

export default async function MainPage() {
  // 1. Obtención del usuario autenticado en el servidor
  const { data: userData } = await getUserAuth()

  // Normalizamos el rol (ADMIN, GERENTE, VENDEDOR)
  const rol = userData?.rol ? String(userData.rol).toUpperCase() : "VENDEDOR"

  // 2. Consulta de datos del dashboard según el rol y credenciales del usuario
  const response = await getDashboardData(
    rol, 
    userData?.id, 
    userData?.negocioId ?? undefined
  )
  
  const dashboardData = response.success ? response.data : null

  // 3. Renderizado condicional según el rol
  return (
    <div className="w-full">
      {rol === "ADMIN" && (
        <AdminDashboard userData={userData} data={dashboardData} />
      )}
      {rol === "GERENTE" && (
        <ManagerDashboard userData={userData} data={dashboardData} />
      )}
      {rol !== "ADMIN" && rol !== "GERENTE" && (
        <SellerDashboard userData={userData} data={dashboardData} />
      )}
    </div>
  )
}