'use client'

import { useActionState, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { verifyAndActivateUser } from '@/app/actions/auth'
import { resendUserVerificationCode } from '@/app/actions/users'

export default function VerificarCuentaPage() {
  const searchParams = useSearchParams()

  const [emailInput, setEmailInput] = useState(searchParams.get('email') || '')
  const [formData, setFormData] = useState({
    code: searchParams.get('code') || '',
    nombre: '',
    password: '',
    confirmPassword: '',
  })

  // Feedback para el reenvío de código
  const [resendStatus, setResendStatus] = useState<{
    message?: string
    error?: string
  } | null>(null)
  
  const [isResending, startResendTransition] = useTransition()

  const [state, formAction, isPending] = useActionState(verifyAndActivateUser, null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let newValue = value

    if (name === 'nombre') {
      newValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
    } else if (name === 'code') {
      newValue = value.replace(/\D/g, '').slice(0, 6)
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }))
  }

  // Handler para el reenvío del OTP
  const handleResendCode = () => {
    setResendStatus(null)

    if (!emailInput) {
      setResendStatus({ error: 'Ingresa tu correo para solicitar un nuevo código.' })
      return
    }

    startResendTransition(async () => {
      const payload = new FormData()
      payload.append('email', emailInput)

      const result = await resendUserVerificationCode({ error: '' }, payload)

      if (result.success) {
        setResendStatus({ message: result.message || 'Código reenviado con éxito. Revisa tu bandeja.' })
      } else {
        setResendStatus({ error: result.error || 'Ocurrió un error al solicitar el reenvío.' })
      }
    })
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder-slate-500'

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-zinc-900 sm:p-8">
        
        {/* Encabezado */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Activar Cuenta
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Ingresa el código que recibiste por correo para completar tu registro.
          </p>
        </div>

        {/* Alerta de Error / Estado del formulario de activación */}
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

        {/* Alerta de Estado del Reenvío de Código */}
        {resendStatus && (
          <div
            className={`rounded-xl p-4 text-sm font-medium ${
              resendStatus.message
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
          >
            {resendStatus.message || resendStatus.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          {/* Correo Electrónico (Necesario para reenviar si no vino por URL) */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Correo Electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="ejemplo@correo.com"
              className={inputClass}
            />
          </div>

          {/* Código de Verificación + Botón Reenviar */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="code"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Código de Verificación
              </label>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResending || isPending}
                className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400 disabled:opacity-50"
              >
                {isResending ? 'Reenviando...' : '¿Reenviar código?'}
              </button>
            </div>
            <input
              id="code"
              name="code"
              type="text"
              required
              value={formData.code}
              onChange={handleChange}
              placeholder="123456"
              className={`${inputClass} tracking-widest font-mono text-center text-lg`}
            />
            {state?.errors?.code && (
              <p className="mt-1 text-xs text-red-500">{state.errors.code}</p>
            )}
          </div>

          {/* Nombre Completo */}
          <div>
            <label
              htmlFor="nombre"
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Nombre Completo
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej. Juan Pérez"
              className={inputClass}
            />
            {state?.errors?.nombre && (
              <p className="mt-1 text-xs text-red-500">{state.errors.nombre}</p>
            )}
          </div>

          {/* Contraseña */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={inputClass}
            />
            {state?.errors?.password && (
              <p className="mt-1 text-xs text-red-500">{state.errors.password}</p>
            )}
          </div>

          {/* Confirmar Contraseña */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Confirmar Contraseña
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className={inputClass}
            />
            {state?.errors?.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                {state.errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Botón de envío */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending || isResending}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50"
            >
              {isPending ? 'Activando...' : 'Completar Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}