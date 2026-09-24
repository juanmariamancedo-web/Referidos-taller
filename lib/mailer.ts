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
  const mailOptions = {
    from: `"Soporte" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Código de verificación para cambio de correo electrónico",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Verificación de correo electrónico</h2>
        <p>Has solicitado cambiar tu dirección de correo electrónico.</p>
        <p>Tu código de verificación de 6 dígitos es:</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #2563eb; margin: 20px 0;">
          ${code}
        </div>
        <p>Este código expira en 15 minutos.</p>
        <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}