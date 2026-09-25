"use client"

import { useActionState } from "react"
import Link from "next/link"
import { updateBusiness, UpdateBusinessState } from "@/app/actions/business"

// Tipado representativo del modelo de negocio
interface Business {
  id: string
  userEmail: string
  nombre: string
  direccion?: string | null
  porcentajeFee?: number | null
  bancoOProveedor?: string | null
  alias?: string | null
  cbuCvu?: string | null
  activo: boolean
}

interface EditBusinessFormProps {
  business: Business
}

const initialState: UpdateBusinessState = {
  error: undefined,
  success: false,
}

export default function EditBusinessForm({ business }: EditBusinessFormProps) {
  // Enlazamos la Server Action pre-inyectando el ID del negocio mediante bind
  const updateBusinessWithId = updateBusiness.bind(null, business.id)
  const [state, formAction, isPending] = useActionState(updateBusinessWithId, initialState)

  const inputStyles =
    "w-full rounded-md bg-black/5 px-3 py-2 text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-gray-700"

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black/20">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Editar Negocio (Admin)
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ID: {business.id}
          </p>
        </div>
        <Link
          href="/negocios"
          className="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          ← Volver
        </Link>
      </div>

      {state?.error && (
        <div className="mb-6 rounded-md bg-rose-500/10 p-3.5 text-sm font-medium text-rose-600 dark:text-rose-400">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {/* Email del usuario / Encargado */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email del Usuario / Encargado *
          </label>
          <input
            type="email"
            name="userEmail"
            required
            defaultValue={business.userEmail}
            placeholder="usuario@ejemplo.com"
            className={inputStyles}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Modo Admin: Puedes reasignar este negocio a la cuenta de cualquier usuario registrado.
          </p>
        </div>

        {/* Nombre del Negocio */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nombre del Negocio *
          </label>
          <input
            type="text"
            name="nombre"
            required
            defaultValue={business.nombre}
            placeholder="Ej: Lubricentro San Martín"
            className={inputStyles}
          />
        </div>

        {/* Dirección */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Dirección
          </label>
          <input
            type="text"
            name="direccion"
            defaultValue={business.direccion ?? ""}
            placeholder="Ej: Av. Belgrano 1234"
            className={inputStyles}
          />
        </div>

        {/* Porcentaje Fee y Banco/Proveedor */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Porcentaje Fee (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              name="porcentajeFee"
              defaultValue={business.porcentajeFee ?? 0}
              placeholder="Ej: 2.5"
              className={inputStyles}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Banco / Proveedor
            </label>
            <input
              type="text"
              name="bancoOProveedor"
              defaultValue={business.bancoOProveedor ?? ""}
              placeholder="Ej: Mercado Pago / Banco Galicia"
              className={inputStyles}
            />
          </div>
        </div>

        {/* Alias y CBU/CVU */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Alias
            </label>
            <input
              type="text"
              name="alias"
              defaultValue={business.alias ?? ""}
              placeholder="Ej: lubricentro.mp"
              className={inputStyles}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              CBU / CVU
            </label>
            <input
              type="text"
              name="cbuCvu"
              defaultValue={business.cbuCvu ?? ""}
              placeholder="00000031000..."
              className={inputStyles}
            />
          </div>
        </div>

        {/* Checkbox Activo */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="activo"
            name="activo"
            defaultChecked={business.activo}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
          />
          <label
            htmlFor="activo"
            className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Negocio Activo
          </label>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-6">
          <Link
            href="/negocios"
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Actualizando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  )
}