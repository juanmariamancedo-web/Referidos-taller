import Link from "next/link"
import { notFound } from "next/navigation"
import { getCuponById } from "@/app/actions/cupones"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CuponDetallePage({ params }: PageProps) {
  const { id } = await params
  const response = await getCuponById(id)

  if (!response.success || !response.data) {
    notFound()
  }

  const cupon = response.data
  const cliente = cupon.cliente
  const vendedor = cupon.usuario
  const negocio = vendedor?.negocio

  // Helpers de formato
  const formatoMonto =
    cupon.tipoDescuento === "PORCENTAJE"
      ? `${Number(cupon.valorDescuento)}%`
      : `$${Number(cupon.valorDescuento).toLocaleString("es-AR", {
          minimumFractionDigits: 2,
        })}`

  const estadoBadgeClass =
    cupon.estado === "USADO"
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-800"
      : cupon.estado === "PENDIENTE"
      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800"
      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-800"

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      {/* Header y navegación */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/cupones"
            className="rounded-lg border border-gray-300 bg-white p-2 text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
          >
            ← Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
              Cupón <span className="font-mono text-blue-600 dark:text-blue-400">{cupon.codigo}</span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Creado el {new Date(cupon.createdAt).toLocaleString("es-AR")}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-semibold ${estadoBadgeClass}`}
        >
          {cupon.estado}
        </span>
      </div>

      {/* Grid de Secciones */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1: Detalles del Descuento */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white border-b pb-2 dark:border-white/10">
            Términos del Descuento
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Tipo de Descuento:</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{cupon.tipoDescuento}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Valor:</dt>
              <dd className="font-bold text-blue-600 dark:text-blue-400 text-base">{formatoMonto}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Fecha de Expiración:</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {cupon.fechaExpiracion
                  ? new Date(cupon.fechaExpiracion).toLocaleDateString("es-AR")
                  : "Sin límite"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Fecha de Canje:</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {cupon.fechaUso ? new Date(cupon.fechaUso).toLocaleString("es-AR") : "Aún no canjeado"}
              </dd>
            </div>
            {cupon.terminosCondiciones && (
              <div className="pt-2">
                <dt className="text-gray-500 dark:text-gray-400 mb-1">Términos y Condiciones:</dt>
                <dd className="rounded-md bg-gray-50 p-2.5 text-xs text-gray-700 dark:bg-white/5 dark:text-gray-300">
                  {cupon.terminosCondiciones}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Card 2: Información del Cliente */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white border-b pb-2 dark:border-white/10">
            Cliente
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Teléfono (Celular):</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{cliente.telefono}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Nombre:</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{cliente.nombre || "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Email:</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{cliente.email || "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Estado Cliente:</dt>
              <dd>
                {cliente.bloqueado ? (
                  <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    Bloqueado
                  </span>
                ) : (
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Habilitado
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Card 3: Vendedor y Negocio */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white border-b pb-2 dark:border-white/10">
            Emisor / Vendedor
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Vendedor:</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {vendedor.nombre
                  ? `${vendedor.nombre} ${vendedor.apellido || ""}`.trim()
                  : vendedor.email}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Rol:</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{vendedor.rol}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Negocio:</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{negocio?.nombre || "-"}</dd>
            </div>
            {negocio && (
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">% Fee Retenido:</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {Number(negocio.porcentajeFee)}%
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Card 4: Wallet e Integración Digital */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white border-b pb-2 dark:border-white/10">
            Digital Wallet (Apple / Google)
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Agregado a Wallet:</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {cupon.agregadoAWallet ? "Sí" : "No"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Plataforma:</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {cupon.walletPlataforma || "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">N° Serie Wallet:</dt>
              <dd className="font-mono text-xs text-gray-900 dark:text-white">
                {cupon.walletSerial || "-"}
              </dd>
            </div>
            {cupon.walletUrl && (
              <div className="pt-2">
                <a
                  href={cupon.walletUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  Abrir enlace de Wallet ↗
                </a>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Card 5: Liquidación Asociada (Si existe) */}
      {cupon.liquidacionDetalle && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
          <h2 className="mb-3 text-lg font-semibold text-blue-900 dark:text-blue-300">
            Información de Liquidación
          </h2>
          <div className="grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <span className="block text-xs text-gray-500 dark:text-gray-400">Período</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {cupon.liquidacionDetalle.liquidacion.periodo}
              </span>
            </div>
            <div>
              <span className="block text-xs text-gray-500 dark:text-gray-400">Estado Liquidación</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {cupon.liquidacionDetalle.liquidacion.estado}
              </span>
            </div>
            <div>
              <span className="block text-xs text-gray-500 dark:text-gray-400">Monto Bruto Detalle</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ${Number(cupon.liquidacionDetalle.montoBruto).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}