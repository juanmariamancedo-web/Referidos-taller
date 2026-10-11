"use client"

import { useActionState } from "react"
import { CanjearCuponState } from "@/app/actions/cupones"
import Link from "next/link"

interface CanjeFormClientProps {
  codigo: string
  action: (codigo: string, prevState: CanjearCuponState, formData: FormData) => Promise<CanjearCuponState>
}

const initialState: CanjearCuponState = {}

export default function CanjeFormClient({ codigo, action }: CanjeFormClientProps) {
  const actionWithId = action.bind(null, codigo)
  const [state, formAction, isPending] = useActionState(actionWithId, initialState)

  // Si el canje fue exitoso, mostramos una tarjeta de confirmación con los datos
  if (state?.success) {
    const cupon = state.data
    return (
      <div className="space-y-6 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center backdrop-blur-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white text-2xl shadow-lg">
          ✓
        </div>
        <div>
          <h2 className="text-xl font-black text-emerald-700 dark:text-emerald-400">
            ¡Canje Exitoso!
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {state.message || "El cupón ha sido procesado correctamente."}
          </p>
        </div>

        {/* Resumen Financiero del Canje */}
        {cupon && (
          <div className="space-y-2 rounded-2xl bg-white/60 p-4 text-left text-sm dark:bg-neutral-900/60 border border-black/5 dark:border-white/5">
            <div className="flex justify-between">
              <span className="text-gray-500">Monto Original:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ${Number(cupon.montoOriginal).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Descuento Aplicado:</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                -${Number(cupon.montoDescuento).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 dark:border-white/10">
              <span className="font-bold text-gray-700 dark:text-gray-300">Total a Cobrar al Cliente:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                ${Number(cupon.montoFinalCliente).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        <div className="pt-2">
          <Link
            href="/cupones"
            className="inline-block w-full rounded-2xl bg-neutral-900 py-3.5 text-center text-sm font-bold text-white shadow transition hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            Volver al listado de cupones
          </Link>
        </div>
      </div>
    )
  }

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