import crypto from "crypto"

/**
 * Genera un código aleatorio numérico de 6 dígitos.
 */
export function generateRandomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Genera el hash SHA-256 de una cadena de texto (el código).
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}