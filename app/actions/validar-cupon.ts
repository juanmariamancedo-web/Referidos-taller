'use server'

import { prisma } from '@/lib/prisma';

export async function canjearCupon(codigo: string, usuarioId: string) {
  const cupon = await prisma.cupon.findUnique({
    where: { codigo },
  });

  if (!cupon) {
    return { success: false, error: 'CUPON_INEXISTENTE', message: 'El cupón no existe.' };
  }

  if (cupon.estado === 'USADO') {
    return { 
      success: false, 
      error: 'ALREADY_USED', 
      message: `Este cupón ya fue canjeado el ${cupon.fechaUso?.toLocaleDateString('es-AR')}` 
    };
  }

  if (cupon.fechaExpiracion && cupon.fechaExpiracion < new Date()) {
    return { success: false, error: 'EXPIRED', message: 'El cupón se encuentra vencido.' };
  }

  // Marcar como usado atómicamente
  const cuponActualizado = await prisma.cupon.update({
    where: { codigo },
    data: {
      estado: 'USADO',
      fechaUso: new Date(),
    },
  });

  return { success: true, cupon: cuponActualizado };
}