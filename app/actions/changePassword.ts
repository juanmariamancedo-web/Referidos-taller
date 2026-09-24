"use server"

import { prisma } from "@/lib/prisma"
import { getUserAuth } from "@/app/actions/auth"
import bcrypt from "bcryptjs" // o la librería que uses para hash (ej. bcrypt, argon2)
import { revalidatePath } from "next/cache"

export type ActionState = {
  success?: boolean
  message?: string
  errors?: {
    prevPassword?: string
    password?: string
    passwordRepeat?: string
    [key: string]: string | undefined
  }
} | null

export async function changePasswordAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // 1. Verificar autenticación
  const { data: userAuth } = await getUserAuth()
  if (!userAuth || !userAuth.id) {
    return {
      success: false,
      message: "No tienes autorización para realizar esta acción.",
    }
  }

  // 2. Extraer datos del formulario
  const prevPassword = (formData.get("prevPassword") as string) || ""
  const password = (formData.get("password") as string) || ""
  const passwordRepeat = (formData.get("passwordRepeat") as string) || ""

  const errors: NonNullable<ActionState>["errors"] = {}

  // 3. Validaciones de entrada
  if (!prevPassword) {
    errors.prevPassword = "Debes ingresar tu contraseña actual."
  }

  if (!password || password.length < 6) {
    errors.password = "La nueva contraseña debe tener al menos 6 caracteres."
  }

  if (password !== passwordRepeat) {
    errors.passwordRepeat = "Las contraseñas no coinciden."
  }

  if (password === prevPassword && prevPassword !== "") {
    errors.password = "La nueva contraseña no puede ser igual a la contraseña actual."
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: "Revisa los errores en el formulario.",
      errors,
    }
  }

  try {
    // 4. Buscar usuario para obtener la contraseña hasheada actual
    const usuario = await prisma.usuario.findUnique({
      where: { id: userAuth.id },
      select: { passwordHash: true },
    })

    if (!usuario || !usuario.passwordHash) {
      return {
        success: false,
        message: "No se encontró el registro de usuario.",
      }
    }

    // 5. Verificar que la contraseña actual sea correcta
    const isPasswordValid = await bcrypt.compare(prevPassword, usuario.passwordHash)
    if (!isPasswordValid) {
      return {
        success: false,
        message: "La contraseña actual es incorrecta.",
        errors: {
          prevPassword: "La contraseña actual no coincide.",
        },
      }
    }

    // 6. Hashear la nueva contraseña
    const newPasswordHash = await bcrypt.hash(password, 10)

    // 7. Actualizar en Prisma
    await prisma.usuario.update({
      where: { id: userAuth.id },
      data: {
        passwordHash: newPasswordHash,
      },
    })

    revalidatePath("/profile")

    return {
      success: true,
      message: "¡Tu contraseña ha sido actualizada con éxito!",
    }
  } catch (error) {
    console.error("Error al cambiar contraseña:", error)
    return {
      success: false,
      message: "Ocurrió un error inesperado al actualizar la contraseña.",
    }
  }
}