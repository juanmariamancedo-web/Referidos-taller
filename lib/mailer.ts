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
  const resetLink = `${baseUrl}/request-forgotten-password-code`

  const mailOptions = {
    from: `"Soporte" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Código de verificación para cambio de correo electrónico",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Verificación de correo electrónico</h2>
        <p>Has solicitado cambiar tu dirección de correo electrónico o restablecer tu contraseña.</p>
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