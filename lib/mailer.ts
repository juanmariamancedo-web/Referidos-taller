import nodemailer from "nodemailer"

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true para puerto 465, false para otros
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendVerificationEmail(toEmail: string, code: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const resetLink = `${baseUrl}/verificar-email`

  const mailOptions = {
    from: `"Soporte" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Código de verificación para cambio de correo electrónico",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Verificación de correo electrónico</h2>
        <p>Has solicitado cambiar tu dirección de correo electrónico.</p>
        <p>Tu código de verificación de 6 dígitos es:</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #2563eb; margin: 20px 0;">
          ${code}
        </div>
        <p>Este código expira en 15 minutos.</p>
        <div style="margin: 25px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Ir a verificar código
          </a>
        </div>
        <p style="font-size: 13px; color: #64748b;">
          Si el botón no funciona, puedes copiar y pegar la siguiente URL en tu navegador:<br />
          <a href="${resetLink}" style="color: #2563eb;">${resetLink}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">Si no solicitaste este cambio, puedes ignorar este mensaje de forma segura.</p>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

export async function sendForgotPasswordEmail(toEmail: string, code: string) {
  // Construir el enlace dinámico a la pantalla de ingreso de código
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const redirectUrl = `${baseUrl}/request-forgotten-password-code`;

  // Enviar el correo usando el transporter de lib/mailer
  await transporter.sendMail({
    from: `"Soporte" <${process.env.GMAIL_USER || process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `Código de recuperación: ${code}`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0f172a; text-align: center; margin-top: 0; font-size: 20px;">Recuperación de Contraseña</h2>
        <p style="color: #334155; font-size: 14px; line-height: 1.5;">Has solicitado restablecer tu contraseña. Usa el siguiente código de verificación:</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; color: #0f172a; border-radius: 8px; margin: 24px 0;">
          ${code}
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${redirectUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 14px;">
            Ingresar código de verificación
          </a>
        </div>

        <p style="font-size: 12px; color: #64748b; text-align: center; margin-bottom: 16px;">
          Si el botón no funciona, copia y pega la siguiente dirección en tu navegador:<br />
          <a href="${redirectUrl}" style="color: #2563eb; word-break: break-all;">${redirectUrl}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">Este código expirará en 15 minutos. Si no solicitaste este cambio, puedes ignorar este mensaje de forma segura.</p>
      </div>
    `,
  });
}

export async function sendUserVerificationEmail(toEmail: string, code: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const verificationLink = `${baseUrl}/verificar-usuario`

  const mailOptions = {
    from: `"Soporte" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Código de verificación de cuenta",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">¡Bienvenido! Confirma tu cuenta</h2>
        <p>Gracias por registrarte. Para completar la creación de tu cuenta, ingresa el siguiente código de verificación:</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #2563eb; margin: 20px 0;">
          ${code}
        </div>
        <p>Este código expira en 15 minutos.</p>
        <div style="margin: 25px 0;">
          <a href="${verificationLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Verificar mi cuenta
          </a>
        </div>
        <p style="font-size: 13px; color: #64748b;">
          Si el botón no funciona, puedes copiar y pegar la siguiente URL en tu navegador:<br />
          <a href="${verificationLink}" style="color: #2563eb;">${verificationLink}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">Si no creaste una cuenta en nuestra plataforma, puedes ignorar este mensaje de forma segura.</p>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}