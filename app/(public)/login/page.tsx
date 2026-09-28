'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { loginAction } from '@/app/actions/auth';

export default function LoginPanel() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      {/* Encabezado con Título y Subtítulo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-sm mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Iniciar sesión
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Ingresa tus datos para acceder a tu cuenta
        </p>
      </div>

      <form action={formAction} className="space-y-6 w-full max-w-sm">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="correo@ejemplo.com"
            required
            className="block w-full rounded-md bg-black/5 px-3 py-1.5 text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Contraseña
            </label>

            <Link
              href="/forgot-password"
              className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            required
            autoComplete="current-password"
            className="block w-full rounded-md bg-black/5 px-3 py-1.5 text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white"
          />
        </div>

        {/* Mensaje de error retornado por la Server Action */}
        {state?.message && (
          <div className="text-red-500 text-sm">{state.message}</div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-indigo-600 py-2 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {isPending ? 'Cargando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}