"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { updateUser } from "@/app/actions/users"
import { Rol } from "@prisma/client"

export interface UserData {
  id: string
  nombre: string
  apellido: string
  email: string
  rol: Rol
  activo?: boolean
  alias?: string | null
  cbuCvu?: string | null
  bancoOProveedor?: string | null
}

interface UserEditFormProps {
  userData: UserData
  currentUserRole: Rol // Rol del usuario autenticado que está realizando la edición
}

export default function UserEditForm({ userData, currentUserRole }: UserEditFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Estado local del formulario (incluye los datos de cobro personales)
  const [formData, setFormData] = useState({
    nombre: userData.nombre || "",
    apellido: userData.apellido || "",
    rol: userData.rol || Rol.VENDEDOR,
    activo: userData.activo ?? true,
    alias: userData.alias || "",
    cbuCvu: userData.cbuCvu || "",
    bancoOProveedor: userData.bancoOProveedor || "",
  })

  // Estado de errores y notificaciones
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Determinar los roles permitidos según el usuario autenticado
  const isManager = currentUserRole === Rol.GERENTE

  // Opciones de roles disponibles (sin la opción cliente)
  const availableRoles: { value: Rol; label: string }[] = isManager
    ? [
        { value: Rol.GERENTE, label: "Gerente" },
        { value: Rol.VENDEDOR, label: "Vendedor" },
      ]
    : [
        { value: Rol.ADMIN, label: "Administrador" },
        { value: Rol.GERENTE, label: "Gerente" },
        { value: Rol.VENDEDOR, label: "Vendedor" },
      ]

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value

    setFormData((prev) => ({ ...prev, [name]: val }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrs = { ...prev }
        delete newErrs[name]
        return newErrs
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setServerError(null)
    setSuccessMessage(null)

    startTransition(async () => {
      const res = await updateUser(userData.id, formData)

      if (res.success) {
        setSuccessMessage("Usuario y datos de cobro actualizados correctamente.")
        router.refresh()
      } else {
        if (res.errors) setErrors(res.errors)
        if (res.error) setServerError(res.error)
      }
    })
  }

  return (
    <div className="mx-auto max-w-2xl p-6 w-full">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
          Editar Usuario
        </h2>

        {/* Mensajes de notificación */}
        {serverError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 text-xs rounded-lg">
            {serverError}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 text-xs rounded-lg">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seccion 1: Datos Personales */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Datos Personales
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300"
                />
                {errors.nombre && (
                  <p className="text-xs text-rose-500 mt-1">{errors.nombre}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300"
                />
                {errors.apellido && (
                  <p className="text-xs text-rose-500 mt-1">{errors.apellido}</p>
                )}
              </div>
            </div>

            {/* Email con enlace a verificación */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Correo Electrónico
                </label>
                <Link
                  href={`/usuarios/${userData.id}/cambiar-email`}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 hover:underline transition-colors"
                >
                  Solicitar cambio de email →
                </Link>
              </div>
              <input
                type="email"
                value={userData.email}
                disabled
                readOnly
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Seccion 2: Datos de Cobro / Transferencia */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Datos de Cobro Personales (Vendedor)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Datos bancarios o de billeteras virtuales utilizados para recibir transferencias.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Alias
                </label>
                <input
                  type="text"
                  name="alias"
                  value={formData.alias}
                  onChange={handleChange}
                  placeholder="ej. mi.alias.mp"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300"
                />
                {errors.alias && (
                  <p className="text-xs text-rose-500 mt-1">{errors.alias}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Banco o Proveedor
                </label>
                <input
                  type="text"
                  name="bancoOProveedor"
                  value={formData.bancoOProveedor}
                  onChange={handleChange}
                  placeholder="ej. Mercado Pago, Banco Nación..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300"
                />
                {errors.bancoOProveedor && (
                  <p className="text-xs text-rose-500 mt-1">{errors.bancoOProveedor}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                CBU / CVU
              </label>
              <input
                type="text"
                name="cbuCvu"
                value={formData.cbuCvu}
                onChange={handleChange}
                placeholder="22 dígitos numéricos"
                maxLength={22}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300"
              />
              {errors.cbuCvu && (
                <p className="text-xs text-rose-500 mt-1">{errors.cbuCvu}</p>
              )}
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Seccion 3: Rol y Estado */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Permisos y Cuenta
            </h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Rol del Usuario
              </label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300"
              >
                {availableRoles.map((roleOpt) => (
                  <option key={roleOpt.value} value={roleOpt.value}>
                    {roleOpt.label}
                  </option>
                ))}
              </select>
              {isManager && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Como Gerente, solo tienes permisos para asignar los roles de Gerente o Vendedor.
                </p>
              )}
              {errors.rol && (
                <p className="text-xs text-rose-500 mt-1">{errors.rol}</p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <input
                type="checkbox"
                id="activo"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-950 dark:border-slate-700 dark:bg-slate-800"
              />
              <label htmlFor="activo" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                Usuario Activo
              </label>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-colors"
            >
              {isPending ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}