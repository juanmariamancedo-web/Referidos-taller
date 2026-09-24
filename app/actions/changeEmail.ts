'use server';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUserAuth } from '@/app/actions/auth';
import { sendVerificationEmail } from '@/lib/mailer';
import { generateRandomCode, hashToken } from '@/lib/crypto';
import { revalidatePath } from 'next/cache';

export type ActionState = {
  success?: boolean;
  message?: string;
  step?: 'request' | 'verify';
  pendingEmail?: string;
  errors?: {
    newEmail?: string;
    code?: string;
    [key: string]: string | undefined;
  };
} | null;

/**
 * Paso 1: Solicitar el cambio de correo electrónico.
 * Verifica disponibilidad, genera un token y envía el código por email.
 */
export async function requestEmailChangeAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { data: userAuth } = await getUserAuth();
  if (!userAuth || !userAuth.id) {
    return {
      success: false,
      message: 'No tienes autorización para realizar esta acción.',
    };
  }

  const newEmailRaw = formData.get('newEmail');
  const newEmail = typeof newEmailRaw === 'string' ? newEmailRaw.trim().toLowerCase() : '';

  const errors: NonNullable<ActionState>['errors'] = {};

  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    errors.newEmail = 'Ingresa una dirección de correo electrónico válida.';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, message: 'Revisa los campos e inténtalo de nuevo.', errors };
  }

  try {
    // 1. Verificar si el nuevo correo ya existe en la base de datos
    const existingUser = await prisma.usuario.findUnique({
      where: { email: newEmail },
      select: { id: true },
    });

    if (existingUser) {
      if (existingUser.id === userAuth.id) {
        return {
          success: false,
          message: 'El nuevo correo no puede ser igual a tu correo actual.',
          errors: { newEmail: 'Este es tu correo actual.' },
        };
      }

      return {
        success: false,
        message: 'El correo electrónico ya está registrado por otro usuario.',
        errors: { newEmail: 'Este correo ya se encuentra en uso.' },
      };
    }

    // 2. Generar código numérico de 6 dígitos y su token hash
    const rawCode = generateRandomCode();
    const tokenHash = hashToken(rawCode);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expiración en 15 minutos

    // 3. Inhabilitar tokens anteriores y guardar el nuevo token
    await prisma.$transaction([
      prisma.verificationCode.updateMany({
        where: { email: newEmail, used: false },
        data: { used: true },
      }),
      prisma.verificationCode.create({
        data: {
          email: newEmail,
          token: tokenHash,
          expiresAt,
        },
      }),
    ]);

    // 4. Enviar correo usando lib/mailer
    await sendVerificationEmail(newEmail, rawCode);

    return {
      success: true,
      step: 'verify',
      pendingEmail: newEmail,
      message: `Hemos enviado un código de verificación a ${newEmail}`,
    };
  } catch (error) {
    console.error('Error al solicitar cambio de correo:', error);
    return {
      success: false,
      message: 'No se pudo enviar el correo de verificación. Inténtalo más tarde.',
    };
  }
}

/**
 * Paso 2: Verificar el código de 6 dígitos e implementar el cambio de correo en Prisma.
 */
export async function verifyEmailChangeAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { data: userAuth } = await getUserAuth();
  if (!userAuth || !userAuth.id) {
    return {
      success: false,
      message: 'No tienes autorización para realizar esta acción.',
    };
  }

  const rawCode = (formData.get('code') as string)?.trim() || '';
  const pendingEmail = (formData.get('pendingEmail') as string)?.trim().toLowerCase() || '';

  if (!rawCode || rawCode.length !== 6) {
    return {
      success: false,
      step: 'verify',
      pendingEmail,
      errors: { code: 'El código debe contener 6 dígitos.' },
    };
  }

  try {
    const hashedToken = hashToken(rawCode);

    // 1. Buscar registro del token
    const verificationRecord = await prisma.verificationCode.findUnique({
      where: { token: hashedToken },
    });

    if (!verificationRecord || verificationRecord.email !== pendingEmail) {
      return {
        success: false,
        step: 'verify',
        pendingEmail,
        errors: { code: 'El código ingresado es incorrecto.' },
      };
    }

    if (verificationRecord.used) {
      return {
        success: false,
        step: 'verify',
        pendingEmail,
        errors: { code: 'Este código ya fue utilizado.' },
      };
    }

    if (new Date() > new Date(verificationRecord.expiresAt)) {
      return {
        success: false,
        step: 'verify',
        pendingEmail,
        errors: { code: 'El código ha expirado. Solicita uno nuevo.' },
      };
    }

    // 2. Actualizar el email en Usuario y marcar el token como usado en una transacción
    await prisma.$transaction([
      prisma.usuario.update({
        where: { id: userAuth.id },
        data: { email: pendingEmail },
      }),
      prisma.verificationCode.update({
        where: { id: verificationRecord.id },
        data: { used: true },
      }),
    ]);

    revalidatePath('/profile');

    return {
      success: true,
      message: '¡Tu correo electrónico ha sido actualizado con éxito!',
    };
  } catch (error) {
    // Captura de la restricción @unique de Prisma (código P2002)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return {
        success: false,
        step: 'verify',
        pendingEmail,
        message: 'El correo electrónico ya se encuentra registrado por otro usuario.',
      };
    }

    console.error('Error al confirmar el código de verificación:', error);
    return {
      success: false,
      step: 'verify',
      pendingEmail,
      message: 'Ocurrió un error al actualizar el correo electrónico.',
    };
  }
}