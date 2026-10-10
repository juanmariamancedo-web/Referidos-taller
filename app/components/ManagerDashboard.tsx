import Link from "next/link"

interface ManagerDashboardProps {
  userData?: any
}

export default function ManagerDashboard({ userData }: ManagerDashboardProps) {
  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4">
      {/* Cabecera personalizada */}
      <div className="w-full flex justify-between items-center pb-6 lg:pb-10">
        <div>
          <h1 className="text-gray-900 dark:text-white text-2xl md:text-3xl lg:text-4xl font-bold">
            Dashboard de Gestión (Gerencia)
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Control de operaciones, seguimiento de equipo y rendimientos.
          </p>
        </div>
        <span className="text-xs uppercase px-3 py-1 rounded-full font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          Rol: {userData?.rol || 'Gerente'}
        </span>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {/* Tarjetas de Métricas de Gerencia */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <section className="flex flex-col justify-between rounded-xl bg-black/5 p-5 text-gray-900 dark:bg-white/5 dark:text-white border border-gray-200 dark:border-white/10 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Ventas del Mes
            </h2>
            <span className="font-bold text-3xl mt-4 text-emerald-600 dark:text-emerald-400">
              $ --
            </span>
          </section>

          <section className="flex flex-col justify-between rounded-xl bg-black/5 p-5 text-gray-900 dark:bg-white/5 dark:text-white border border-gray-200 dark:border-white/10 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Presupuestos Aprobados
            </h2>
            <span className="font-bold text-3xl mt-4 text-blue-600 dark:text-blue-400">
              --
            </span>
          </section>

          <section className="flex flex-col justify-between rounded-xl bg-black/5 p-5 text-gray-900 dark:bg-white/5 dark:text-white border border-gray-200 dark:border-white/10 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Pendientes de Cobro
            </h2>
            <span className="font-bold text-3xl mt-4 text-yellow-600 dark:text-yellow-400">
              --
            </span>
          </section>

          <section className="flex flex-col justify-between rounded-xl bg-black/5 p-5 text-gray-900 dark:bg-white/5 dark:text-white border border-gray-200 dark:border-white/10 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Vendedores Activos
            </h2>
            <span className="font-bold text-3xl mt-4 text-purple-600 dark:text-purple-400">
              --
            </span>
          </section>
        </div>

        {/* Secciones Inferiores */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Últimos Presupuestos */}
          <section className="lg:col-span-2 flex flex-col bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Operaciones Recientes
              </h2>
              <Link
                href="/presupuestos"
                className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                Ver todos →
              </Link>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-white/[0.02] text-xs uppercase text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-500">
                      No hay registros recientes
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Top Vendedores */}
          <section className="flex flex-col bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Rendimiento del Equipo
            </h2>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-white/[0.02] text-xs uppercase text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Vendedor</th>
                    <th className="px-4 py-3">Ventas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                  <tr>
                    <td colSpan={2} className="text-center py-6 text-gray-500">
                      Sin datos
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}