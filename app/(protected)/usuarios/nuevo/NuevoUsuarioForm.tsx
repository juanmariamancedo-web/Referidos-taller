"use client"

import { useActionState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { preRegisterUser, PreRegisterUserState } from "@/app/actions/users"

interface Props {
  currentUserRol: string
  currentUserNegocioNombre?: string
  negocios: { id: string; nombre: string }[]
}

const initialState: PreRegisterUserState = {}

export default function NuevoUsuarioForm({
  currentUserRol,
  currentUserNegocioNombre,
  negocios,
}: Props) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    preRegisterUser,
    initialState
  )

  const isAdmin = currentUserRol === "ADMIN"

  const inputStyles =
    "w-full rounded-md bg-black/5 px-3 py-2 text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-gray-700"

  // Redirección al completarse exitosamente
  if (state?.success) {
    router.push("/usuarios")
    router.refresh()
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black/20">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Pre-registrar Nuevo Usuario
        </h1>
        <Link
          href="/usuarios"
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

      {state?.success && (
        <div className="mb-6 rounded-md bg-emerald-500/10 p-3.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          ¡Usuario pre-registrado con éxito! Redirigiendo a la lista de usuarios...
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {/* Email del usuario a pre-registrar */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Correo Electrónico *
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="usuario@ejemplo.com"
            className={inputStyles}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Se enviará un código OTP de verificación a este correo para que el usuario active su cuenta.
          </p>
        </div>

        {/* Negocio Asignado */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Negocio Asignado *
          </label>
          {isAdmin ? (
            <select
              name="negocioId"
              required
              className={inputStyles}
            >
              <option value="" className="dark:bg-gray-900">
                Seleccionar Negocio...
              </option>
              {negocios.map((n) => (
                <option key={n.id} value={n.id} className="dark:bg-gray-900">
                  {n.nombre}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              readOnly
              value={currentUserNegocioNombre || "Mi Negocio"}
              className={`${inputStyles} cursor-not-allowed opacity-75`}
            />
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-6">
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
            {isPending ? "Enviando invitación..." : "Pre-registrar y Enviar Código"}
          </button>
        </div>
      </form>
    </div>
  )
}