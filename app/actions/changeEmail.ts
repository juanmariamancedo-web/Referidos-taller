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
 * Helper interno para verificar si el usuario autenticado tiene permisos
 * para solicitar/modificar el correo del usuario objetivo.
 */
async function validateEmailChangePermission(
  currentAuthUser: { id: string; rol: string; negocioId?: string | null },
  targetUserId: string
) {
  // 1. Si intenta cambiar su propio correo -> Permitido siempre
  if (currentAuthUser.id === targetUserId) {
    return { allowed: true, targetUser: null };
  }

  // 2. Un VENDEDOR (o cualquier rol sin jerarquía) solo puede cambiar el suyo
  if (currentAuthUser.rol !== 'ADMIN' && currentAuthUser.rol !== 'GERENTE') {
    return {
      allowed: false,
      message: 'Solo puedes solicitar el cambio de tu propio correo electrónico.',
    };
  }

  // 3. Buscar el usuario objetivo en la base de datos
  const targetUser = await prisma.usuario.findUnique({
    where: { id: targetUserId },
    select: { id: true, rol: true, negocioId: true, email: true },
  });

  if (!targetUser) {
    return { allowed: false, message: 'El usuario a modificar no existe.' };
  }

  // 4. Reglas de negocio para GERENTE
  if (currentAuthUser.rol === 'GERENTE') {
    if (targetUser.rol === 'ADMIN') {
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

  // 5. ADMIN -> Acceso total
  return { allowed: true, targetUser };
}

/**
 * Paso 1: Solicitar el cambio de correo electrónico.
 * Genera el código OTP y envía el email al destinatario.
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

  // Si no se pasa userId en el FormData, se asume el propio usuario autenticado (/profile)
  const targetUserId = (formData.get('userId') as string) || userAuth.id;

  // Validar permisos jerárquicos
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
    // Verificar si el correo ya está registrado por otro usuario
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

    // Generar código numérico de 6 dígitos (OTP) y su hash para almacenamiento
    const rawCode = generateRandomCode();
    const tokenHash = hashToken(rawCode);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expiración en 15 minutos

    // Inhabilitar tokens viejos del mismo email y registrar el nuevo
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

    // Enviar el correo con el código de 6 dígitos
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

  const targetUserId = (formData.get('userId') as string) || userAuth.id;

  // Re-validar permisos antes de aplicar el cambio en la base de datos
  const authCheck = await validateEmailChangePermission(userAuth, targetUserId);
  if (!authCheck.allowed) {
    return { success: false, message: authCheck.message };
  }

  const rawCode = (formData.get('code') as string)?.trim() || '';
  const pendingEmail = (formData.get('pendingEmail') as string)?.trim().toLowerCase() || '';

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

    // Buscar el registro filtrando por correo + hash del token activo y no expirado
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

    // Actualizar el email en la tabla Usuario y marcar el token como usado
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

    // Revalidar las rutas involucradas
    revalidatePath('/profile');
    revalidatePath(`/usuarios/editar/${targetUserId}`);

    return {
      success: true,
      message: '¡El correo electrónico se ha actualizado con éxito!',
    };
  } catch (error) {
    // Control de restricción unique si el email fue ocupado justo antes de confirmar
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