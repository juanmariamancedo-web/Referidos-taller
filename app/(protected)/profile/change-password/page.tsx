'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { changePasswordAction } from '@/app/actions/changePassword'

export default function ChangePasswordPage() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, null)

  const [formData, setFormData] = useState({
    prevPassword: '',
    password: '',
    passwordRepeat: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCancel = () => {
    window.history.back()
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-white'

  return (
    <div className="mx-auto max-w-xl p-4 sm:p-6">
      <div className="mb-6">
        <Link
          href="/profile"
          className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
        >
          ← Volver al perfil
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
          Cambiar contraseña
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Ingresa tu contraseña actual y la nueva contraseña para actualizar la seguridad de tu cuenta.
        </p>
      </div>

      <form
        action={formAction}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-zinc-900"
      >
        {/* Alerta de mensaje global (éxito / error) */}
        {state?.message && (
          <div
            className={`rounded-xl p-4 text-sm font-medium ${
              state.success
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
          >
            {state.message}
          </div>
        )}

        {/* Contraseña Actual */}
        <div>
          <label
            htmlFor="prevPassword"
            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Contraseña actual
          </label>
          <input
            id="prevPassword"
            name="prevPassword"
            type="password"
            value={formData.prevPassword}
            onChange={handleChange}
            placeholder="••••••••"
            className={inputClass}
          />
          {state?.errors?.prevPassword && (
            <p className="mt-1 text-xs text-red-500">{state.errors.prevPassword}</p>
          )}
        </div>

        {/* Nueva Contraseña */}
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Nueva contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Mínimo 6 caracteres"
            className={inputClass}
          />
          {state?.errors?.password && (
            <p className="mt-1 text-xs text-red-500">{state.errors.password}</p>
          )}
        </div>

        {/* Repetir Nueva Contraseña */}
        <div>
          <label
            htmlFor="passwordRepeat"
            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Repetir nueva contraseña
          </label>
          <input
            id="passwordRepeat"
            name="passwordRepeat"
            type="password"
            value={formData.passwordRepeat}
            onChange={handleChange}
            placeholder="Repite la nueva contraseña"
            className={inputClass}
          />
          {state?.errors?.passwordRepeat && (
            <p className="mt-1 text-xs text-red-500">
              {state.errors.passwordRepeat}
            </p>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-4 border-t border-slate-200 pt-4 dark:border-white/10">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50"
          >
            {isPending ? 'Guardando...' : 'Actualizar contraseña'}
          </button>
        </div>
      </form>
    </div>
  )
}