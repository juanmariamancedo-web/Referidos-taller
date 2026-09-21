'use server';

import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma'; // Ajusta la ruta según la ubicación de tu instancia de Prisma Client

export type ActionState = {
  success: boolean;
  message: string;
} | null;

export async function resetPasswordAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const code = (formData.get('code') as string)?.trim();
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // 1. Validaciones básicas de presencia
    if (!email || !code || !password || !confirmPassword) {
      return {
        success: false,
        message: 'Todos los campos son obligatorios.',
      };
    }

    // 2. Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      return {
        success: false,
        message: 'Las contraseñas no coinciden.',
      };
    }

    // 3. Validar longitud/complejidad mínima de la contraseña
    if (password.length < 8) {
      return {
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres.',
      };
    }

    // 4. Buscar al usuario por email
    const user = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        success: false,
        message: 'El código o el correo ingresado no es válido.',
      };
    }

    // 5. Calcular el hash SHA-256 del código ingresado para buscarlo en la BD
    const hashedCode = createHash('sha256').update(code).digest('hex');

    // 6. Buscar el token activo asociado al usuario
    const resetToken = await prisma.verificationCode.findFirst({
      where: {
        email,
        token: hashedCode,
        used: false,
        expiresAt: {
          gt: new Date(), // El token no debe haber expirado
        },
      },
    });

    if (!resetToken) {
      return {
        success: false,
        message: 'El código es inválido o ha expirado.',
      };
    }

    // 7. Hashear la nueva contraseña con bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // 8. Actualizar la contraseña del usuario y marcar el token como usado en una transacción
    await prisma.$transaction([
      prisma.usuario.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword },
      }),
      prisma.verificationCode.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return {
      success: true,
      message: 'La contraseña ha sido actualizada exitosamente.',
    };
  } catch (error) {
    console.error('Error en resetPasswordAction:', error);
    return {
      success: false,
      message: 'Ocurrió un error inesperado al restablecer la contraseña.',
    };
  }
}