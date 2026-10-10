'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { updateProfileAction } from '@/app/actions/profile'
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

  const inputStyles =
    "w-full rounded-md bg-black/5 px-3 py-2 text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-gray-700"

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

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black/20">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mi Perfil
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Actualiza tu información personal y los datos predeterminados para cobros.
          </p>
        </div>
        <Link
          href="/negocios"
          className="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          ← Volver
        </Link>
      </div>

      {/* Alerta de mensaje global */}
      {state?.message && (
        <div
          className={`mb-6 rounded-md p-3.5 text-sm font-medium ${
            state.success
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
          }`}
        >
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {/* Sección 1: Datos Personales */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Datos Personales
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nombre" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej. Juan"
                className={inputStyles}
              />
              {state?.errors?.nombre && (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{state.errors.nombre}</p>
              )}
            </div>

            <div>
              <label htmlFor="apellido" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Apellido
              </label>
              <input
                id="apellido"
                name="apellido"
                type="text"
                value={formData.apellido}
                onChange={handleChange}
                placeholder="Ej. Pérez"
                className={inputStyles}
              />
              {state?.errors?.apellido && (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{state.errors.apellido}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Correo electrónico
              </label>
              <Link
                href="/profile/cambiar-email"
                className="text-xs font-medium text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400"
              >
                Solicitar cambio de email →
              </Link>
            </div>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              disabled
              readOnly
              className="w-full rounded-md bg-black/5 px-3 py-2 text-gray-400 outline-1 outline-gray-200 cursor-not-allowed dark:bg-white/5 dark:text-gray-500 dark:outline-gray-800"
            />
          </div>
        </div>

        <hr className="border-gray-200 dark:border-white/10 my-6" />

        {/* Sección 2: Datos de Cobro Personales */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Datos de Cobro Personales
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Cuentas bancarias o billeteras virtuales donde recibirás tus transferencias.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="alias" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Alias
              </label>
              <input
                id="alias"
                name="alias"
                type="text"
                value={formData.alias}
                onChange={handleChange}
                placeholder="ej. mi.alias.mp"
                className={inputStyles}
              />
              {state?.errors?.alias && (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{state.errors.alias}</p>
              )}
            </div>

            <div>
              <label htmlFor="bancoOProveedor" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Banco o Proveedor
              </label>
              <input
                id="bancoOProveedor"
                name="bancoOProveedor"
                type="text"
                value={formData.bancoOProveedor}
                onChange={handleChange}
                placeholder="ej. Mercado Pago, Banco Nación..."
                className={inputStyles}
              />
              {state?.errors?.bancoOProveedor && (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{state.errors.bancoOProveedor}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="cbuCvu" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              CBU / CVU
            </label>
            <input
              id="cbuCvu"
              name="cbuCvu"
              type="text"
              value={formData.cbuCvu}
              onChange={handleChange}
              placeholder="22 dígitos numéricos"
              maxLength={22}
              className={`${inputStyles} font-mono`}
            />
            {state?.errors?.cbuCvu && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{state.errors.cbuCvu}</p>
            )}
          </div>
        </div>

        <hr className="border-gray-200 dark:border-white/10 my-6" />

        {/* Sección 3: Permisos y Accesos Rápidos */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Cuenta y Permisos
          </h3>

          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Rol
            </label>
            <input
              id="role"
              name="role"
              type="text"
              value={formData.role}
              disabled
              readOnly
              className="w-full rounded-md bg-black/5 px-3 py-2 text-gray-400 outline-1 outline-gray-200 cursor-not-allowed capitalize dark:bg-white/5 dark:text-gray-500 dark:outline-gray-800"
            />
            {state?.errors?.role && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{state.errors.role}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
            <Link
              href="/profile/change-password"
              className="flex items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              Cambiar contraseña
            </Link>
            <Link
              href="/profile/qr"
              className="flex items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              Ver Mi Código QR
            </Link>
          </div>
        </div>

        {/* Botones de Acción */}
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
            {isPending ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}