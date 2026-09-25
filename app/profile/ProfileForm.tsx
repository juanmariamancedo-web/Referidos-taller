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

  return (
    <div className="mx-auto max-w-2xl p-6 w-full">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
          Mi Perfil
        </h2>

        {/* Alerta de mensaje global */}
        {state?.message && (
          <div
            className={`mb-6 p-4 text-xs rounded-lg border ${
              state.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
            }`}
          >
            {state.message}
          </div>
        )}

        <form action={formAction} className="space-y-6">
          {/* Sección 1: Datos Personales */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Datos Personales
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="nombre"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
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
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300"
                />
                {state?.errors?.nombre && (
                  <p className="text-xs text-rose-500 mt-1">{state.errors.nombre}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="apellido"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
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
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300"
                />
                {state?.errors?.apellido && (
                  <p className="text-xs text-rose-500 mt-1">{state.errors.apellido}</p>
                )}
              </div>
            </div>

            {/* Email con enlace a solicitar cambio */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Correo electrónico
                </label>
                <Link
                  href="/profile/change-email"
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 hover:underline transition-colors"
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
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Sección 2: Datos de Cobro Personales */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Datos de Cobro Personales
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cuentas bancarias o billeteras virtuales donde recibirás tus transferencias.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="alias"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Alias
                </label>
                <input
                  id="alias"
                  name="alias"
                  type="text"
                  value={formData.alias}
                  onChange={handleChange}
                  placeholder="ej. mi.alias.mp"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300"
                />
                {state?.errors?.alias && (
                  <p className="text-xs text-rose-500 mt-1">{state.errors.alias}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="bancoOProveedor"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Banco o Proveedor
                </label>
                <input
                  id="bancoOProveedor"
                  name="bancoOProveedor"
                  type="text"
                  value={formData.bancoOProveedor}
                  onChange={handleChange}
                  placeholder="ej. Mercado Pago, Banco Nación..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300"
                />
                {state?.errors?.bancoOProveedor && (
                  <p className="text-xs text-rose-500 mt-1">
                    {state.errors.bancoOProveedor}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="cbuCvu"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
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
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300"
              />
              {state?.errors?.cbuCvu && (
                <p className="text-xs text-rose-500 mt-1">{state.errors.cbuCvu}</p>
              )}
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Sección 3: Permisos y Accesos Rápidos */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Cuenta y Permisos
            </h3>

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Rol
              </label>
              <input
                id="role"
                name="role"
                type="text"
                value={formData.role}
                disabled
                readOnly
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 px-3 py-2 text-sm text-slate-500 cursor-not-allowed capitalize"
              />
              {state?.errors?.role && (
                <p className="text-xs text-rose-500 mt-1">{state.errors.role}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Link
                href="/profile/change-password"
                className="flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                Cambiar contraseña
              </Link>
              <Link
                href="/profile/qr"
                className="flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                Ver Mi Código QR
              </Link>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-colors"
            >
              {isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}