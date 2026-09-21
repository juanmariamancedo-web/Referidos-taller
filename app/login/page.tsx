'use client';

import { useActionState } from 'react';
import { loginAction } from '@/app/actions/auth'; // Ajusta la ruta a tu Server Action

interface Props {
  children: React.ReactNode;
}

export default function LoginPanel({ children }: Props) {
  // useActionState recibe la Server Action y el estado inicial (null)
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
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
            name="email" /* Requisito clave para FormData */
            type="email"
            placeholder="correo@ejemplo.com"
            required
            className="block w-full rounded-md bg-black/5 px-3 py-1.5 text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            Contraseña
          </label>
          <input
            id="password"
            name="password" /* Requisito clave para FormData */
            type="password"
            placeholder="Password"
            required
            autoComplete="current-password"
            className="block w-full rounded-md bg-black/5 px-3 py-1.5 text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white"
          />
        </div>

        {/* Mensaje de error retornado por la Server Action si falla la validación o credenciales */}
        {state?.message && (
          <div className="text-red-500 text-sm">{state.message}</div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-indigo-600 py-2 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Cargando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}