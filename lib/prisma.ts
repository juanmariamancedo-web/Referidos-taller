import { PrismaClient } from '@prisma/client';

// Declaración global para reutilizar la instancia en desarrollo
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Reutiliza la instancia existente o crea una nueva
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Guarda la instancia en globalThis solo fuera de producción
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}