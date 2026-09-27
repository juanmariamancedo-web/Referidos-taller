import { getCuponByCodigo, validarYCanjearCupon } from "@/app/actions/cupones";
import { revalidatePath } from "next/cache";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    codigo: string;
  }>;
}

export default async function ValidarCuponDirectoPage({ params }: PageProps) {
  const { codigo } = await params;

  // 1. Obtener los detalles del cupón desde el Server Action
  const response = await getCuponByCodigo(codigo);

  // 2. Manejo de cupón inexistente
  if (!response.success || !response.data) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-4">
        <div className="rounded-3xl border border-red-200 bg-red-50/60 p-6 text-center dark:border-red-900/40 dark:bg-red-950/20">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
            ✕
          </div>
          <h1 className="text-xl font-bold text-red-600 dark:text-red-400">
            Cupón Inválido
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            El código <span className="font-mono font-bold">{codigo}</span> no
            existe o fue eliminado del sistema.
          </p>
          <Link
            href="/cupones/validar"
            className="mt-5 inline-block w-full rounded-2xl bg-neutral-900 py-3 text-sm font-bold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            Volver al escáner
          </Link>
        </div>
      </div>
    );
  }

  const cupon = response.data;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-between p-4 py-6">
      <div className="space-y-6">
        {/* Cabecera / Navegación */}
        <div className="flex items-center justify-between">
          <Link
            href="/cupones/validar"
            className="text-sm font-medium text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition"
          >
            ← Escanear otro
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Validación
          </span>
        </div>

        {/* Nombre del Negocio */}
        <div className="text-center">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            {cupon.usuario?.negocio?.nombre || "Taller Central"}
          </h1>
        </div>

        {/* Tarjeta Visual del Cupón */}
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-neutral-900">
          <div className="bg-blue-600 p-6 text-center text-white">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
              Beneficio Exclusivo
            </p>
            <div className="mt-2 text-4xl font-extrabold">
              {cupon.tipoDescuento === "PORCENTAJE"
                ? `${Number(cupon.valorDescuento)}% OFF`
                : `$${Number(cupon.valorDescuento).toLocaleString("es-AR")}`}
            </div>
            {cupon.cliente?.nombre && (
              <p className="mt-2 text-xs opacity-90">
                Asignado a:{" "}
                <span className="font-semibold">{cupon.cliente.nombre}</span>
              </p>
            )}
          </div>

          <div className="space-y-3 p-5 text-sm">
            <div className="flex justify-between border-b pb-2 dark:border-white/10">
              <span className="text-gray-500">Código:</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">
                {cupon.codigo}
              </span>
            </div>

            <div className="flex justify-between border-b pb-2 dark:border-white/10">
              <span className="text-gray-500">Estado Actual:</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  cupon.estado === "USADO"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                    : cupon.estado === "PENDIENTE"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                }`}
              >
                {cupon.estado}
              </span>
            </div>

            {cupon.cliente?.telefono && (
              <div className="flex justify-between">
                <span className="text-gray-500">Cliente (Teléfono):</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {cupon.cliente.telefono}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Acción de Canje mediante Server Action */}
        {cupon.estado === "PENDIENTE" ? (
          <form
            action={async () => {
              "use server";
              await validarYCanjearCupon(cupon.codigo);
              revalidatePath(`/validar/${cupon.codigo}`);
            }}
          >
            <button
              type="submit"
              className="w-full rounded-2xl bg-emerald-600 py-4 text-center text-lg font-bold text-white shadow-lg transition hover:bg-emerald-700 active:scale-98 cursor-pointer"
            >
              ✓ Confirmar y Canjear Cupón
            </button>
          </form>
        ) : (
          <div className="rounded-2xl bg-gray-100 p-4 text-center text-sm font-semibold text-gray-600 dark:bg-white/5 dark:text-gray-300">
            {cupon.estado === "USADO"
              ? `Este cupón fue canjeado el ${
                  cupon.fechaUso
                    ? new Date(cupon.fechaUso).toLocaleDateString("es-AR")
                    : ""
                }`
              : "Este cupón se encuentra vencido."}
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-xs text-gray-400">
        Sistema de Cupones y Referidos
      </div>
    </div>
  );
}