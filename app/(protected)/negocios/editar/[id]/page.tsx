import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import FormularioCupon from "./FormularioCupon"

interface PageProps {
  params: Promise<{ qrToken: string }>
}

export default async function GenerarCuponPage({ params }: PageProps) {
  const { qrToken } = await params

  const vendedor = await prisma.usuario.findUnique({
    where: { qrToken },
    select: {
      nombre: true,
      apellido: true,
      negocio: {
        select: {
          nombre: true,
          direccion: true,
        },
      },
    },
  })

  if (!vendedor) {
    notFound()
  }

  const nombreNegocio = vendedor.negocio?.nombre || "Comercio Adherido"
  const nombreVendedor = [vendedor.nombre, vendedor.apellido].filter(Boolean).join(" ")

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Header con la identidad del negocio */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black/20 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Beneficio Exclusivo
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {nombreNegocio}
          </h1>
          {nombreVendedor && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Recomendado por: <span className="font-semibold">{nombreVendedor}</span>
            </p>
          )}
        </div>

        {/* Formulario alineado al Design System */}
        <FormularioCupon qrToken={qrToken} />
      </div>
    </main>
  );
}