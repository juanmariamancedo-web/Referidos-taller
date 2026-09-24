"use server"

import { prisma } from "@/lib/prisma"
import { getUserAuth } from "@/app/actions/auth"
import { revalidatePath } from "next/cache"

export type ActionState = {
  success?: boolean
  message?: string
  errors?: {
    nombre?: string
    apellido?: string
    alias?: string
    cbuCvu?: string
    bancoOProveedor?: string
    [key: string]: string | undefined
  }
} | null

export async function updateProfileAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // 1. Obtener el usuario autenticado
  const { data: userAuth } = await getUserAuth()
  if (!userAuth || !userAuth.id) {
    return {
      success: false,
      message: "No tienes autorización para realizar esta acción.",
    }
  }

  // 2. Extraer y sanear los datos enviados por el formulario
  const nombre = (formData.get("nombre") as string)?.trim() || ""
  const apellido = (formData.get("apellido") as string)?.trim() || ""
  const alias = (formData.get("alias") as string)?.trim() || null
  
  // Limpia cualquier espacio, guion o punto que el usuario pegue en el CBU/CVU
  const rawCbuCvu = (formData.get("cbuCvu") as string)?.trim() || ""
  const cbuCvu = rawCbuCvu.replace(/[\s.-]/g, "") || null

  const bancoOProveedor = (formData.get("bancoOProveedor") as string)?.trim() || null

  const errors: NonNullable<ActionState>["errors"] = {}

  // 3. Validaciones
  if (!nombre || nombre.length < 2) {
    errors.nombre = "El nombre debe tener al menos 2 caracteres."
  }

  if (!apellido || apellido.length < 2) {
    errors.apellido = "El apellido debe tener al menos 2 caracteres."
  }

  if (alias) {
    if (alias.length < 6 || alias.length > 20) {
      errors.alias = "El alias debe tener entre 6 y 20 caracteres."
    } else if (!/^[a-zA-Z0-9.-]+$/.test(alias)) {
      errors.alias = "El alias solo puede contener letras, números, puntos y guiones."
    }
  }

  if (cbuCvu) {
    if (cbuCvu.length !== 22) {
      errors.cbuCvu = "El CBU/CVU debe tener exactamente 22 dígitos."
    } else if (!validarCbuCvu(cbuCvu)) {
      errors.cbuCvu = "El CBU/CVU ingresado no es válido (falló la verificación)."
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: "Revisa los campos del formulario.",
      errors,
    }
  }

  // 4. Actualización en la Base de Datos con Prisma
  try {
    await prisma.usuario.update({
      where: { id: userAuth.id },
      data: {
        nombre,
        apellido,
        alias: alias || null,
        cbuCvu: cbuCvu || null,
        bancoOProveedor: bancoOProveedor || null,
      },
    })

    // Revalidar la vista de perfil para reflejar los cambios en el frontend
    revalidatePath("/profile")

    return {
      success: true,
      message: "Perfil actualizado correctamente.",
    }
  } catch (error) {
    console.error("Error al actualizar perfil:", error)
    return {
      success: false,
      message: "Ocurrió un error al guardar los cambios.",
    }
  }
}

/**
 * Ponderadores oficiales del BCRA para cada posición del bloque
 */
const PONDERACIONES_BLOQUE_1 = [7, 1, 3, 9, 7, 1, 3]
const PONDERACIONES_BLOQUE_2 = [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3]

/**
 * Calcula el dígito verificador para un bloque según el algoritmo del BCRA
 */
function calcularDigitoVerificador(numeroBloque: string, ponderaciones: number[]): number {
  let suma = 0
  for (let i = 0; i < numeroBloque.length; i++) {
    suma += parseInt(numeroBloque[i], 10) * ponderaciones[i]
  }
  const residuo = suma % 10
  return residuo === 0 ? 0 : 10 - residuo
}

/**
 * Valida un CBU o CVU argentino de 22 dígitos mediante módulo 10
 */
export async function validarCbuCvu(cbu: string): Promise<boolean> {
  if (!/^\d{22}$/.test(cbu)) return false

  const bloque1 = cbu.substring(0, 7)
  const dv1 = parseInt(cbu[7], 10)

  const bloque2 = cbu.substring(8, 21)
  const dv2 = parseInt(cbu[21], 10)

  if (calcularDigitoVerificador(bloque1, PONDERACIONES_BLOQUE_1) !== dv1) {
    return false
  }

  if (calcularDigitoVerificador(bloque2, PONDERACIONES_BLOQUE_2) !== dv2) {
    return false
  }

  return true
}