"use server"

import { prisma } from "@/lib/prisma"
import { getUserAuth } from "@/app/actions/auth"
import { EstadoCupon, Prisma, Rol } from "@prisma/client"

// ----------------------------------------------------------------------
// 1. Definición de Payloads de Prisma
// ----------------------------------------------------------------------

const cuponWithRelations = Prisma.validator<Prisma.CuponDefaultArgs>()({
  select: {
    id: true,
    codigo: true,
    estado: true,
    tipoDescuento: true,
    valorDescuento: true,
    fechaExpiracion: true,
    fechaUso: true,
    createdAt: true,
    cliente: {
      select: {
        id: true,
        nombre: true,
        telefono: true,
      },
    },
    usuario: {
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
      },
    },
  },
})

const cuponDetallePayload = Prisma.validator<Prisma.CuponDefaultArgs>()({
  include: {
    cliente: true,
    usuario: {
      include: {
        negocio: {
          select: {
            id: true,
            nombre: true,
            porcentajeFee: true,
          },
        },
      },
    },
    liquidacionDetalle: {
      include: {
        liquidacion: {
          select: {
            id: true,
            periodo: true,
            estado: true,
          },
        },
      },
    },
  },
})

// ----------------------------------------------------------------------
// 2. Tipos Sanitizados para Client Components
// ----------------------------------------------------------------------

type RawCuponConRelaciones = Prisma.CuponGetPayload<typeof cuponWithRelations>
type RawCuponDetalle = Prisma.CuponGetPayload<typeof cuponDetallePayload>

export type CuponConRelaciones = Omit<
  RawCuponConRelaciones,
  "valorDescuento" | "createdAt" | "fechaExpiracion" | "fechaUso"
> & {
  valorDescuento: number
  createdAt: string
  fechaExpiracion: string | null
  fechaUso: string | null
}

export type CuponDetalle = Omit<
  RawCuponDetalle,
  "valorDescuento" | "createdAt" | "fechaExpiracion" | "fechaUso"
> & {
  valorDescuento: number
  createdAt: string
  fechaExpiracion: string | null
  fechaUso: string | null
}

// ----------------------------------------------------------------------
// 3. Helper de Sanitización
// ----------------------------------------------------------------------

function formatCupon<T extends Record<string, any>>(cupon: T) {
  if (!cupon) return null
  return {
    ...cupon,
    valorDescuento: cupon.valorDescuento ? Number(cupon.valorDescuento) : 0,
    createdAt: cupon.createdAt ? new Date(cupon.createdAt).toISOString() : "",
    fechaExpiracion: cupon.fechaExpiracion
      ? new Date(cupon.fechaExpiracion).toISOString()
      : null,
    fechaUso: cupon.fechaUso ? new Date(cupon.fechaUso).toISOString() : null,
  }
}

// ----------------------------------------------------------------------
// 4. Interfaces de Respuesta
// ----------------------------------------------------------------------

interface GetCuponesParams {
  search?: string
  sort?: string
  page?: number
  pageSize?: number
  estado?: string
  usuarioId?: string // Permite filtrar opcionalmente por un usuario específico
}

export interface GetCuponesResponse {
  success: boolean
  message?: string
  data?: CuponConRelaciones[]
  totalItems?: number
  totalPages?: number
  currentPage?: number
}

export interface GetCuponByIdResponse {
  success: boolean
  message?: string
  data?: CuponDetalle | null
}

export interface ValidarCuponResponse {
  success: boolean
  message: string
  data?: any
}

// ----------------------------------------------------------------------
// 5. Server Actions
// ----------------------------------------------------------------------

/**
 * Obtiene un listado paginado de cupones filtrado según el ROL del usuario autenticado.
 */
