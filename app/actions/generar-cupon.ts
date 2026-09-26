'use server'

import { prisma } from '@/lib/prisma';

export async function solicitarCupon({
  vendedorId,
  telefonoInput,
  nombreInput,
}: {
  vendedorId: string;
  telefonoInput: string;
  nombreInput?: string;
}) {
  const telefonoLimpio = telefonoInput.replace(/\D/g, '');

  // 1. Buscar o crear el Cliente automáticamente (Upsert)
  const cliente = await prisma.cliente.upsert({
    where: { telefono: telefonoLimpio },
    update: {
      ...(nombreInput && { nombre: nombreInput }),
    },
    create: {
      telefono: telefonoLimpio,
      nombre: nombreInput,
    },
  });

  // 2. Si el cliente está bloqueado por abuso, rechazamos
  if (cliente.bloqueado) {
    throw new Error('No es posible emitir un cupón para este número.');
  }

  // 3. Verificar si YA tiene un cupón PENDIENTE
  const cuponActivo = await prisma.cupon.findFirst({
    where: {
      clienteId: cliente.id,
      estado: 'PENDIENTE',
      OR: [
        { fechaExpiracion: null },
        { fechaExpiracion: { gte: new Date() } }
      ]
    },
  });

  if (cuponActivo) {
    return { nuevo: false, cupon: cuponActivo, message: 'Ya tenés un cupón activo.' };
  }

  // 4. Si no tiene ninguno pendiente, creamos el cupón asignado al clienteId
  const fechaExpiracion = new Date();
  fechaExpiracion.setDate(fechaExpiracion.getDate() + 14);

  const nuevoCupon = await prisma.cupon.create({
    data: {
      codigo: `CUP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      usuarioId: vendedorId,
      clienteId: cliente.id,
      tipoDescuento: 'PORCENTAJE', // o la lógica que aplique
      valorDescuento: 10.00,
      fechaExpiracion,
    },
  });

  return { nuevo: true, cupon: nuevoCupon, message: 'Cupón generado exitosamente.' };
}