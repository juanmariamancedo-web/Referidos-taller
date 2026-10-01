'use server';

import { prisma } from '@/lib/prisma';
import { sendForgotPasswordEmail } from '@/lib/mailer'; // Asegúrate de ajustar la ruta si corresponde
import { generateRandomCode, hashToken } from '@/lib/crypto';

export type ActionState = {
  success?: boolean;
  message?: string;
} | null;

export async function sendCodeForgotPasswordAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const emailRaw = formData.get('email');

  if (!emailRaw || typeof emailRaw !== 'string') {
    return { success: false, message: 'Ingresa un correo electrónico válido.' };
  }

  const email = emailRaw.trim().toLowerCase();

  if (!email.includes('@')) {
    return { success: false, message: 'Ingresa un correo electrónico válido.' };
  }

  try {
    // 1. Verificar si el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true },
    });

    // Si no existe, retornamos éxito engañoso para prevenir User Enumeration
    // (O si prefieres mantener la validación explícita, puedes dejar el mensaje que tenías)
    if (!usuario) {
      return {
        success: true,
        message: 'Si el correo está registrado, recibirás un código de recuperación en unos momentos.',
      };
    }

    // 2. Generar código y su correspondiente hash
    const rawCode = generateRandomCode();
    const tokenHash = hashToken(rawCode);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // 3. Inhabilitar tokens previos y guardar el nuevo token
    await prisma.$transaction([
      prisma.verificationCode.updateMany({
        where: { email, used: false },
        data: { used: true },
      }),
      prisma.verificationCode.create({
        data: {
          email,
          token: tokenHash,
          expiresAt,
        },
      }),
    ]);

    // 4. Enviar el correo con la función auxiliar limpia
    await sendForgotPasswordEmail(email, rawCode);

    return {
      success: true,
      message: 'Si el correo está registrado, recibirás un código de recuperación en unos momentos.',
    };
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Desconocido';
    console.error('Error enviando correo de recuperación:', errMessage);

    return {
      success: false,
      message: 'No se pudo enviar el correo de recuperación. Inténtalo más tarde.',
    };
  }
}