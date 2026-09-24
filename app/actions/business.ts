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


import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getUserAuth } from '@/app/actions/auth' // Ajusta la ruta a la ubicación de tu helper

export interface CreateBusinessState {
  error?: string
  success?: boolean
}

export async function createBusiness(prevState: CreateBusinessState, formData: FormData): Promise<CreateBusinessState> {
  // 1. Autorización de administrador
  const { data : user } = await getUserAuth()
  if (!user || user.rol !== 'ADMIN') {
    return { error: 'No tienes permisos de administrador para realizar esta acción.' }
  }

  // 2. Extraer datos del formulario
  const nombre = formData.get('nombre') as string
  const userEmail = (formData.get('userEmail') as string)?.trim().toLowerCase()
  const direccion = formData.get('direccion') as string
  const porcentajeFee = parseFloat(formData.get('porcentajeFee') as string) || 0
  const bancoOProveedor = formData.get('bancoOProveedor') as string
  const alias = formData.get('alias') as string
  const cbuCvu = formData.get('cbuCvu') as string
  const activo = formData.get('activo') === 'on'

  // Validaciones primarias
  if (!nombre || nombre.trim() === '') {
    return { error: 'El nombre del negocio es obligatorio.' }
  }

  if (!userEmail) {
    return { error: 'El email del usuario asociado es obligatorio.' }
  }

  try {
    // 3. Transacción en la base de datos
    await prisma.$transaction(async (tx) => {
      // Verificar si el usuario ya existe por email
      let targetUser = await tx.usuario.findUnique({
        where: { email: userEmail },
      })

      // Si no existe, se crea un nuevo usuario
      if (!targetUser) {
        targetUser = await tx.usuario.create({
          data: {
            email: userEmail,
            rol: "VENDEDOR", // Rol por defecto
          },
        })
      }

      // Crear el negocio asociándolo al usuario encontrado o creado
      await tx.negocio.create({
        data: {
          nombre: nombre.trim(),
          direccion: direccion?.trim() || null,
          porcentajeFee,
          bancoOProveedor: bancoOProveedor?.trim() || null,
          alias: alias?.trim() || null,
          cbuCvu: cbuCvu?.trim() || null,
          activo,
          // Conexión con la relación de Prisma
          userId: targetUser.id, 
        },
      })
    })

  } catch (error) {
    console.error('Error al crear o asociar negocio:', error)
    return { error: 'Ocurrió un error al procesar el usuario o guardar el negocio.' }
  }

  revalidatePath('/negocios')
  redirect('/negocios')
}