export async function getCupones({
  search = "",
  sort = "",
  page = 1,
  pageSize = 10,
  estado = "",
  usuarioId,
}: GetCuponesParams): Promise<GetCuponesResponse> {
  // 🔒 1. Verificación de Autenticación
  const { data: userAuth } = await getUserAuth()
  if (!userAuth || !userAuth.id) {
    return {
      success: false,
      message: "No autenticado. Inicia sesión para ver los cupones.",
      data: [],
      totalItems: 0,
      totalPages: 1,
      currentPage: 1,
    }
  }

  try {
    const currentPage = Math.max(1, Number(page))
    const limit = Math.max(1, Number(pageSize))
    const skip = (currentPage - 1) * limit

    const where: Prisma.CuponWhereInput = {}

    // 🔒 2. Control de Permisos por Rol en la Cláusula WHERE
    if (userAuth.rol === Rol.ADMIN) {
      // ADMIN: Puede ver todos los cupones. Si se pasa `usuarioId`, se aplica como filtro opcional.
      if (usuarioId) {
        where.usuarioId = usuarioId
      }
    } else if (userAuth.rol === Rol.GERENTE) {
      // GERENTE: Solo ve sus propios cupones o los de vendedores pertenecientes a su mismo negocio
      if (usuarioId) {
        // Verificar que el usuario pedido pertenezca a su mismo negocio
        where.AND = [
          { usuarioId },
          { usuario: { negocioId: userAuth.negocioId } },
        ]
      } else {
        where.usuario = {
          negocioId: userAuth.negocioId,
        }
      }
    } else {
      // VENDEDOR: Solo puede consultar sus propios cupones obligatoriamente
      where.usuarioId = userAuth.id
    }

    // Filtro opcional por Estado del cupón
    if (estado && Object.values(EstadoCupon).includes(estado as EstadoCupon)) {
      where.estado = estado as EstadoCupon
    }

    // Buscador general
    if (search.trim()) {
      const query = search.trim()
      where.OR = [
        { codigo: { contains: query, mode: "insensitive" } },
        { cliente: { nombre: { contains: query, mode: "insensitive" } } },
        { cliente: { telefono: { contains: query, mode: "insensitive" } } },
        { usuario: { nombre: { contains: query, mode: "insensitive" } } },
        { usuario: { apellido: { contains: query, mode: "insensitive" } } },
        { usuario: { email: { contains: query, mode: "insensitive" } } },
      ]
    }

    let orderBy: Prisma.CuponOrderByWithRelationInput = { createdAt: "desc" }

    if (sort) {
      const [field, direction] = sort.split("-")
      const dir = direction?.toLowerCase() === "asc" ? "asc" : "desc"

      switch (field) {
        case "codigo":
        case "valorDescuento":
        case "estado":
        case "fechaExpiracion":
        case "fechaUso":
        case "createdAt":
          orderBy = { [field]: dir }
          break
        case "cliente.nombre":
          orderBy = { cliente: { nombre: dir } }
          break
        case "usuario.nombre":
          orderBy = { usuario: { nombre: dir } }
          break
        default:
          orderBy = { createdAt: "desc" }
      }
    }

    const [totalItems, cupones] = await prisma.$transaction([
      prisma.cupon.count({ where }),
      prisma.cupon.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: cuponWithRelations.select,
      }),
    ])

    const totalPages = Math.ceil(totalItems / limit) || 1

    return {
      success: true,
      data: cupones.map((c) => formatCupon(c) as CuponConRelaciones),
      totalItems,
      totalPages,
      currentPage,
    }
  } catch (error) {
    console.error("Error al obtener cupones:", error)
    return {
      success: false,
      message: "Ocurrió un error al cargar la lista de cupones.",
      data: [],
      totalItems: 0,
      totalPages: 1,
      currentPage: 1,
    }
  }
}

/**
 * Obtiene la información detallada de un cupón por su ID, validando los permisos del usuario logueado.
 */
export async function getCuponById(id: string): Promise<GetCuponByIdResponse> {
  // 🔒 1. Verificación de Autenticación
  const { data: userAuth } = await getUserAuth()
  if (!userAuth || !userAuth.id) {
    return { success: false, message: "No autenticado." }
  }

  try {
    if (!id) {
      return { success: false, message: "ID de cupón no proporcionado" }
    }

    const cupon = await prisma.cupon.findUnique({
      where: { id },
      include: cuponDetallePayload.include,
    })

    if (!cupon) {
      return { success: false, message: "El cupón solicitado no existe" }
    }

    // 🔒 2. Validación de Jerarquía y Permisos
    if (userAuth.rol === Rol.VENDEDOR && cupon.usuarioId !== userAuth.id) {
      return {
        success: false,
        message: "No tienes permiso para ver este cupón.",
      }
    }

    if (
      userAuth.rol === Rol.GERENTE &&
      cupon.usuario?.negocioId !== userAuth.negocioId
    ) {
      return {
        success: false,
        message: "No tienes permiso para acceder a cupones de otro negocio.",
      }
    }

    return {
      success: true,
      data: formatCupon(cupon) as unknown as CuponDetalle,
    }
  } catch (error) {
    console.error("Error al obtener el detalle del cupón:", error)
    return {
      success: false,
      message: "Ocurrió un error al cargar la información del cupón",
    }
  }
}

