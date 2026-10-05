"use server";

import { prisma } from "@/lib/prisma";
import { getUserAuth } from "@/app/actions/auth"; // Ajusta la ruta a tu módulo de auth
import { Rol } from "@prisma/client";

export interface GetUserQRResponse {
  success: boolean;
  data?: {
    userId: string;
    nombreCompleto: string;
    qrToken: string;
    rol: Rol;
    negocioNombre?: string;
  };
  error?: string;
}

/**
 * Obtiene la información del QR de un usuario objetivo validando
 * los permisos del usuario autenticado vía `getUserAuth()`.
 * 
 * @param targetUserId ID del usuario del cual se quiere obtener el QR
 */
export async function getUserQR(
  targetUserId: string
): Promise<GetUserQRResponse> {
  try {
    // 1. Obtener usuario autenticado desde la sesión del servidor
    const auth = await getUserAuth();
    
    // Asume que auth contiene el id del usuario o la propiedad según tu implementación
    const currentUserId = auth?.data?.id;

    if (!currentUserId) {
      return { success: false, error: "Usuario no autenticado." };
    }

    // 2. Consultar datos del usuario que realiza la petición
    const currentUser = await prisma.usuario.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        rol: true,
        negocioId: true,
        activo: true,
      },
    });

    if (!currentUser || !currentUser.activo) {
      return { success: false, error: "Usuario no autorizado o inactivo." };
    }

    // 3. Consultar datos del usuario objetivo
    const targetUser = await prisma.usuario.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        qrToken: true,
        rol: true,
        negocioId: true,
        activo: true,
        negocio: {
          select: { nombre: true },
        },
      },
    });

    if (!targetUser || !targetUser.activo) {
      return {
        success: false,
        error: "El usuario objetivo no existe o está inactivo.",
      };
    }

    // 4. Validación de permisos por Rol y Negocio
    const isAdmin = currentUser.rol === Rol.ADMIN;
    const isSelf = currentUser.id === targetUser.id;
    const isGerenteDeMismoNegocio =
      currentUser.rol === Rol.GERENTE &&
      currentUser.negocioId !== null &&
      currentUser.negocioId === targetUser.negocioId;

    if (!isAdmin && !isSelf && !isGerenteDeMismoNegocio) {
      return {
        success: false,
        error: "No tienes permisos para ver el QR de este usuario.",
      };
    }

    // 5. Formatear y retornar datos
    const nombreCompleto =
      [targetUser.nombre, targetUser.apellido].filter(Boolean).join(" ") ||
      "Usuario sin nombre";

    return {
      success: true,
      data: {
        userId: targetUser.id,
        nombreCompleto,
        qrToken: targetUser.qrToken,
        rol: targetUser.rol,
        negocioNombre: targetUser.negocio?.nombre,
      },
    };
  } catch (error) {
    console.error("Error al obtener QR de usuario:", error);
    return { success: false, error: "Error interno del servidor." };
  }
}