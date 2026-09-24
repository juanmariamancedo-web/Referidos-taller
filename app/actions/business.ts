'use server'

import { prisma } from '@/lib/prisma' // Ajusta la ruta a tu instancia de Prisma

interface GetBusinessParams {
  search?: string
  sort?: string
  page?: number
}

export async function getBusiness({ search = '', sort = '', page = 1 }: GetBusinessParams) {
  try {
    const limit = 10
    const skip = (page - 1) * limit

    // Configurar el orden según el parámetro 'sort' (ej: "nombre_asc", "nombre_desc")
    let orderBy: any = { createdAt: 'desc' }
    if (sort) {
      const [field, direction] = sort.split('_')
      if (field) {
        orderBy = { [field]: direction || 'asc' }
      }
    }

    // Consulta con filtros
    const [data, totalCount] = await Promise.all([
      prisma.negocio.findMany({
        where: {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' } },
            { alias: { contains: search, mode: 'insensitive' } },
          ],
        },
        orderBy,
        take: limit,
        skip,
      }),
      prisma.negocio.count({
        where: {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' } },
            { alias: { contains: search, mode: 'insensitive' } },
          ],
        },
      }),
    ])

    return {
      success: true,
      data,
      totalPages: Math.ceil(totalCount / limit) || 1,
    }
  } catch (error) {
    console.error('Error en getBusiness:', error)
    return {
      success: false,
      message: 'Error al obtener la lista de negocios',
    }
  }
}