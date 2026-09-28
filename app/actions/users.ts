'use server'

import { prisma } from '@/lib/prisma'
import { getUserAuth } from '@/app/actions/auth'
import { generateRandomCode, hashToken } from '@/lib/crypto'
import { revalidatePath } from 'next/cache'
import { sendVerificationEmail } from '@/lib/mailer'
import { Prisma, Rol } from '@prisma/client'

export interface UpdateUserInput {
  nombre?: string
  apellido?: string
  rol?: Rol
  activo?: boolean
  alias?: string
  cbuCvu?: string
  bancoOProveedor?: string
}

/**
 * Actualiza los datos de perfil de un usuario objetivo.
 * Restricciones:
 * - VENDEDOR / NO_VERIFICADO: Denegado.
 * - GERENTE: Solo puede editar usuarios (ej. Vendedores) asignados a su propio negocioId. No puede promover a ADMIN ni editar a otros GERENTE / ADMIN.
 * - ADMIN: Acceso global.
 */
export async function updateUser(targetUserId: string, formData: UpdateUserInput) {
  try {
    // 1. Obtener usuario en sesión
    const { data: currentUser } = await getUserAuth()

    if (!currentUser || !currentUser.id) {
      return { success: false, error: 'No autorizado. Inicie sesión nuevamente.' }
    }

    const isAdmin = currentUser.rol === Rol.ADMIN
    const isGerente = currentUser.rol === Rol.GERENTE

    // Si no es ni Admin ni Gerente -> Denegar acceso
    if (!isAdmin && !isGerente) {
      return { success: false, error: 'No tienes permisos para modificar usuarios.' }
    }

    // 2. Buscar al usuario objetivo en la BD
    const targetUser = await prisma.usuario.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        rol: true,
        negocioId: true,
      },
    })

    if (!targetUser) {
      return { success: false, error: 'El usuario a modificar no existe.' }
    }

    // 3. Validaciones específicas para el rol GERENTE
    if (isGerente) {
      // Un Gerente solo opera dentro de su mismo negocio
      if (!currentUser.negocioId || targetUser.negocioId !== currentUser.negocioId) {
        return {
          success: false,
          error: 'No tienes permiso para modificar usuarios asignados a otro negocio.',
        }
      }

      // Un Gerente no puede editar ni a otros Gerentes ni a Administradores
      if (targetUser.rol === Rol.ADMIN || targetUser.rol === Rol.GERENTE) {
        return {
          success: false,
          error: 'Un Gerente solo puede administrar usuarios de menor jerarquía (ej. Vendedores).',
        }
      }
    }

    // 4. Validación manual de datos de entrada
    const errors: Record<string, string> = {}

    if (!formData.apellido || formData.apellido.trim() === '') {
      errors.apellido = 'El apellido es obligatorio.'
    }

    // Un Gerente no puede asignar el rol ADMIN ni GERENTE
    if (isGerente && formData.rol && (formData.rol === Rol.ADMIN || formData.rol === Rol.GERENTE)) {
      errors.rol = 'No tienes permisos para asignar roles administrativos o gerenciales.'
    }

    // CBU / CVU: Opcional, pero de venir debe ser numérico de 22 dígitos
    if (formData.cbuCvu && formData.cbuCvu.trim() !== '') {
      const cleanCbu = formData.cbuCvu.trim()
      if (cleanCbu.length !== 22 || !/^\d+$/.test(cleanCbu)) {
        errors.cbuCvu = 'El CBU/CVU debe estar compuesto por exactamente 22 números.'
      }
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        error: 'Por favor, corrige los errores señalados en el formulario.',
        errors,
      }
    }

    // 5. Actualización en la base de datos (se preservan email y contraseña sin cambios)
    const updatedUser = await prisma.usuario.update({
      where: { id: targetUserId },
      data: {
        nombre: formData.nombre?.trim() || null,
        apellido: formData.apellido?.trim() || null,
        rol: formData.rol,
        activo: typeof formData.activo === 'boolean' ? formData.activo : undefined,
        alias: formData.alias?.trim() || null,
        cbuCvu: formData.cbuCvu?.trim() || null,
        bancoOProveedor: formData.bancoOProveedor?.trim() || null,
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        activo: true,
        alias: true,
        cbuCvu: true,
        bancoOProveedor: true,
        negocioId: true,
        updatedAt: true,
      },
    })

    revalidatePath(`/usuarios/${targetUserId}`)
    revalidatePath('/usuarios')

    return {
      success: true,
      data: updatedUser,
    }
  } catch (error) {
    console.error('Error en updateUser con Prisma:', error)
    return {
      success: false,
      error: 'Ocurrió un error inesperado al intentar actualizar el usuario.',
    }
  }
}

