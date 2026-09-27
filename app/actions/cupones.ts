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