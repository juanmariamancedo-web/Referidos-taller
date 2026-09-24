'use server'

import { prisma } from '@/lib/prisma'
import { getUserAuth } from '@/app/actions/auth'
import { generateRandomCode, hashToken } from '@/lib/crypto'
import { revalidatePath } from 'next/cache'
import { sendVerificationEmail } from '@/lib/mailer'

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