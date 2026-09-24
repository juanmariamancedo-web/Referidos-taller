'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

interface GetBusinessParams {
  search?: string
  sort?: string
  page?: number
}

// Lista de campos permitidos para ordenar basados en la tabla Negocio
const ALLOWED_SORT_FIELDS: (keyof Prisma.NegocioOrderByWithRelationInput)[] = [
  'nombre',
  'direccion',
  'porcentajeFee',
  'bancoOProveedor',
  'alias',
  'cbuCvu',
  'activo',
  'createdAt',
  'updatedAt',
]

export async function getBusiness({ search = '', sort = '', page = 1 }: GetBusinessParams) {
  try {
    const limit = 10
    const skip = (page - 1) * limit

    // Orden por defecto
    let orderBy: Prisma.NegocioOrderByWithRelationInput = { createdAt: 'desc' }

    if (sort) {
      const isDesc = sort.endsWith('Desc')
      const isAsc = sort.endsWith('Asc')

      if (isDesc || isAsc) {
        const direction: 'asc' | 'desc' = isDesc ? 'desc' : 'asc'
        const field = sort.slice(0, isDesc ? -4 : -3) as keyof Prisma.NegocioOrderByWithRelationInput

        // Validar que el campo exista dentro de los campos permitidos
        if (ALLOWED_SORT_FIELDS.includes(field)) {
          orderBy = { [field]: direction }
        }
      }
    }

    // Condición de búsqueda general
    const whereCondition: Prisma.NegocioWhereInput = search.trim()
      ? {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' } },
            { alias: { contains: search, mode: 'insensitive' } },
            { direccion: { contains: search, mode: 'insensitive' } },
            { bancoOProveedor: { contains: search, mode: 'insensitive' } },
            { cbuCvu: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}

    // Consulta en paralelo de los negocios y el conteo total
    const [data, totalCount] = await Promise.all([
      prisma.negocio.findMany({
        where: whereCondition,
        orderBy,
        take: limit,
        skip,
      }),
      prisma.negocio.count({
        where: whereCondition,
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
      data: [],
      totalPages: 1,
    }
  }
}