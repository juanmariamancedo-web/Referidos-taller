'use client'

import { useActionState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { verifyEmailChangeAction } from '@/app/actions/changeEmail'

function VerifyEmailForm() {
  const searchParams = useSearchParams()

  const pendingEmail = searchParams.get('email') || ''
  const targetUserId = searchParams.get('userId') || ''
  const backUrl = searchParams.get('backUrl') || '/profile'

  const [verifyState, verifyFormAction, isVerifyPending] = useActionState(
    verifyEmailChangeAction,
    null
  )

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-white'

  return (
    <div className="mx-auto max-w-xl p-4 sm:p-6">
      <div className="mb-6">
        <Link
          href={backUrl}
          className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
        >
          ← Volver
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
          Verificar código
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Ingresa el código de 6 dígitos enviado a{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {pendingEmail || 'tu dirección de correo'}
          </span>
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-zinc-900">
        {verifyState?.message && (
          <div
            className={`mb-6 rounded-xl p-4 text-sm font-medium ${
              verifyState.success
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
          >
            {verifyState.message}
          </div>
        )}

        <form action={verifyFormAction} className="space-y-6">
          {/* Campos ocultos requeridos por la Server Action */}
          <input type="hidden" name="pendingEmail" value={pendingEmail} />
          {targetUserId && <input type="hidden" name="userId" value={targetUserId} />}

          <div>
            <label
              htmlFor="code"
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Código de 6 dígitos
            </label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              onChange={(e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6)
              }}
              placeholder="000000"
              className={`${inputClass} text-center text-xl font-bold tracking-[0.4em]`}
              required
            />
            {verifyState?.errors?.code && (
              <p className="mt-1 text-xs text-red-500">{verifyState.errors.code}</p>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-white/10">
            <Link
              href={backUrl}
              className="text-xs font-semibold text-slate-500 hover:underline dark:text-slate-400"
            >
              Cancelar o solicitar nuevo código
            </Link>

            <button
              type="submit"
              disabled={isVerifyPending || verifyState?.success}
              className="rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50"
            >
              {isVerifyPending ? 'Verificando...' : 'Confirmar cambio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-sm">Cargando...</div>}>
      <VerifyEmailForm />
    </Suspense>
  )
}