'use server'

import { prisma } from '@/lib/prisma'
import { getUserAuth } from '@/app/actions/auth'
import { Rol } from '@prisma/client'

export interface CanjearCuponResult {
  success: boolean
  error?: 'UNAUTHORIZED' | 'FORBIDDEN' | 'CUPON_INEXISTENTE' | 'ALREADY_USED' | 'EXPIRED' | 'SERVER_ERROR'
  message?: string
  cupon?: Record<string, any>
}

/**
 * Valida y canjea un cupón en el sistema.
 * Restricción: Ejecución exclusiva para usuarios con rol ADMINISTRADOR (ADMIN).
 */
export async function canjearCupon(codigo: string): Promise<CanjearCuponResult> {
  try {
    // 1. Validar autenticación de la sesión
    const { data: currentUser } = await getUserAuth()

    if (!currentUser || !currentUser.id) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
        message: 'No autorizado. Inicie sesión para realizar esta operación.',
      }
    }

    // 2. Control de Acceso Estricto: Solo ADMINISTRADORES
    if (currentUser.rol !== Rol.ADMIN) {
      return {
        success: false,
        error: 'FORBIDDEN',
        message: 'Acceso denegado. Únicamente los administradores pueden validar cupones.',
      }
    }

    const cleanCodigo = codigo?.trim().toUpperCase()

    if (!cleanCodigo) {
      return {
        success: false,
        error: 'CUPON_INEXISTENTE',
        message: 'Debe proporcionar un código de cupón válido.',
      }
    }

    // 3. Buscar el cupón en la BD
    const cupon = await prisma.cupon.findUnique({
      where: { codigo: cleanCodigo },
    })

    if (!cupon) {
      return {
        success: false,
        error: 'CUPON_INEXISTENTE',
        message: 'El cupón no existe.',
      }
    }

    // 4. Validar estado y fecha de expiración
    if (cupon.estado === 'USADO') {
      const fechaUsoFormateada = cupon.fechaUso
        ? new Date(cupon.fechaUso).toLocaleDateString('es-AR')
        : 'fecha desconocida'

      return {
        success: false,
        error: 'ALREADY_USED',
        message: `Este cupón ya fue canjeado el ${fechaUsoFormateada}.`,
      }
    }

    if (cupon.fechaExpiracion && new Date(cupon.fechaExpiracion) < new Date()) {
      return {
        success: false,
        error: 'EXPIRED',
        message: 'El cupón se encuentra vencido.',
      }
    }

    // 5. Actualización atómica por ID asegurando que no se haya usado en simultáneo
    const cuponActualizado = await prisma.cupon.update({
      where: {
        id: cupon.id,
        estado: { not: 'USADO' },
      },
      data: {
        estado: 'USADO',
        fechaUso: new Date(),
        // Si tu esquema utiliza otra relación para el usuario, asegurate que coincida.
        // Usamos update por ID para permitir relaciones limpias.
      },
    })

    return {
      success: true,
      cupon: cuponActualizado,
    }
  } catch (error) {
    console.error('Error al canjear cupón:', error)
    return {
      success: false,
      error: 'SERVER_ERROR',
      message: 'Ocurrió un error inesperado en el servidor al intentar validar el cupón.',
    }
  }
}