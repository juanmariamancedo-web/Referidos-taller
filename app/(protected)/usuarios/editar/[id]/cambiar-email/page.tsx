'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { requestEmailChangeAction } from '@/app/actions/changeEmail'

export default function RequestEmailChangePage() {
  const router = useRouter()

  const [state, formAction, isPending] = useActionState(
    requestEmailChangeAction,
    null
  )

  useEffect(() => {
    if (state?.success && state?.pendingEmail) {
      const searchParams = new URLSearchParams({
        email: state.pendingEmail,
        backUrl: '/profile',
      })
      // Redirección a la pantalla compartida de verificación
      router.push(`/verificar-email?${searchParams.toString()}`)
    }
  }, [state, router])

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
          Solicitar cambio de correo
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Ingresa tu nueva dirección de correo para recibir el código de verificación.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-zinc-900">
        {state?.message && !state.success && (
          <div className="mb-6 rounded-xl bg-red-500/10 p-4 text-sm font-medium text-red-600 dark:text-red-400">
            {state.message}
          </div>
        )}

        <form action={formAction} className="space-y-6">
          <div>
            <label
              htmlFor="newEmail"
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Nuevo correo electrónico
            </label>
            <input
              id="newEmail"
              name="newEmail"
              type="email"
              placeholder="ejemplo@correo.com"
              className={inputClass}
              required
            />
            {state?.errors?.newEmail && (
              <p className="mt-1 text-xs text-red-500">{state.errors.newEmail}</p>
            )}
          </div>

          <div className="flex justify-end gap-4 border-t border-slate-200 pt-4 dark:border-white/10">
            <Link
              href="/profile"
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50"
            >
              {isPending ? 'Enviando código...' : 'Enviar código'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}