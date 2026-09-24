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

import { getUserAuth } from '@/app/actions/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { generateRandomCode, hashToken } from '@/lib/crypto'

export interface CreateBusinessState {
  error?: string
  success?: boolean
}

export async function createBusiness(
  prevState: CreateBusinessState,
  formData: FormData
): Promise<CreateBusinessState> {
  // 1. Verificación de Autenticación y Autorización
  const { data : user } = await getUserAuth()

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

  let rawCodeToSend: string | null = null

  try {
    // 4. Transacción Atómica en Prisma
    await prisma.$transaction(async (tx) => {
      // Buscar si el usuario ya existe por email
      let targetUser = await tx.usuario.findUnique({
        where: { email: userEmail },
      })

      let isNewUser = false

      // Si no existe, se pre-registra con el rol 'NO_VERIFICADO'
      if (!targetUser) {
        targetUser = await tx.usuario.create({
          data: {
            email: userEmail,
            rol: 'NO_VERIFICADO',
            nombre: '',       // Se completa con cadena vacía para TS y Prisma[cite: 1]
            passwordHash: '', // Se actualizará cuando el usuario defina su contraseña[cite: 1]
          },
        })
        isNewUser = true
      }

      // Crear el negocio asociando al usuario
      const nuevoNegocio = await tx.negocio.create({
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

      // Asignar el negocioId al usuario si no tenía uno asignado previamente
      if (!targetUser.negocioId) {
        await tx.usuario.update({
          where: { id: targetUser.id },
          data: { negocioId: nuevoNegocio.id },
        })
      }

      // Si el usuario es nuevo, generamos la entrada en VerificationCode
      if (isNewUser) {
        // Uso de las utilidades de @/lib/crypto
        const rawCode = generateRandomCode()
        const tokenHash = hashToken(rawCode)
        rawCodeToSend = rawCode

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // Expira en 24 horas

        await tx.verificationCode.create({
          data: {
            email: userEmail,
            token: tokenHash, // Hash almacenado en la base de datos
            expiresAt,
            used: false,
          },
        })
      }
    })

    // 5. Enviar el correo electrónico fuera de la transacción de la BD
    if (rawCodeToSend) {
      // TODO: Enviar email con el código rawCodeToSend
      // ej: await sendVerificationEmail(userEmail, rawCodeToSend)
    }
  } catch (error) {
    console.error('Error al ejecutar createBusiness:', error)
    return {
      error: 'Ocurrió un error inesperado al guardar el negocio en la base de datos.',
    }
  }

  // 6. Revalidación de Caché y Redirección
  revalidatePath('/negocios')
  redirect('/negocios')
}