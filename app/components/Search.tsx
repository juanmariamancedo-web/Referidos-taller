"use client"

import { useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export default function Search() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  // Inicializa el estado local con el valor actual de 'search' en la URL
  const [searchLocal, setSearchLocal] = useState<string>(
    searchParams.get("search")?.toString() || ""
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const params = new URLSearchParams(searchParams)

    // Al hacer una nueva búsqueda, reseteamos la página a 1
    params.set("page", "1")

    if (searchLocal.trim()) {
      params.set("search", searchLocal.trim())
    } else {
      params.delete("search")
    }

    // Actualiza la URL sin recargar la página completa
    replace(`${pathname}?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="grid w-full grid-cols-4 gap-3">
      <input
        type="text"
        value={searchLocal}
        onChange={(e) => setSearchLocal(e.target.value)}
        placeholder="Buscar..."
        className="col-span-4 rounded-md bg-black/5 px-3 py-1.5 text-gray-900 outline-1 outline-gray-300 focus:outline-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white sm:col-span-3"
      />
      <button
        type="submit"
        className="col-span-4 rounded-md bg-black/5 px-3 py-1.5 text-gray-900 outline-1 outline-gray-300 transition hover:bg-black/10 focus:outline-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 sm:col-span-1"
      >
        Buscar
      </button>
    </form>
  )
}