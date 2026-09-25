'use server'

import { prisma } from '@/lib/prisma'
import { getUserAuth } from '@/app/actions/auth'
import { generateRandomCode, hashToken } from '@/lib/crypto'
import { revalidatePath } from 'next/cache'
import { sendVerificationEmail } from '@/lib/mailer'
import { Prisma } from '@prisma/client'
import { Rol } from "@prisma/client"

export interface UpdateUserInput {
  nombre?: string
  apellido?: string
  email?: string
  rol?: Rol
  activo?: boolean
  alias?: string
  cbuCvu?: string
  bancoOProveedor?: string
}

export async function updateUser(targetUserId: string, formData: UpdateUserInput) {
  try {
    // 1. Obtener usuario en sesión que ejecuta la acción
    const { data: currentUser } = await getUserAuth()

    if (!currentUser) {
      return { success: false, error: "No autorizado. Inicie sesión nuevamente." }
    }

    const isAdmin = currentUser.rol === "ADMIN"
    const isGerente = currentUser.rol === "GERENTE"

    // Si no es ni Admin ni Gerente -> Denegar
    if (!isAdmin && !isGerente) {
      return { success: false, error: "No tienes permisos para modificar usuarios." }
    }

    // 2. Buscar al usuario objetivo en la BD
    const targetUser = await prisma.usuario.findUnique({
      where: { id: targetUserId },
    })

    if (!targetUser) {
      return { success: false, error: "El usuario a modificar no existe." }
    }

    // 3. Restricción de Negocio para Gerentes
    if (isGerente && targetUser.negocioId !== currentUser.negocioId) {
      return {
        success: false,
        error: "No tienes permiso para modificar usuarios asignados a otro negocio.",
      }
    }

    // 4. Validación manual de campos en Backend
    const errors: Record<string, string> = {}

    // Apellido obligatorio
    if (!formData.apellido || formData.apellido.trim() === "") {
      errors.apellido = "El apellido es obligatorio."
    }

    // Email obligatorio, formato y unicidad en Prisma
    if (!formData.email || formData.email.trim() === "") {
      errors.email = "El correo electrónico es obligatorio."
    } else {
      const emailClean = formData.email.trim().toLowerCase()
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!emailRegex.test(emailClean)) {
        errors.email = "El formato del correo electrónico no es válido."
      } else if (emailClean !== targetUser.email.toLowerCase()) {
        // Verificar si otro usuario ya usa ese email
        const existingEmail = await prisma.usuario.findUnique({
          where: { email: emailClean },
        })

        if (existingEmail) {
          errors.email = "Este correo electrónico ya está en uso por otro usuario."
        }
      }
    }

    // Restricción de rol para Gerentes
    if (isGerente && formData.rol === "ADMIN") {
      errors.rol = "Un Gerente no tiene permisos para asignar el rol de Administrador."
    }

    // CBU / CVU: Opcional, pero si viene debe ser estrictamente de 22 dígitos numéricos
    if (formData.cbuCvu && formData.cbuCvu.trim() !== "") {
      const cleanCbu = formData.cbuCvu.trim()
      if (cleanCbu.length !== 22 || !/^\d+$/.test(cleanCbu)) {
        errors.cbuCvu = "El CBU/CVU debe estar compuesto por exactamente 22 números."
      }
    }

    // Si se registraron errores de validación, se retornan al cliente sin tocar la BD
    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        error: "Por favor, corrige los errores señalados en el formulario.",
        errors,
      }
    }

    // 5. Ejecutar actualización en la base de datos con Prisma
    const updatedUser = await prisma.usuario.update({
      where: { id: targetUserId },
      data: {
        nombre: formData.nombre?.trim() || null,
        apellido: formData.apellido?.trim() || null,
        email: formData.email!.trim().toLowerCase(),
        rol: formData.rol,
        activo: Boolean(formData.activo),
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

    // Revalidar el path de Next.js para purgar caché
    revalidatePath(`/usuarios/${targetUserId}`)

    return {
      success: true,
      data: updatedUser,
    }
  } catch (error) {
    console.error("Error en updateUser con Prisma:", error)
    return {
      success: false,
      error: "Ocurrió un error inesperado al intentar actualizar el usuario.",
    }
  }
}

export async function getUserById(targetUserId: string) {
  try {
    // 1. Obtener el usuario autenticado en la sesión
    const { data: currentUser } = await getUserAuth()

    if (!currentUser) {
      return { success: false, error: "No autorizado. Inicie sesión nuevamente." }
    }

    const isSelf = currentUser.id === targetUserId
    const isAdmin = currentUser.rol === "ADMIN"
    const isGerente = currentUser.rol === "GERENTE"

    // Si no es el mismo usuario, ni Admin, ni Gerente -> Denegar acceso
    if (!isSelf && !isAdmin && !isGerente) {
      return { success: false, error: "No tienes permisos para ver este perfil." }
    }

    // 2. Construir la cláusula `where` dinámicamente según el Rol
    const whereCondition: Prisma.UsuarioWhereInput = {
      id: targetUserId,
    }

    // Si es GERENTE (y no es Admin ni está consultando su propio perfil),
    // forzamos a que el usuario buscado pertenezca a su mismo negocio
    if (isGerente && !isAdmin && !isSelf) {
      if (!currentUser.negocioId) {
        return { 
          success: false, 
          error: "El gerente actual no tiene un negocio asignado." 
        }
      }
      
      whereCondition.negocioId = currentUser.negocioId
    }

    // 3. Consulta a Prisma
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
            // Agrega campos del modelo Negocio que necesites (ej. nombre)
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    })

    // Si no lo encuentra (porque no existe o porque pertenecía a otro negocio y el Gerente no tenía acceso)
    if (!targetUser) {
      return { 
        success: false, 
        error: "Usuario no encontrado o no tienes permisos para acceder a este perfil." 
      }
    }

    return {
      success: true,
      data: targetUser,
    }

  } catch (error) {
    console.error("Error al obtener usuario en Prisma:", error)
    return { 
      success: false, 
      error: "Ocurrió un error inesperado en el servidor." 
    }
  }
}

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