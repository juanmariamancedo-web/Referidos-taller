'use client';

import { useActionState, useEffect, useState } from 'react';
import { sendCodeForgotPasswordAction } from '../actions/forgotPasswordAction';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(sendCodeForgotPasswordAction, null);
  const [email, setEmail] = useState(''); // Estado para guardar el email ingresado
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      // Redirigimos pasando el email codificado en la URL
      router.push(`/request-forgotten-password-code?email=${encodeURIComponent(email)}`);
    }
  }, [state, router, email]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      {/* Encabezado con Título y Subtítulo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-sm mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Recuperar contraseña
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Ingresa tu correo para recibir un código de verificación
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
            value={email}
            onChange={(e) => setEmail(e.target.value)} // Capturamos el cambio de valor
            placeholder="correo@ejemplo.com"
            required
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
          {isPending ? 'Cargando...' : 'Enviar Código'}
        </button>
      </form>
    </div>
  );
}