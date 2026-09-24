"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

interface Props {
  className?: string
  serverArg: string
  name: string
}

export function Sort({ className, serverArg, name }: Props) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  // Lee el parámetro de ordenamiento actual directamente de la URL
  const sort = searchParams.get("sort")

  function toggleSort() {
    const params = new URLSearchParams(searchParams)

    // Si ya está en Asc, cambia a Desc; de lo contrario, establece Asc
    if (sort === `${serverArg}Asc`) {
      params.set("sort", `${serverArg}Desc`)
    } else {
      params.set("sort", `${serverArg}Asc`)
    }

    // Opcional: Resetea la página a 1 al cambiar el orden
    params.set("page", "1")

    replace(`${pathname}?${params.toString()}`)
  }

  return (
    <button onClick={toggleSort} className={className}>
      {sort === `${serverArg}Desc` && <>↓ </>}
      {sort === `${serverArg}Asc` && <>↑ </>}
      {name}
    </button>
  )
}