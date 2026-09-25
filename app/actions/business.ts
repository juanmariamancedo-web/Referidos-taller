'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface UpdateBusinessState {
  error?: string
  success?: boolean
}

/**
 * Obtiene un negocio por su ID junto con el email del primer usuario/encargado asignado.
 */
export async function getBusinessById(id: string) {
  try {
    const negocio = await prisma.negocio.findUnique({
      where: { id },
      include: {
        usuarios: {
          take: 1,
          select: { email: true },
        },
      },
    })

    if (!negocio) {
      return { success: false, message: 'Negocio no encontrado', data: null }
    }

    return {
      success: true,
      data: {
        ...negocio,
        userEmail: negocio.usuarios[0]?.email || '',
        // Convertimos el Decimal de Prisma a un number nativo de JS
        porcentajeFee: negocio.porcentajeFee ? Number(negocio.porcentajeFee) : 0,
      },
    }
  } catch (error) {
    console.error('Error en getBusinessById:', error)
    return { success: false, message: 'Error al obtener el negocio', data: null }
  }
}

/**
 * Actualiza un negocio existente (Rango Admin sin restricciones).
 */
export async function updateBusiness(
  businessId: string,
  prevState: UpdateBusinessState,
  formData: FormData
): Promise<UpdateBusinessState> {
  // 1. Verificación de Autenticación y Autorización
  const { data: user } = await getUserAuth()

  if (!user || user.rol !== 'ADMIN') {
    return {
      error: 'Acceso denegado: Se requieren permisos de Administrador.',
    }
  }

  if (!businessId) {
    return { error: 'El ID del negocio es obligatorio.' }
  }

  // 2. Extracción y Limpieza de Parámetros
  const userEmail = (formData.get('userEmail') as string)?.trim().toLowerCase()
  const nombre = (formData.get('nombre') as string)?.trim()
  const direccion = (formData.get('direccion') as string)?.trim() || null
  const porcentajeFee = parseFloat(formData.get('porcentajeFee') as string) || 0
  const bancoOProveedor = (formData.get('bancoOProveedor') as string)?.trim() || null
  const alias = (formData.get('alias') as string)?.trim() || null
  const cbuCvu = (formData.get('cbuCvu') as string)?.trim() || null
  const activo = formData.get('activo') === 'on'

  // 3. Validaciones Primarias
  if (!userEmail) {
    return { error: 'El email del usuario/encargado es obligatorio.' }
  }

  if (!nombre) {
    return { error: 'El nombre del negocio es obligatorio.' }
  }

  try {
    // 4. Buscar el usuario objetivo o pre-registrarlo si no existe
    let targetUser = await prisma.usuario.findUnique({
      where: { email: userEmail },
    })

    if (!targetUser) {
      const userFormData = new FormData()
      userFormData.append('email', userEmail)

      const preRegisterResult = await preRegisterUser({}, userFormData)

      if (preRegisterResult.error) {
        return {
          error: `Error al pre-registrar el nuevo usuario encargado: ${preRegisterResult.error}`,
        }
      }

      targetUser = await prisma.usuario.findUnique({
        where: { email: userEmail },
      })

      if (!targetUser) {
        return {
          error: 'No se pudo recuperar el usuario pre-registrado.',
        }
      }
    }

    // 5. Actualizar el Negocio y conectar/vincular el nuevo usuario encargado
    await prisma.negocio.update({
      where: { id: businessId },
      data: {
        nombre,
        direccion,
        porcentajeFee,
        bancoOProveedor,
        alias,
        cbuCvu,
        activo,
        usuarios: {
          connect: { id: targetUser.id },
        },
      },
    })

    // 6. Si el usuario reasignado/asociado no tenía este negocioId, lo actualizamos
    if (targetUser.negocioId !== businessId) {
      await prisma.usuario.update({
        where: { id: targetUser.id },
        data: { negocioId: businessId },
      })
    }
  } catch (error: any) {
    console.error('Error al ejecutar updateBusiness:', error)
    return {
      error:
        error.message ||
        'Ocurrió un error inesperado al actualizar el negocio en la base de datos.',
    }
  }

  // 7. Revalidación de Caché y Redirección
  revalidatePath('/negocios')
  revalidatePath(`/negocios/${businessId}`)
  redirect('/negocios')
}

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


import { getUserAuth } from '@/app/actions/auth'
import { preRegisterUser } from '@/app/actions/users' // Importamos la Server Action de pre-registro
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface CreateBusinessState {
  error?: string
  success?: boolean
}

export async function createBusiness(
  prevState: CreateBusinessState,
  formData: FormData
): Promise<CreateBusinessState> {
  // 1. Verificación de Autenticación y Autorización
  const { data: user } = await getUserAuth()

  if (!user || user.rol !== 'ADMIN') {
    return {
      error: 'Acceso denegado: Se requieren permisos de Administrador.',
    }
  }

  // 2. Extracción y Limpieza de Parámetros
  const userEmail = (formData.get('userEmail') as string)?.trim().toLowerCase()
  const nombre = (formData.get('nombre') as string)?.trim()
  const direccion = (formData.get('direccion') as string)?.trim() || null
  const porcentajeFee = parseFloat(formData.get('porcentajeFee') as string) || 0
  const bancoOProveedor = (formData.get('bancoOProveedor') as string)?.trim() || null
  const alias = (formData.get('alias') as string)?.trim() || null
  const cbuCvu = (formData.get('cbuCvu') as string)?.trim() || null
  const activo = formData.get('activo') === 'on'

  // 3. Validaciones Primarias
  if (!userEmail) {
    return { error: 'El email del usuario/encargado es obligatorio.' }
  }

  if (!nombre) {
    return { error: 'El nombre del negocio es obligatorio.' }
  }

  try {
    // 4. Verificar si el usuario existe antes de intentar pre-registrarlo
    let targetUser = await prisma.usuario.findUnique({
      where: { email: userEmail },
    })

    // Si el usuario NO existe, usamos la Server Action preRegisterUser
    if (!targetUser) {
      const userFormData = new FormData()
      userFormData.append('email', userEmail)

      const preRegisterResult = await preRegisterUser({}, userFormData)

      if (preRegisterResult.error) {
        return {
          error: `Error al pre-registrar el usuario encargado: ${preRegisterResult.error}`,
        }
      }

      // Obtener el usuario recién pre-registrado
      targetUser = await prisma.usuario.findUnique({
        where: { email: userEmail },
      })

      if (!targetUser) {
        return {
          error: 'No se pudo recuperar el usuario pre-registrado.',
        }
      }
    }

    // 5. Crear el Negocio y Vincular al Usuario
    const nuevoNegocio = await prisma.negocio.create({
      data: {
        nombre,
        direccion,
        porcentajeFee,
        bancoOProveedor,
        alias,
        cbuCvu,
        activo,
        usuarios: {
          connect: { id: targetUser.id },
        },
      },
    })

    // 6. Asignar el negocioId al usuario si aún no tenía uno
    if (!targetUser.negocioId) {
      await prisma.usuario.update({
        where: { id: targetUser.id },
        data: {
          negocioId: nuevoNegocio.id,
        },
      })
    }
  } catch (error: any) {
    console.error('Error al ejecutar createBusiness:', error)
    return {
      error:
        error.message ||
        'Ocurrió un error inesperado al guardar el negocio en la base de datos.',
    }
  }

  // 7. Revalidación de Caché y Redirección
  revalidatePath('/negocios')
  redirect('/negocios')
}