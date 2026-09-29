import Search from "@/app/components/Search"
import Paginacion from "@/app/components/Pagination"
import { Sort } from "@/app/components/Sort"
import { getCupones } from "@/app/actions/cupones"
import Link from "next/link"

interface PageProps {
  searchParams: Promise<{
    search?: string
    sort?: string
    page?: string
    estado?: string
    userId?:string
  }>
}

export default async function CuponesPage({ searchParams }: PageProps) {
  // En Next.js 15+ searchParams es una Promise
  const params = await searchParams
  const search = params.search || ""
  const sort = params.sort || ""
  const page = Number(params.page) || 1
  const estado = params.estado || ""
  const userId = params.userId || ""

  // Llamada al Server Action para obtener los cupones
  const response = await getCupones({ search, sort, page, estado, usuarioId: userId })
  const cupones = response.data || []
  const totalPages = response.totalPages || 1

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full flex-col items-center justify-between gap-4 pb-6 sm:flex-row lg:pb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl lg:text-5xl">
          Cupones
        </h1>
        <Link
          href="/cupones/nuevo"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700"
        >
          <span className="text-xl leading-none">+</span>
          Crear cupón
        </Link>
      </div>

      <Search />

      {!response.success && (
        <p className="text-rose-600 dark:text-rose-300">{response.message}</p>
      )}

      <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
        <table className="w-full min-w-[900px] bg-black/5 text-sm text-gray-900 dark:bg-white/5 dark:text-white">
          <thead className="bg-gray-100 dark:bg-white/10">
            <tr className="text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
              <th className="px-4 py-3"><Sort name="Código" serverArg="codigo" /></th>
              <th className="px-4 py-3"><Sort name="Cliente" serverArg="cliente.nombre" /></th>
              <th className="px-4 py-3"><Sort name="Vendedor" serverArg="usuario.nombre" /></th>
              <th className="px-4 py-3"><Sort name="Descuento" serverArg="valorDescuento" /></th>
              <th className="px-4 py-3"><Sort name="Estado" serverArg="estado" /></th>
              <th className="px-4 py-3"><Sort name="Expiración" serverArg="fechaExpiracion" /></th>
              <th className="px-4 py-3"><Sort name="Canjeado" serverArg="fechaUso" /></th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 text-sm dark:divide-white/10">
            {cupones.length ? (
              cupones.map((cupon) => {
                const nombreCliente = cupon.cliente?.nombre || cupon.cliente?.telefono || "Desconocido"
                const nombreVendedor = cupon.usuario?.nombre
                  ? `${cupon.usuario.nombre} ${cupon.usuario.apellido || ""}`.trim()
                  : cupon.usuario?.email || "-"

                return (
                  <tr key={cupon.id} className="transition hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">
                      {cupon.codigo}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {nombreCliente}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {nombreVendedor}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {cupon.tipoDescuento === "PORCENTAJE"
                        ? `${Number(cupon.valorDescuento)}%`
                        : `$${Number(cupon.valorDescuento).toLocaleString()}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        cupon.estado === "USADO"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : cupon.estado === "PENDIENTE"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {cupon.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {cupon.fechaExpiracion
                        ? new Date(cupon.fechaExpiracion).toLocaleDateString()
                        : "Sin limite"}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {cupon.fechaUso
                        ? new Date(cupon.fechaUso).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/cupones/detalle/${cupon.id}`}
                        className="rounded-lg bg-blue-100 px-3 py-1.5 font-semibold text-blue-700 transition hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-300"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-6 text-center text-gray-500">
                  No se encontraron cupones
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Paginacion paginas={totalPages} />
    </div>
  )
}