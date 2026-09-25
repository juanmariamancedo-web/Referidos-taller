'use server'

import { prisma } from '@/lib/prisma'
import { getUserAuth } from '@/app/actions/auth'
import { generateRandomCode, hashToken } from '@/lib/crypto'
import { revalidatePath } from 'next/cache'
import { sendVerificationEmail } from '@/lib/mailer'
import { Prisma } from '@prisma/client'


interface GetUsersParams {
  search?: string
  sort?: string
  page?: number
  negocioId?: string // <--- Nuevo parámetro para filtro directo por ID de negocio
}

// Campos permitidos para ordenamiento directo en el modelo Usuario
const ALLOWED_SORT_FIELDS: (keyof Prisma.UsuarioOrderByWithRelationInput)[] = [
  'nombre',
  'apellido',
  'email',
  'rol',
  'bancoOProveedor',
  'activo',
  'createdAt',
]

export async function getUsers({
  search = '',
  sort = '',
  page = 1,
  negocioId,
}: GetUsersParams) {
  try {
    const limit = 10
    const skip = (page - 1) * limit

    // 1. Manejo del ordenamiento
    let orderBy: Prisma.UsuarioOrderByWithRelationInput = { createdAt: 'desc' }

    if (sort) {
      const isDesc = sort.endsWith('Desc')
      const isAsc = sort.endsWith('Asc')

      if (isDesc || isAsc) {
        const direction: 'asc' | 'desc' = isDesc ? 'desc' : 'asc'
        const field = sort.slice(0, isDesc ? -4 : -3)

        // Caso especial: Ordenar por el nombre de la relación Negocio
        if (field === 'negocio') {
          orderBy = {
            negocio: {
              nombre: direction,
            },
          }
        } 
        // Ordenar por campos directos permitidos de Usuario
        else if (ALLOWED_SORT_FIELDS.includes(field as keyof Prisma.UsuarioOrderByWithRelationInput)) {
          orderBy = { [field]: direction }
        }
      }
    }

    // 2. Construcción de condiciones WHERE
    const whereConditions: Prisma.UsuarioWhereInput[] = []

    // Filtro por ID de negocio si viene presente
    if (negocioId) {
      whereConditions.push({ negocioId })
    }

    // Filtro de búsqueda general
    if (search.trim()) {
      const query = search.trim()
      whereConditions.push({
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { apellido: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { bancoOProveedor: { contains: query, mode: 'insensitive' } },
          { alias: { contains: query, mode: 'insensitive' } },
          { cbuCvu: { contains: query, mode: 'insensitive' } },
          // Búsqueda textual por el nombre del negocio relacionado
          { negocio: { nombre: { contains: query, mode: 'insensitive' } } },
        ],
      })
    }

    // Combinar los filtros dentro del objeto `where`
    const whereCondition: Prisma.UsuarioWhereInput =
      whereConditions.length > 0 ? { AND: whereConditions } : {}

    // 3. Consulta a la base de datos
    const [data, totalCount] = await Promise.all([
      prisma.usuario.findMany({
        where: whereCondition,
        orderBy,
        take: limit,
        skip,
        include: {
          negocio: {
            select: { id: true, nombre: true },
          },
        },
      }),
      prisma.usuario.count({
        where: whereCondition,
      }),
    ])

    return {
      success: true,
      data,
      totalPages: Math.ceil(totalCount / limit) || 1,
    }
  } catch (error) {
    console.error('Error en getUsers:', error)
    return {
      success: false,
      message: 'Error al obtener la lista de usuarios',
      data: [],
      totalPages: 1,
    }
  }
}

export interface PreRegisterUserState {
  error?: string
  success?: boolean
}

export async function preRegisterUser(
  prevState: PreRegisterUserState,
  formData: FormData
): Promise<PreRegisterUserState> {
  // 1. Verificación de Autenticación
  const { data: currentUser } = await getUserAuth()

  if (!currentUser) {
    return { error: 'Debes iniciar sesión para realizar esta acción.' }
  }

  // 2. Control de Acceso por Rol (Solo ADMIN y GERENTE)
  if (currentUser.rol !== 'ADMIN' && currentUser.rol !== 'GERENTE') {
    return {
      error: 'No tienes permisos suficientes para pre-registrar usuarios.',
    }
  }

  // 3. Extracción de Parámetros
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  let targetNegocioId: string | null = null

  // Determinación del negocioId según el rol
  if (currentUser.rol === 'GERENTE') {
    if (!currentUser.negocioId) {
      return {
        error: 'Tu usuario Gerente no tiene un negocio asignado asociado.',
      }
    }
    targetNegocioId = currentUser.negocioId
  } else if (currentUser.rol === 'ADMIN') {
    targetNegocioId = (formData.get('negocioId') as string)?.trim() || null
  }

  if (!email) {
    return { error: 'El email del usuario es obligatorio.' }
  }

  let rawCodeToSend: string | null = null

  try {
    await prisma.$transaction(async (tx) => {
      // 4. Verificar si el usuario ya existe
      const existingUser = await tx.usuario.findUnique({
        where: { email },
      })

      if (existingUser) {
        throw new Error('El usuario con este correo electrónico ya se encuentra registrado.')
      }

      // 5. Crear el nuevo usuario con rol NO_VERIFICADO
      const newUser = await tx.usuario.create({
        data: {
          email,
          rol: 'NO_VERIFICADO',
          nombre: '',
          passwordHash: '',
          negocioId: targetNegocioId,
        },
      })

      // 6. Generar el código de verificación con @/lib/crypto
      const rawCode = generateRandomCode()
      const tokenHash = hashToken(rawCode)
      rawCodeToSend = rawCode

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas de validez

      await tx.verificationCode.create({
        data: {
          email: newUser.email,
          token: tokenHash,
          expiresAt,
          used: false,
        },
      })
    })

    // 7. Enviar el correo electrónico con el código original (rawCode)
    if (rawCodeToSend) {
      await sendVerificationEmail(email, rawCodeToSend)
    }
  } catch (error: any) {
    console.error('Error en preRegisterUser:', error)
    return {
      error: error.message || 'Ocurrió un error inesperado al pre-registrar el usuario.',
    }
  }

  revalidatePath('/usuarios')
  return { success: true }
}