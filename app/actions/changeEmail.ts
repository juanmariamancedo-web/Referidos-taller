'use server';

import { Prisma, Rol } from '@prisma/client';
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
  userId?: string;
  errors?: {
    newEmail?: string;
    code?: string;
    [key: string]: string | undefined;
  };
} | null;

/**
 * Helper interno para verificar permisos jerárquicos según el rol obtenido de getUserAuth().
 */
async function validateEmailChangePermission(
  currentAuthUser: { id: string; rol: Rol | string; negocioId?: string | null },
  targetUserId: string
) {
  // 1. Si el usuario intenta modificar su propio perfil -> Permitido siempre
  if (currentAuthUser.id === targetUserId) {
    return { allowed: true };
  }

  // 2. Si el rol obtenido de getUserAuth no es ADMIN ni GERENTE, no puede modificar a terceros
  if (currentAuthUser.rol !== Rol.ADMIN && currentAuthUser.rol !== Rol.GERENTE) {
    return {
      allowed: false,
      message: 'Solo puedes solicitar el cambio de tu propio correo electrónico.',
    };
  }

  // 3. Obtener el usuario objetivo para verificar jerarquías
  const targetUser = await prisma.usuario.findUnique({
    where: { id: targetUserId },
    select: { id: true, rol: true, negocioId: true },
  });

  if (!targetUser) {
    return { allowed: false, message: 'El usuario a modificar no existe.' };
  }

  // 4. Reglas si el usuario autenticado es GERENTE
  if (currentAuthUser.rol === Rol.GERENTE) {
    if (targetUser.rol === Rol.ADMIN) {
      return {
        allowed: false,
        message: 'Un Gerente no puede cambiar el correo de un Administrador.',
      };
    }
    if (targetUser.negocioId !== currentAuthUser.negocioId) {
      return {
        allowed: false,
        message: 'No tienes permiso para modificar usuarios de otro negocio.',
      };
    }
  }

  // 5. Rol ADMIN -> Acceso global
  return { allowed: true };
}

/**
 * PASO 1: Solicitar código de verificación (OTP).
 * Requiere sesión activa mediante getUserAuth().
 */
export async function requestEmailChangeAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { data: userAuth } = await getUserAuth();

  if (!userAuth || !userAuth.id) {
    return {
      success: false,
      message: 'Debes estar logueado para solicitar un cambio de correo.',
    };
  }

  const targetUserId = (formData.get('userId') as string) || userAuth.id;

  // Validar permisos utilizando el rol devuelto por getUserAuth
  const authCheck = await validateEmailChangePermission(userAuth, targetUserId);
  if (!authCheck.allowed) {
    return { success: false, message: authCheck.message };
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
    // Comprobar disponibilidad del correo en la base de datos
    const existingUser = await prisma.usuario.findUnique({
      where: { email: newEmail },
      select: { id: true },
    });

    if (existingUser) {
      if (existingUser.id === targetUserId) {
        return {
          success: false,
          message: 'El nuevo correo no puede ser igual al correo actual.',
          errors: { newEmail: 'Este ya es el correo asignado actualmente.' },
        };
      }

      return {
        success: false,
        message: 'El correo electrónico ya está registrado por otro usuario.',
        errors: { newEmail: 'Este correo ya se encuentra en uso.' },
      };
    }

    const rawCode = generateRandomCode();
    const tokenHash = hashToken(rawCode);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expiración en 15 minutos

    // Invalidar códigos anteriores y registrar el nuevo asignando el userId
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
          userId: targetUserId, // <--- Guardamos el ID del usuario solicitante
        },
      }),
    ]);

    await sendVerificationEmail(newEmail, rawCode);

    return {
      success: true,
      step: 'verify',
      pendingEmail: newEmail,
      userId: targetUserId,
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
 * PASO 2: Verificar el código e implementar el cambio de correo.
 * Solo requiere que el formulario envíe el email y el código.
 */
export async function verifyEmailChangeAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawCode = (formData.get('code') as string)?.trim() || '';
  const pendingEmail =
    (formData.get('pendingEmail') as string)?.trim().toLowerCase() ||
    (formData.get('email') as string)?.trim().toLowerCase() ||
    prevState?.pendingEmail ||
    '';

  if (!rawCode || rawCode.length !== 6) {
    return {
      success: false,
      step: 'verify',
      pendingEmail,
      errors: { code: 'El código debe contener exactamente 6 dígitos.' },
    };
  }

  if (!pendingEmail) {
    return {
      success: false,
      step: 'verify',
      message: 'No se especificó la dirección de correo a verificar.',
    };
  }

  try {
    const hashedToken = hashToken(rawCode);

    // 1. Validar código en la base de datos
    const verificationRecord = await prisma.verificationCode.findFirst({
      where: {
        email: pendingEmail,
        token: hashedToken,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verificationRecord) {
      return {
        success: false,
        step: 'verify',
        pendingEmail,
        errors: { code: 'El código es incorrecto o ha expirado.' },
      };
    }

    // 2. Resolver el targetUserId desde la DB, prevState o sesión como fallback
    let targetUserId = verificationRecord.userId || (formData.get('userId') as string) || prevState?.userId || '';

    if (!targetUserId) {
      const { data: userAuth } = await getUserAuth();
      targetUserId = userAuth?.id || '';
    }

    if (!targetUserId) {
      return {
        success: false,
        step: 'verify',
        pendingEmail,
        message: 'No se pudo determinar el usuario a actualizar.',
      };
    }

    // 3. Verificar si el correo no fue registrado por otro usuario en medio del proceso
    const emailCheck = await prisma.usuario.findUnique({
      where: { email: pendingEmail },
      select: { id: true },
    });

    if (emailCheck && emailCheck.id !== targetUserId) {
      return {
        success: false,
        step: 'verify',
        pendingEmail,
        userId: targetUserId,
        message: 'El correo electrónico ya fue ocupado por otro usuario.',
      };
    }

    // 4. Aplicar la actualización del email y consumir el código
    await prisma.$transaction([
      prisma.usuario.update({
        where: { id: targetUserId },
        data: { email: pendingEmail },
      }),
      prisma.verificationCode.update({
        where: { id: verificationRecord.id },
        data: { used: true },
      }),
    ]);

    revalidatePath('/profile');
    revalidatePath(`/usuarios/editar/${targetUserId}`);

    return {
      success: true,
      message: '¡El correo electrónico se ha actualizado con éxito!',
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return {
        success: false,
        step: 'verify',
        pendingEmail,
        message: 'El correo electrónico ya fue registrado por otro usuario.',
      };
    }

    console.error('Error al confirmar el código de verificación:', error);
    return {
      success: false,
      step: 'verify',
      pendingEmail,
      message: 'Ocurrió un error al intentar actualizar el correo electrónico.',
    };
  }
}