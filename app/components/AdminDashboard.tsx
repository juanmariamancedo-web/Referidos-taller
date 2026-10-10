import Link from "next/link"

interface AdminDashboardProps {
  userData?: any
}

export default function AdminDashboard({ userData }: AdminDashboardProps) {
  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4">
      {/* Cabecera personalizada */}
      <div className="w-full flex justify-between items-center pb-6 lg:pb-10">
        <div>
          <h1 className="text-gray-900 dark:text-white text-2xl md:text-3xl lg:text-4xl font-bold">
            Dashboard General (Administrador)
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Vista global del sistema, recaudaciones, negocios y usuarios.
          </p>
        </div>
        <span className="text-xs uppercase px-3 py-1 rounded-full font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          Rol: {userData?.rol || 'Admin'}
        </span>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {/* Tarjetas de Métricas Globales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <section className="flex flex-col justify-between rounded-xl bg-black/5 p-5 text-gray-900 dark:bg-white/5 dark:text-white border border-gray-200 dark:border-white/10 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Negocios
            </h2>
            <span className="font-bold text-3xl mt-4 text-blue-600 dark:text-blue-400">
              --
            </span>
          </section>

          <section className="flex flex-col justify-between rounded-xl bg-black/5 p-5 text-gray-900 dark:bg-white/5 dark:text-white border border-gray-200 dark:border-white/10 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Usuarios Activos
            </h2>
            <span className="font-bold text-3xl mt-4 text-purple-600 dark:text-purple-400">
              --
            </span>
          </section>

          <section className="flex flex-col justify-between rounded-xl bg-black/5 p-5 text-gray-900 dark:bg-white/5 dark:text-white border border-gray-200 dark:border-white/10 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Recaudado
            </h2>
            <span className="font-bold text-3xl mt-4 text-emerald-600 dark:text-emerald-400">
              $ --
            </span>
          </section>

          <section className="flex flex-col justify-between rounded-xl bg-black/5 p-5 text-gray-900 dark:bg-white/5 dark:text-white border border-gray-200 dark:border-white/10 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Comisiones / Fees
            </h2>
            <span className="font-bold text-3xl mt-4 text-sky-600 dark:text-sky-400">
              $ --
            </span>
          </section>
        </div>

        {/* Secciones Inferiores */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tabla de Negocios Recientes */}
          <section className="lg:col-span-2 flex flex-col bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Últimos Negocios Registrados
              </h2>
              <Link
                href="/negocios"
                className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                Ver todos →
              </Link>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-white/[0.02] text-xs uppercase text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Negocio</th>
                    <th className="px-4 py-3">Encargado</th>
                    <th className="px-4 py-3">Fee (%)</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-500">
                      Sin datos de negocios disponibles
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Panel Lateral: Accesos Rápidos Admin */}
          <section className="flex flex-col bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Acciones Administrativas
            </h2>
            <div className="flex flex-col gap-3">
              <Link
                href="/negocios/nuevo"
                className="w-full text-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                + Crear Nuevo Negocio
              </Link>
              <Link
                href="/usuarios/nuevo"
                className="w-full text-center rounded-md bg-gray-100 dark:bg-white/10 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-white transition hover:bg-gray-200 dark:hover:bg-white/20"
              >
                + Crear Nuevo Usuario
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}