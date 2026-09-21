'use server';

import nodemailer from 'nodemailer';

// Instanciamos el transporter dentro de una función o reutilizamos la instancia.
// Nota: 'service: gmail' utiliza internamente host smtp.gmail.com y puerto 465 (SSL).
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function enviarMensaje(remitente: string, code: string) {
  // Validación preventiva de credenciales
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.error('Error: Faltan las variables GMAIL_USER o GMAIL_PASS en las variables de entorno.');
    return { ok: false, error: 'Configuración del servidor incompleta.' };
  }

  if (!remitente || !code) {
    return { ok: false, error: 'El remitente y el código son obligatorios.' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Sistema de Verificación" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER, // Te llega a tu casilla
      replyTo: remitente,
      subject: `Código de verificación: ${code} - ${remitente}`,
      text: `Has recibido una solicitud de verificación:\n\nRemitente: ${remitente}\nCódigo: ${code}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #333;">Código de Verificación</h2>
          <p><strong>Remitente:</strong> ${remitente}</p>
          <p><strong>Código generado:</strong></p>
          <div style="background: #f4f4f4; padding: 12px; font-size: 20px; font-weight: bold; letter-spacing: 2px; text-align: center; border-radius: 4px; display: inline-block;">
            ${code}
          </div>
        </div>
      `,
    });

    return { ok: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error enviando mail en Railway:', error?.message || error);
    return { ok: false, error: 'No se pudo enviar el correo de verificación.' };
  }
}