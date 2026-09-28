import Search from "@/app/components/Search"
import Paginacion from "@/app/components/Pagination"
import { Sort } from "@/app/components/Sort"
import { getUsers } from "@/app/actions/users"
import Link from "next/link"

interface PageProps {
  searchParams: Promise<{
    search?: string
    sort?: string
    page?: string
    negocioId?: string
  }>
}

export default async function UsuariosPage({ searchParams }: PageProps) {
  // En Next.js 15+ searchParams es una Promise
  const params = await searchParams
  const search = params.search || ""
  const sort = params.sort || ""
  const page = Number(params.page) || 1
  const negocioId = params.negocioId
  

  // Llamada directa en el Servidor
  const response = await getUsers({ search, sort, page, negocioId })
  const usuarios = response.data || []
  const totalPages = response.totalPages || 1


  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full flex-col items-center justify-between gap-4 pb-6 sm:flex-row lg:pb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl lg:text-5xl">
          Usuarios
        </h1>
        <Link
          href="/usuarios/nuevo"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700"
        >
          <span className="text-xl leading-none">+</span>
          Agregar usuario
        </Link>
      </div>

      <Search />

      {!response.success && (
        <p className="text-rose-600 dark:text-rose-300">{response.message}</p>
      )}

      <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
        <table className="w-full min-w-[768px] bg-black/5 text-sm text-gray-900 dark:bg-white/5 dark:text-white">
          <thead className="bg-gray-100 dark:bg-white/10">
            <tr className="text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
              <th className="px-4 py-3"><Sort name="Nombre" serverArg="nombre" /></th>
              <th className="px-4 py-3"><Sort name="Apellido" serverArg="apellido" /></th>
              <th className="px-4 py-3"><Sort name="Email" serverArg="email" /></th>
              <th className="px-4 py-3"><Sort name="Rol" serverArg="rol" /></th>
              <th className="px-4 py-3"><Sort name="Negocio" serverArg="negocio" /></th>
              <th className="px-4 py-3"><Sort name="Banco/Proveedor" serverArg="bancoOProveedor" /></th>
              <th className="px-4 py-3"><Sort name="Estado" serverArg="activo" /></th>
              <th className="px-4 py-3 text-center">Editar</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 text-sm dark:divide-white/10">
            {usuarios.length ? (
              usuarios.map((usuario) => (
                <tr key={usuario.id} className="transition hover:bg-gray-50 dark:hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {usuario.nombre || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {usuario.apellido || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {usuario.email}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    <span className="rounded bg-slate-200/60 px-2 py-0.5 text-xs font-semibold text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                      {usuario.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {usuario.negocio?.nombre || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {usuario.bancoOProveedor || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      usuario.activo
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'border border-red-200 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/usuarios/editar/${usuario.id}`}
                      className="rounded-lg bg-blue-100 px-3 py-1.5 font-semibold text-blue-700 transition hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-300"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-6 text-center text-gray-500">
                  No se encontraron usuarios
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