/**
 * Obtiene un cupón por su CÓDIGO (Consulta previa antes del canje).
 */
export async function getCuponByCodigo(codigo: string) {
  try {
    if (!codigo || typeof codigo !== "string") {
      return { success: false, message: "Código no provisto o inválido." }
    }

    const codigoLimpio = codigo.trim().toUpperCase()

    const cupon = await prisma.cupon.findUnique({
      where: { codigo: codigoLimpio },
      include: {
        cliente: true,
        usuario: {
          include: {
            negocio: true,
          },
        },
      },
    })

    if (!cupon) {
      return { success: false, message: "Cupón no encontrado." }
    }

    return {
      success: true,
      data: formatCupon(cupon),
    }
  } catch (error) {
    console.error("Error al obtener cupón por código:", error)
    return { success: false, message: "Error al consultar la base de datos." }
  }
}

/**
 * Valida y canjea un cupón (Cambia estado a USADO).
 * REQUIERE OBLIGATORIAMENTE ROL DE ADMINISTRADOR (ADMIN).
 */
/**
 * Valida y canjea un cupón (Cambia estado a USADO).
 * REQUIERE OBLIGATORIAMENTE ROL DE ADMINISTRADOR (ADMIN).
 */
export async function validarYCanjearCupon(
  codigo: string
): Promise<ValidarCuponResponse> {
  // 🔒 1. Verificación de Autenticación
  const { data: userAuth } = await getUserAuth()

  if (!userAuth || !userAuth.id) {
    return {
      success: false,
      message: "Debes iniciar sesión para poder canjear un cupón.",
    }
  }

  // 🔒 2. Validación de Rol estricta: SOLO ADMINISTRADORES
  if (userAuth.rol !== Rol.ADMIN) {
    return {
      success: false,
      message: "Acceso denegado: Solo los administradores pueden canjear cupones.",
    }
  }

  try {
    if (!codigo || typeof codigo !== "string") {
      return {
        success: false,
        message: "El código ingresado no es válido.",
      }
    }

    const codigoLimpio = codigo.trim().toUpperCase()

    const cupon = await prisma.cupon.findUnique({
      where: { codigo: codigoLimpio },
      include: {
        cliente: true,
        usuario: {
          include: {
            negocio: true,
          },
        },
      },
    })

    if (!cupon) {
      return {
        success: false,
        message: `El código ${codigoLimpio} no existe en el sistema.`,
      }
    }

    // 🕒 3. Comprobar vencimiento antes de cualquier verificación de estado
    const ahora = new Date()
    const estaVencidoPorFecha = cupon.fechaExpiracion && new Date(cupon.fechaExpiracion) < ahora

    if (cupon.estado === "VENCIDO" || estaVencidoPorFecha) {
      // Si el cupón estaba pendiente pero su fecha expiró, actualizamos el estado en BD
      if (cupon.estado !== "VENCIDO") {
        await prisma.cupon.update({
          where: { id: cupon.id },
          data: { estado: "VENCIDO" },
        })
        cupon.estado = "VENCIDO"
      }

      return {
        success: false,
        message: "Este cupón se encuentra vencido.",
        data: formatCupon(cupon),
      }
    }

    // 🔒 4. Comprobar si ya fue utilizado
    if (cupon.estado === "USADO") {
      return {
        success: false,
        message: "Este cupón ya fue canjeado anteriormente.",
        data: formatCupon(cupon),
      }
    }

    // Actualizar estado a USADO
    const cuponCanjeado = await prisma.cupon.update({
      where: { id: cupon.id },
      data: {
        estado: "USADO",
        fechaUso: ahora,
      },
      include: {
        cliente: true,
        usuario: {
          include: {
            negocio: true,
          },
        },
      },
    })

    return {
      success: true,
      message: "¡Cupón validado y canjeado con éxito!",
      data: formatCupon(cuponCanjeado),
    }
  } catch (error) {
    console.error("Error al validar/canjear el cupón:", error)
    return {
      success: false,
      message: "Ocurrió un error en el servidor al intentar validar el cupón.",
    }
  }
}