"use server";

import { prisma } from "@/lib/prisma";
import { Rol } from "@prisma/client";

export async function getAccessibleVendedores(currentUserId: string) {
  try {
    const currentUser = await prisma.usuario.findUnique({
      where: { id: currentUserId },
      select: { id: true, rol: true, negocioId: true, activo: true },
    });

    if (!currentUser || !currentUser.activo) {
      return { success: false, error: "Usuario no autorizado." };
    }

    let whereCondition = {};

    if (currentUser.rol === Rol.ADMIN) {
      // ADMIN ve a todos los vendedores y gerentes
      whereCondition = {
        rol: { in: [Rol.VENDEDOR, Rol.GERENTE] },
        activo: true,
      };
    } else if (currentUser.rol === Rol.GERENTE) {
      // GERENTE ve solo al personal de su mismo negocio
      if (!currentUser.negocioId) {
        return { success: false, error: "El gerente no tiene un negocio asignado." };
      }
      whereCondition = {
        negocioId: currentUser.negocioId,
        activo: true,
      };
    } else {
      // VENDEDOR solo se ve a sí mismo
      whereCondition = {
        id: currentUser.id,
        activo: true,
      };
    }

    const vendedores = await prisma.usuario.findMany({
      where: whereCondition,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        qrToken: true,
        rol: true,
        negocio: { select: { nombre: true } },
      },
      orderBy: { nombre: "asc" },
    });

    return { success: true, data: vendedores };
  } catch (error) {
    console.error("Error al obtener listado de vendedores:", error);
    return { success: false, error: "Error interno del servidor." };
  }
}