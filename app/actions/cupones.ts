"use server"

import { prisma } from "@/lib/prisma"
import { EstadoCupon, Prisma } from "@prisma/client"

// 1. Definimos la forma exacta del payload usando los tipos generados de Prisma
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

// Extraemos el tipo resultante automáticamente
export type CuponConRelaciones = Prisma.CuponGetPayload<typeof cuponWithRelations>

interface GetCuponesParams {
  search?: string
  sort?: string
  page?: number
  pageSize?: number
  estado?: string
}

export interface GetCuponesResponse {
  success: boolean
  message?: string
  data?: CuponConRelaciones[]
  totalItems?: number
  totalPages?: number
  currentPage?: number
}

export async function getCupones({
  search = "",
  sort = "",
  page = 1,
  pageSize = 10,
  estado = "",
}: GetCuponesParams): Promise<GetCuponesResponse> {
  try {
    const currentPage = Math.max(1, Number(page))
    const limit = Math.max(1, Number(pageSize))
    const skip = (currentPage - 1) * limit

    const where: Prisma.CuponWhereInput = {}

    if (estado && Object.values(EstadoCupon).includes(estado as EstadoCupon)) {
      where.estado = estado as EstadoCupon
    }

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
        select: cuponWithRelations.select, // Usamos la misma estructura declarada arriba
      }),
    ])

    const totalPages = Math.ceil(totalItems / limit) || 1

    return {
      success: true,
      data: cupones,
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


// Definimos la estructura del payload para la vista de detalle
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

export type CuponDetalle = Prisma.CuponGetPayload<typeof cuponDetallePayload>

export interface GetCuponByIdResponse {
  success: boolean
  message?: string
  data?: CuponDetalle | null
}

export async function getCuponById(id: string): Promise<GetCuponByIdResponse> {
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

    return {
      success: true,
      data: cupon,
    }
  } catch (error) {
    console.error("Error al obtener el detalle del cupón:", error)
    return {
      success: false,
      message: "Ocurrió un error al cargar la información del cupón",
    }
  }
}

export interface ValidarCuponResponse {
  success: boolean
  message: string
  cupon?: {
    codigo: string
    valorDescuento: number
    tipoDescuento: string
    clienteNombre?: string
    clienteTelefono: string
  }
}

export async function validarYCanjearCupon(codigo: string): Promise<ValidarCuponResponse> {
  try {
    if (!codigo || !codigo.trim()) {
      return { success: false, message: "El código de cupón es requerido." }
    }

    const codigoLimpio = codigo.trim()

    // 1. Buscar el cupón con sus datos de cliente
    const cupon = await prisma.cupon.findUnique({
      where: { codigo: codigoLimpio },
      include: { cliente: true },
    })

    if (!cupon) {
      return { success: false, message: "Cupón no encontrado." }
    }

    // 2. Validar Estado
    if (cupon.estado === EstadoCupon.USADO) {
      return {
        success: false,
        message: `El cupón ya fue canjeado previamente el ${cupon.fechaUso?.toLocaleDateString("es-AR")}.`,
      }
    }

    if (cupon.estado === EstadoCupon.VENCIDO) {
      return { success: false, message: "El cupón se encuentra vencido." }
    }

    // 3. Validar Expiración
    if (cupon.fechaExpiracion && new Date(cupon.fechaExpiracion) < new Date()) {
      // Marcar como vencido automáticamente si expiró
      await prisma.cupon.update({
        where: { id: cupon.id },
        data: { estado: EstadoCupon.VENCIDO },
      })
      return { success: false, message: "El cupón ha expirado." }
    }

    // 4. Canjear Cupón (Cambiar a USADO y fijar fechaUso)
    const cuponActualizado = await prisma.cupon.update({
      where: { id: cupon.id },
      data: {
        estado: EstadoCupon.USADO,
        fechaUso: new Date(),
      },
    })

    return {
      success: true,
      message: "¡Cupón validado y canjeado con éxito!",
      cupon: {
        codigo: cuponActualizado.codigo,
        valorDescuento: Number(cuponActualizado.valorDescuento),
        tipoDescuento: cuponActualizado.tipoDescuento,
        clienteNombre: cupon.cliente.nombre || undefined,
        clienteTelefono: cupon.cliente.telefono,
      },
    }
  } catch (error) {
    console.error("Error al validar cupón:", error)
    return { success: false, message: "Ocurrió un error al procesar el cupón." }
  }
}