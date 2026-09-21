'use client';

import { useActionState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// Importa la acción correspondiente para resetear la contraseña
import { resetPasswordAction } from '../actions/requestPasswordAction'; 

export default function RequestForgottenPasswordCodePage() {
  const [state, formAction, isPending] = useActionState(resetPasswordAction, null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Capturamos el email pasado por query param desde la pantalla anterior
  const email = searchParams.get('email') || '';

  useEffect(() => {
    if (state?.success) {
      router.push('/login');
    }
  }, [state, router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      {/* Encabezado con Título y Subtítulo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-sm mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Ingresar código
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Enviamos un código de 6 dígitos {email && <span>a <strong className="text-gray-900 dark:text-gray-200">{email}</strong></span>}
        </p>
      </div>

      <form action={formAction} className="space-y-6 w-full max-w-sm">
        {/* Campo oculto para pasar el email a la Server Action */}
        <input type="hidden" name="email" value={email} />

        {/* Campo CÓDIGO */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="code"
            className="block text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            Código de Verificación
          </label>
          <input
            id="code"
            name="code"
            type="text"
            placeholder="123456"
            maxLength={6}
            required
            className="block w-full rounded-md bg-black/5 px-3 py-1.5 text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white font-mono text-center text-lg tracking-widest"
          />
        </div>

        {/* Campo NUEVA CONTRASEÑA */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            Nueva Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="new-password"
            className="block w-full rounded-md bg-black/5 px-3 py-1.5 text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white"
          />
        </div>

        {/* Campo REPETIR CONTRASEÑA */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            Repite Contraseña
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="new-password"
            className="block w-full rounded-md bg-black/5 px-3 py-1.5 text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white"
          />
        </div>

        {/* Mensaje de error retornado por la Server Action */}
        {!state?.success && state?.message && (
          <div className="text-red-500 text-sm">{state.message}</div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-indigo-600 py-2 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {isPending ? 'Cargando...' : 'Restablecer Contraseña'}
        </button>
      </form>
    </div>
  );
}