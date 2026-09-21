'use server';

import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma'; // Ajusta la ruta a tu cliente de Prisma

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function sendCodeForgotPasswordAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string

  if (!email || !email.includes('@')) {
    return { success: false, message: 'Ingresa un correo electrónico válido.' };
  }

  try {
    // 1. Verificar que el usuario exista
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      return { success: false, message: 'No existe una cuenta registrada con este correo electrónico.' };
    }

    // 2. Generar código aleatorio de 6 dígitos
    const rawCode = crypto.randomInt(100000, 999999).toString();

    // 3. Crear el HASH SHA-256 del código para guardarlo en la BD
    const tokenHash = crypto.createHash('sha256').update(rawCode).digest('hex');

    // 4. Expiración en 15 minutos
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // 5. Invalidar códigos activos anteriores de este correo
    await prisma.verificationCode.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    // 6. Guardar el nuevo token
    await prisma.verificationCode.create({
      data: {
        email,
        token: tokenHash,
        expiresAt,
      },
    });

    // 7. Enviar correo electrónico
    await transporter.sendMail({
      from: `"Soporte" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Código de recuperación: ${rawCode}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; text-align: center;">Recuperación de Contraseña</h2>
          <p>Has solicitado restablecer tu contraseña. Usa el siguiente código de verificación:</p>
          <div style="background-color: #f1f5f9; padding: 16px; font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; color: #0f172a; border-radius: 6px; margin: 20px 0;">
            ${rawCode}
          </div>
          <p style="font-size: 13px; color: #64748b;">Este código expirará en 15 minutos.</p>
        </div>
      `,
    });

    return { success: true, message: 'Código de recuperación enviado con éxito.' };
  } catch (error: any) {
    console.error('Error enviando correo de recuperación:', error?.message || error);
    return { success: false, error: 'No se pudo enviar el correo de recuperación.' };
  }
}