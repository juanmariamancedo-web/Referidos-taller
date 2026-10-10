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
  currentUserRole: Rol
}

export default function UserEditForm({ userData, currentUserRole }: UserEditFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState({
    nombre: userData.nombre || "",
    apellido: userData.apellido || "",
    rol: userData.rol || Rol.VENDEDOR,
    activo: userData.activo ?? true,
    alias: userData.alias || "",
    cbuCvu: userData.cbuCvu || "",
    bancoOProveedor: userData.bancoOProveedor || "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const isManager = currentUserRole === Rol.GERENTE

  const availableRoles: { value: Rol; label: string }[] = isManager
    ? [
        { value: Rol.VENDEDOR, label: "Vendedor" },
      ]
    : [
        { value: Rol.ADMIN, label: "Administrador" },
        { value: Rol.GERENTE, label: "Gerente" },
        { value: Rol.VENDEDOR, label: "Vendedor" },
      ]

  const inputStyles =
    "w-full rounded-md bg-black/5 px-3 py-2 text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-gray-700 text-sm"

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

  const hasErrors = Object.keys(errors).length > 0

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-black/20">
      {/* Encabezado idéntico al formulario de negocios */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Editar Usuario
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Modificando información de <span className="font-semibold text-gray-700 dark:text-gray-200">{formData.nombre || "Usuario"}</span> ({userData.email})
          </p>
        </div>
        <Link
          href="/usuarios"
          className="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          ← Volver
        </Link>
      </div>

      {serverError && (
        <div className="mb-6 rounded-md bg-rose-500/10 p-3.5 text-sm font-medium text-rose-600 dark:text-rose-400">
          {serverError}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 rounded-md bg-emerald-500/10 p-3.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Datos Personales */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            Datos Personales
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                required
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Juan"
                className={inputStyles}
              />
              {errors.nombre && <p className="mt-1 text-xs text-rose-500">{errors.nombre}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Apellido *
              </label>
              <input
                type="text"
                name="apellido"
                required
                value={formData.apellido}
                onChange={handleChange}
                placeholder="Ej: Pérez"
                className={inputStyles}
              />
              {errors.apellido && <p className="mt-1 text-xs text-rose-500">{errors.apellido}</p>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Correo Electrónico
              </label>
              <Link
                href={`/usuarios/editar/${userData.id}/cambiar-email`}
                className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Solicitar cambio de email →
              </Link>
            </div>
            <input
              type="email"
              value={userData.email}
              disabled
              readOnly
              className="w-full rounded-md bg-black/5 px-3 py-2 text-gray-500 dark:bg-white/5 dark:text-gray-400 text-sm cursor-not-allowed outline-none"
            />
          </div>
        </div>

        <hr className="border-gray-200 dark:border-white/15 my-4" />

        {/* Datos de Cobro */}
        <div>
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Datos de Cobro Personales (Vendedor)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Datos bancarios o de billeteras virtuales utilizados para recibir transferencias.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Alias
              </label>
              <input
                type="text"
                name="alias"
                value={formData.alias}
                onChange={handleChange}
                placeholder="Ej: mi.alias.mp"
                className={inputStyles}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Banco o Proveedor
              </label>
              <input
                type="text"
                name="bancoOProveedor"
                value={formData.bancoOProveedor}
                onChange={handleChange}
                placeholder="Ej: Mercado Pago, Banco Nación..."
                className={inputStyles}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              CBU / CVU
            </label>
            <input
              type="text"
              name="cbuCvu"
              value={formData.cbuCvu}
              onChange={handleChange}
              placeholder="22 dígitos numéricos"
              maxLength={22}
              className={`${inputStyles} font-mono`}
            />
          </div>
        </div>

        <hr className="border-gray-200 dark:border-white/15 my-4" />

        {/* Permisos y Cuenta */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            Permisos y Cuenta
          </h3>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Rol del Usuario *
            </label>
            <select
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              className={inputStyles}
            >
              {availableRoles.map((roleOpt) => (
                <option key={roleOpt.value} value={roleOpt.value} className="bg-white dark:bg-zinc-900">
                  {roleOpt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="activo"
              name="activo"
              checked={formData.activo}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:border-gray-700 dark:bg-white/5"
            />
            <label htmlFor="activo" className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
              Usuario Activo
            </label>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/15">
          <Link
            href="/usuarios"
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>

      {/* Sección inferior de cupones */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Cupones del usuario
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Consulta y gestiona todos los cupones asociados a este miembro.
          </p>
        </div>
        <Link
          href={`/cupones?userId=${userData.id}`}
          className="w-full sm:w-auto text-center rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
        >
          Ver cupones de este usuario →
        </Link>
      </div>
    </div>
  )
}