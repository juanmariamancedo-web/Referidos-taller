"use client"

import { useActionState } from "react"
import Link from "next/link"
import { createBusiness, CreateBusinessState } from "@/app/actions/business"

const initialState: CreateBusinessState = {
  error: undefined,
  success: false,
}

export default function CreateBusinessForm() {
  const [state, formAction, isPending] = useActionState(createBusiness, initialState)

  const inputStyles =
    "w-full rounded-md bg-black/5 px-3 py-2 text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-gray-700"

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black/20">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Crear Nuevo Negocio
        </h1>
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
            placeholder="usuario@ejemplo.com"
            className={inputStyles}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Se asociará al usuario existente con este correo o se creará uno nuevo automáticamente.
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
              defaultValue="0"
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
            defaultChecked
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
            {isPending ? "Guardando..." : "Guardar Negocio"}
          </button>
        </div>
      </form>
    </div>
  )
}