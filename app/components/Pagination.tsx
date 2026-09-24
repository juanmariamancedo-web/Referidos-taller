"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

interface Props {
  paginas: number
}

export default function Paginacion({ paginas }: Props) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  // Lee la página actual desde los query params de la URL (por defecto 1)
  const pagina = Number(searchParams.get("page")) || 1

  if (paginas <= 1) return null

  // Función para actualizar el parámetro 'page' en la URL
  const changePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", newPage.toString())
    replace(`${pathname}?${params.toString()}`)
  }

  const btnStyles =
    "shadow-sm overflow-hidden hover:shadow-md transition rounded-xl bg-black/5 px-3 py-1.5 text-base text-gray-900 sm:text-sm/6 dark:bg-white/5 dark:text-white"

  return (
    <div className="flex items-center justify-center gap-3">
      {/* Primera página */}
      {pagina > 1 && (
        <button className={btnStyles} onClick={() => changePage(1)}>
          1
        </button>
      )}

      {/* Puntos suspensivos inicio */}
      {pagina > 3 && <span className="dark:text-white">...</span>}

      {/* Página anterior */}
      {pagina > 2 && (
        <button className={btnStyles} onClick={() => changePage(pagina - 1)}>
          {pagina - 1}
        </button>
      )}

      {/* Página actual activa */}
      <span className={`${btnStyles} rounded-xl font-bold`}>
        {pagina}
      </span>

      {/* Página siguiente */}
      {pagina < paginas - 1 && (
        <button className={btnStyles} onClick={() => changePage(pagina + 1)}>
          {pagina + 1}
        </button>
      )}

      {/* Puntos suspensivos fin */}
      {pagina < paginas - 2 && <span className="dark:text-white">...</span>}

      {/* Última página */}
      {pagina < paginas && (
        <button className={btnStyles} onClick={() => changePage(paginas)}>
          {paginas}
        </button>
      )}
    </div>
  )
}