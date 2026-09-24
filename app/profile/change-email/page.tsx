'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import {
  requestEmailChangeAction,
  verifyEmailChangeAction,
  ActionState,
} from '@/app/actions/changeEmail'

export default function ChangeEmailPage() {
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [pendingEmail, setPendingEmail] = useState('')

  // Paso 1: Solicitud de código
  const [requestState, requestFormAction, isRequestPending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const res = await requestEmailChangeAction(prev, formData)
      if (res?.success && res.step === 'verify') {
        setStep('verify')
        if (res.pendingEmail) setPendingEmail(res.pendingEmail)
      }
      return res
    },
    null
  )

  // Paso 2: Confirmación del código
  const [verifyState, verifyFormAction, isVerifyPending] = useActionState(
    verifyEmailChangeAction,
    null
  )

  const activeState = step === 'request' ? requestState : verifyState

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-white'

  return (
    <div className="mx-auto max-w-xl p-4 sm:p-6">
      {/* Encabezado */}
      <div className="mb-6">
        <Link
          href="/profile"
          className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
        >
          ← Volver al perfil
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
          Cambiar correo electrónico
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {step === 'request'
            ? 'Ingresa tu nueva dirección de correo para recibir el código de verificación.'
            : `Ingresa el código de 6 dígitos que enviamos a ${pendingEmail}`}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-zinc-900">
        {/* Mensajes globales de alerta */}
        {activeState?.message && (
          <div
            className={`mb-6 rounded-xl p-4 text-sm font-medium ${
              activeState.success
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
          >
            {activeState.message}
          </div>
        )}

        {step === 'request' ? (
          /* ================= Paso 1: Pedir nuevo correo ================= */
          <form action={requestFormAction} className="space-y-6">
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
              {requestState?.errors?.newEmail && (
                <p className="mt-1 text-xs text-red-500">
                  {requestState.errors.newEmail}
                </p>
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
                disabled={isRequestPending}
                className="rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50"
              >
                {isRequestPending ? 'Enviando código...' : 'Enviar código'}
              </button>
            </div>
          </form>
        ) : (
          /* ================= Paso 2: Ingresar código ================= */
          <form action={verifyFormAction} className="space-y-6">
            <input type="hidden" name="pendingEmail" value={pendingEmail} />

            <div>
              <label
                htmlFor="code"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Código de verificación (6 dígitos)
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
                <p className="mt-1 text-xs text-red-500">
                  {verifyState.errors.code}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-white/10">
              <button
                type="button"
                onClick={() => setStep('request')}
                className="text-xs font-semibold text-slate-500 hover:underline dark:text-slate-400"
              >
                Cambiar dirección de correo
              </button>

              <button
                type="submit"
                disabled={isVerifyPending || verifyState?.success}
                className="rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50"
              >
                {isVerifyPending ? 'Verificando...' : 'Confirmar cambio'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}