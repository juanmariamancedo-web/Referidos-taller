"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { solicitarCuponAction } from "@/app/actions/solicitar-cupon"

interface FormularioCuponProps {
  qrToken: string
}

export default function FormularioCupon({ qrToken }: FormularioCuponProps) {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const formData = new FormData(e.currentTarget)
    formData.append("qrToken", qrToken)

    const result = await solicitarCuponAction(formData)

    if (!result.success) {
      setErrorMsg(result.error || "Error al procesar el cupón.")
      setLoading(false)
      return
    }

    router.push(`/cupon/${result.codigoCupon}`)
  }

  // Mismas clases de estilo de input que en EditBusinessForm
  const inputStyles =
    "w-full rounded-md bg-black/5 px-3 py-2 text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-gray-700"

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black/20">
      <div className="mb-6 space-y-1">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Obtener Mi Cupón
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Ingresá tu WhatsApp para recibir y guardar tu descuento.
        </p>
      </div>

      {/* Alertas de error con la paleta rose-500 */}
      {errorMsg && (
        <div className="mb-6 rounded-md bg-rose-500/10 p-3.5 text-sm font-medium text-rose-600 dark:text-rose-400">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Teléfono / WhatsApp */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            WhatsApp / Teléfono *
          </label>
          <input
            type="tel"
            name="telefono"
            required
            placeholder="Ej: 3794123456"
            className={inputStyles}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Te identificaremos con este número para asociar tus beneficios.
          </p>
        </div>

        {/* Nombre Opcional */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tu Nombre (Opcional)
          </label>
          <input
            type="text"
            name="nombre"
            placeholder="Ej: Juan María"
            className={inputStyles}
          />
        </div>

        {/* Botón de Submit con Indigo-600 */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Generando cupón..." : "Obtener mi Cupón"}
          </button>
        </div>
      </form>

      {/* Footer / Legales */}
      <div className="mt-6 border-t border-gray-200 pt-4 text-center dark:border-white/10">
        <p className="text-[11px] text-gray-500 dark:text-gray-400">
          Válido únicamente por un solo uso en el comercio correspondiente.
        </p>
      </div>
    </div>
  )
}