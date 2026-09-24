'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { updateProfileAction } from '../actions/profile'
import { Usuario } from '@prisma/client'

export type ActionState = {
  success?: boolean
  message?: string
  errors?: {
    nombre?: string
    apellido?: string
    role?: string
    alias?: string
    cbuCvu?: string
    bancoOProveedor?: string
    [key: string]: string | undefined
  }
} | null

interface ProfileFormProps {
  userData?: Omit<Usuario, 'passwordHash'>
}

export default function ProfileForm({ userData }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, null)

  const [formData, setFormData] = useState({
    nombre: userData?.nombre || '',
    apellido: userData?.apellido || '',
    email: userData?.email || '',
    role: userData?.rol || '',
    alias: userData?.alias || '',
    cbuCvu: userData?.cbuCvu || '',
    bancoOProveedor: userData?.bancoOProveedor || '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    let newValue = value

    switch (name) {
      case 'cbuCvu':
        newValue = value.replace(/\D/g, '').slice(0, 22)
        break

      case 'nombre':
      case 'apellido':
        newValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
        break

      case 'alias':
        newValue = value.replace(/[^a-zA-Z0-9.-]/g, '').slice(0, 20)
        break

      default:
        newValue = value
        break
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }))
  }

  const handleCancel = () => {
    window.history.back()
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-white'

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-zinc-900"
    >
      {/* Alerta de mensaje global */}
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

      {/* Grid principal */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Nombre */}
        <div>
          <label
            htmlFor="nombre"
            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Nombre
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej. Juan"
            className={inputClass}
          />
          {state?.errors?.nombre && (
            <p className="mt-1 text-xs text-red-500">{state.errors.nombre}</p>
          )}
        </div>

        {/* Apellido */}
        <div>
          <label
            htmlFor="apellido"
            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Apellido
          </label>
          <input
            id="apellido"
            name="apellido"
            type="text"
            value={formData.apellido}
            onChange={handleChange}
            placeholder="Ej. Pérez"
            className={inputClass}
          />
          {state?.errors?.apellido && (
            <p className="mt-1 text-xs text-red-500">{state.errors.apellido}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className={`${inputClass} cursor-not-allowed opacity-70`}
            disabled
          />
        </div>

        {/* Rol */}
        <div>
          <label
            htmlFor="role"
            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Rol
          </label>
          <input
            id="role"
            name="role"
            type="text"
            value={formData.role}
            onChange={handleChange}
            className={`${inputClass} cursor-not-allowed opacity-70`}
            disabled
          />
          {state?.errors?.role && (
            <p className="mt-1 text-xs text-red-500">{state.errors.role}</p>
          )}
        </div>

        {/* Banco / Entidad */}
        <div>
          <label
            htmlFor="bancoOProveedor"
            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Banco / Entidad
          </label>
          <input
            id="bancoOProveedor"
            name="bancoOProveedor"
            type="text"
            value={formData.bancoOProveedor}
            onChange={handleChange}
            placeholder="Ej. Mercado Pago, Banco Galicia"
            className={inputClass}
          />
          {state?.errors?.bancoOProveedor && (
            <p className="mt-1 text-xs text-red-500">
              {state.errors.bancoOProveedor}
            </p>
          )}
        </div>

        {/* Alias */}
        <div>
          <label
            htmlFor="alias"
            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Alias MP / CBU
          </label>
          <input
            id="alias"
            name="alias"
            type="text"
            value={formData.alias}
            onChange={handleChange}
            placeholder="Ej. mi.alias.mp"
            className={inputClass}
          />
          {state?.errors?.alias && (
            <p className="mt-1 text-xs text-red-500">{state.errors.alias}</p>
          )}
        </div>

        {/* CBU / CVU ocupa las 2 columnas */}
        <div className="md:col-span-2">
          <label
            htmlFor="cbuCvu"
            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            CBU / CVU
          </label>
          <input
            id="cbuCvu"
            name="cbuCvu"
            type="text"
            value={formData.cbuCvu}
            onChange={handleChange}
            placeholder="Ej. 0000003100010000000000"
            className={inputClass}
          />
          {state?.errors?.cbuCvu && (
            <p className="mt-1 text-xs text-red-500">{state.errors.cbuCvu}</p>
          )}
        </div>

        {/* Botones de navegación (ocupa las 2 columnas) */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:col-span-2">
          <Link
            href="/profile/change-password"
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600/10 px-4 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400"
          >
            Cambiar contraseña
          </Link>
          <Link
            href="/profile/change-email"
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600/10 px-4 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400"
          >
            Cambiar email
          </Link>
          <Link
            href="/profile/qr"
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600/10 px-4 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400"
          >
            Ver QR
          </Link>
        </div>
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
          {isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}