/**
 * Obtiene los detalles de un usuario por ID.
 * Permite a un usuario consultar su propio perfil, a un GERENTE consultar usuarios de su negocio,
 * y a un ADMIN consultar cualquier perfil.
 */
export async function getUserById(targetUserId: string) {
  try {
    const { data: currentUser } = await getUserAuth()

    if (!currentUser || !currentUser.id) {
      return { success: false, error: 'No autorizado. Inicie sesión nuevamente.' }
    }

    const isSelf = currentUser.id === targetUserId
    const isAdmin = currentUser.rol === Rol.ADMIN
    const isGerente = currentUser.rol === Rol.GERENTE

    // Un Vendedor u otro rol solo puede ver su propio perfil
    if (!isSelf && !isAdmin && !isGerente) {
      return { success: false, error: 'No tienes permisos para ver este perfil.' }
    }

    const whereCondition: Prisma.UsuarioWhereInput = {
      id: targetUserId,
    }

    // Filtros de aislamiento por negocio para el rol GERENTE
    if (isGerente && !isAdmin && !isSelf) {
      if (!currentUser.negocioId) {
        return {
          success: false,
          error: 'El usuario Gerente no tiene un negocio asignado.',
        }
      }
      whereCondition.negocioId = currentUser.negocioId
    }

    const targetUser = await prisma.usuario.findFirst({
      where: whereCondition,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        activo: true,
        alias: true,
        cbuCvu: true,
        bancoOProveedor: true,
        qrToken: true,
        qrCreatedAt: true,
        negocioId: true,
        negocio: {
          select: {
            id: true,
            nombre: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!targetUser) {
      return {
        success: false,
        error: 'Usuario no encontrado o no tienes permisos para acceder a este perfil.',
      }
    }

    return {
      success: true,
      data: targetUser,
    }
  } catch (error) {
    console.error('Error al obtener usuario en Prisma:', error)
    return {
      success: false,
      error: 'Ocurrió un error inesperado en el servidor.',
    }
  }
}

interface GetUsersParams {
  search?: string
  sort?: string
  page?: number
  negocioId?: string
}

const ALLOWED_SORT_FIELDS: (keyof Prisma.UsuarioOrderByWithRelationInput)[] = [
  'nombre',
  'apellido',
  'email',
  'rol',
  'bancoOProveedor',
  'activo',
  'createdAt',
]

/**
 * Obtiene el listado paginado de usuarios aplicando control de acceso según el ROL:
 * - VENDEDOR / NO_VERIFICADO: Bloqueado.
 * - GERENTE: Ve únicamente a los usuarios pertenecientes a su `negocioId`.
 * - ADMIN: Ve a todos los usuarios (y puede filtrar opcionalmente por `negocioId`).
 */
export async function getUsers({
  search = '',
  sort = '',
  page = 1,
  negocioId,
}: GetUsersParams) {
  try {
    const { data: currentUser } = await getUserAuth()

    if (!currentUser || !currentUser.id) {
      return {
        success: false,
        message: 'No autorizado. Inicie sesión nuevamente.',
        data: [],
        totalPages: 1,
      }
    }

    // 🔒 Vendedores o usuarios sin privilegios no pueden ver listados
    if (currentUser.rol !== Rol.ADMIN && currentUser.rol !== Rol.GERENTE) {
      return {
        success: false,
        message: 'No tienes permisos para consultar la lista de usuarios.',
        data: [],
        totalPages: 1,
      }
    }

    const limit = 10
    const skip = Math.max(0, (page - 1) * limit)

    // 1. Manejo de ordenamiento
    let orderBy: Prisma.UsuarioOrderByWithRelationInput = { createdAt: 'desc' }

    if (sort) {
      const isDesc = sort.endsWith('Desc')
      const isAsc = sort.endsWith('Asc')

      if (isDesc || isAsc) {
        const direction: 'asc' | 'desc' = isDesc ? 'desc' : 'asc'
        const field = sort.slice(0, isDesc ? -4 : -3)

        if (field === 'negocio') {
          orderBy = {
            negocio: {
              nombre: direction,
            },
          }
        } else if (
          ALLOWED_SORT_FIELDS.includes(field as keyof Prisma.UsuarioOrderByWithRelationInput)
        ) {
          orderBy = { [field]: direction }
        }
      }
    }

    // 2. Construcción de filtros restringidos por Rol
    const whereConditions: Prisma.UsuarioWhereInput[] = []

    if (currentUser.rol === Rol.GERENTE) {
      if (!currentUser.negocioId) {
        return {
          success: false,
          message: 'Tu usuario Gerente no posee un negocio asignado.',
          data: [],
          totalPages: 1,
        }
      }
      // Forzar aislamiento al negocio del Gerente
      whereConditions.push({ negocioId: currentUser.negocioId })
    } else if (currentUser.rol === Rol.ADMIN && negocioId) {
      // Un Administrador puede filtrar opcionalmente por negocioId
      whereConditions.push({ negocioId })
    }

    // Búsqueda por texto
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
          { negocio: { nombre: { contains: query, mode: 'insensitive' } } },
        ],
      })
    }

    const whereCondition: Prisma.UsuarioWhereInput =
      whereConditions.length > 0 ? { AND: whereConditions } : {}

    // 3. Ejecución de la consulta
    const [data, totalCount] = await Promise.all([
      prisma.usuario.findMany({
        where: whereCondition,
        orderBy,
        take: limit,
        skip,
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
          activo: true,
          alias: true,
          cbuCvu: true,
          bancoOProveedor: true,
          negocioId: true,
          createdAt: true,
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

/**
 * Pre-registra un nuevo usuario creando la entidad con estado NO_VERIFICADO
 * e iniciando el envío del código OTP al correo.
 */
export async function preRegisterUser(
  prevState: PreRegisterUserState,
  formData: FormData
): Promise<PreRegisterUserState> {
  const { data: currentUser } = await getUserAuth()

  if (!currentUser || !currentUser.id) {
    return { error: 'Debes iniciar sesión para realizar esta acción.' }
  }

  if (currentUser.rol !== Rol.ADMIN && currentUser.rol !== Rol.GERENTE) {
    return {
      error: 'No tienes permisos suficientes para pre-registrar usuarios.',
    }
  }

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  let targetNegocioId: string | null = null

  if (currentUser.rol === Rol.GERENTE) {
    if (!currentUser.negocioId) {
      return {
        error: 'Tu usuario Gerente no tiene un negocio asignado asociado.',
      }
    }
    targetNegocioId = currentUser.negocioId
  } else if (currentUser.rol === Rol.ADMIN) {
    targetNegocioId = (formData.get('negocioId') as string)?.trim() || null
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Ingresa un correo electrónico válido.' }
  }

  let rawCodeToSend: string | null = null

  try {
    await prisma.$transaction(async (tx) => {
      const existingUser = await tx.usuario.findUnique({
        where: { email },
      })

      if (existingUser) {
        throw new Error('El usuario con este correo electrónico ya se encuentra registrado.')
      }

      const newUser = await tx.usuario.create({
        data: {
          email,
          rol: Rol.NO_VERIFICADO,
          nombre: '',
          passwordHash: '',
          negocioId: targetNegocioId,
        },
      })

      const rawCode = generateRandomCode()
      const tokenHash = hashToken(rawCode)
      rawCodeToSend = rawCode

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await tx.verificationCode.create({
        data: {
          email: newUser.email,
          token: tokenHash,
          expiresAt,
          used: false,
        },
      })
    })

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