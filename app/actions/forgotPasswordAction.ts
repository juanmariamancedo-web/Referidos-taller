'use server';

import { prisma } from '@/lib/prisma';
import { transporter } from '@/lib/mailer';
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

    if (!usuario) {
      return {
        success: false,
        message: 'No existe una cuenta registrada con este correo electrónico.',
      };
    }

    // 2. Generar código y su correspondiente hash usando lib/crypto
    const rawCode = generateRandomCode();
    const tokenHash = hashToken(rawCode);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos de validez

    // 3. Inhabilitar tokens previos y guardar el nuevo token en una transacción
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

    // 4. Enviar el correo usando el transporter de lib/mailer
    await transporter.sendMail({
      from: `"Soporte" <${process.env.GMAIL_USER || process.env.SMTP_USER}>`,
      to: email,
      subject: `Código de recuperación: ${rawCode}`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #0f172a; text-align: center; margin-top: 0; font-size: 20px;">Recuperación de Contraseña</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.5;">Has solicitado restablecer tu contraseña. Usa el siguiente código de verificación:</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; color: #0f172a; border-radius: 8px; margin: 24px 0;">
            ${rawCode}
          </div>
          <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Este código expirará en 15 minutos. Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
        </div>
      `,
    });

    return { success: true, message: 'Código de recuperación enviado con éxito.' };
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Desconocido';
    console.error('Error enviando correo de recuperación:', errMessage);

    return {
      success: false,
      message: 'No se pudo enviar el correo de recuperación. Inténtalo más tarde.',
    };
  }
}