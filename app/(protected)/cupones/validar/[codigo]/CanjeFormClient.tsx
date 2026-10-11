"use client"

import { useActionState } from "react"
import { CanjearCuponState } from "@/app/actions/cupones"

interface CanjeFormClientProps {
  codigo: string
  action: (codigo: string, prevState: CanjearCuponState, formData: FormData) => Promise<CanjearCuponState>
}

const initialState: CanjearCuponState = {}

export default function CanjeFormClient({ codigo, action }: CanjeFormClientProps) {
  const actionWithId = action.bind(null, codigo)
  const [state, formAction, isPending] = useActionState(actionWithId, initialState)

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-2xl bg-rose-500/10 p-4 text-center text-sm font-medium text-rose-600 dark:text-rose-400">
          {state.error}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Monto Original del Servicio ($) *
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          name="montoOriginal"
          required
          placeholder="Ej: 25000"
          className="w-full rounded-2xl bg-black/5 px-4 py-3 text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-emerald-600 dark:bg-white/5 dark:text-white dark:outline-gray-700 font-semibold"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Ingrese el precio total sin el descuento para registrar el canje.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-emerald-600 py-4 text-center text-lg font-bold text-white shadow-lg transition hover:bg-emerald-700 active:scale-98 cursor-pointer disabled:opacity-50"
      >
        {isPending ? "Procesando canje..." : "✓ Confirmar y Canjear Cupón"}
      </button>
    </form>
  )
}