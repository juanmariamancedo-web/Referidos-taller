'use server';

import { prisma } from '@/lib/prisma';
import { EstadoCupon, TipoDescuento } from '@prisma/client';

export async function solicitarCuponAction(formData: FormData) {
  const vendedorQrToken = formData.get('qrToken') as string;
  const telefonoInput = formData.get('telefono') as string;
  const nombreInput = formData.get('nombre') as string | undefined;

  if (!vendedorQrToken || !telefonoInput) {
    return { success: false, error: 'Por favor, completá los campos obligatorios.' };
  }

  // 1. Limpiar número de teléfono (solo dígitos)
  const telefonoLimpio = telefonoInput.replace(/\D/g, '');

  if (telefonoLimpio.length < 8) {
    return { success: false, error: 'Ingresá un número de teléfono válido.' };
  }

  try {
    // 2. Buscar al vendedor por su qrToken
    const vendedor = await prisma.usuario.findUnique({
      where: { qrToken: vendedorQrToken },
      include: { negocio: true },
    });

    if (!vendedor || !vendedor.activo) {
      return { success: false, error: 'El código QR escaneado no es válido o está inactivo.' };
    }

    // 3. Crear o buscar al cliente (Upsert)
    const cliente = await prisma.cliente.upsert({
      where: { telefono: telefonoLimpio },
      update: {
        ...(nombreInput?.trim() && { nombre: nombreInput.trim() }),
      },
      create: {
        telefono: telefonoLimpio,
        nombre: nombreInput?.trim() || null,
      },
    });

    if (cliente.bloqueado) {
      return { success: false, error: 'No es posible emitir cupones para este número.' };
    }

    // 4. Verificar si el cliente ya tiene un cupón PENDIENTE con este vendedor/negocio
    const cuponActivo = await prisma.cupon.findFirst({
      where: {
        clienteId: cliente.id,
        usuarioId: vendedor.id,
        estado: EstadoCupon.PENDIENTE,
        OR: [
          { fechaExpiracion: null },
          { fechaExpiracion: { gte: new Date() } },
        ],
      },
    });

    if (cuponActivo) {
      return {
        success: true,
        codigoCupon: cuponActivo.codigo,
        mensaje: 'Ya tenías un cupón activo. Te redirigimos para verlo.',
      };
    }

    // 5. Configurar vigencia del cupón (ej. 14 días)
    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + 14);

    // 6. Generar código único de cupón (ej. REF-9A2B4C)
    const codigoUnico = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 7. Crear el nuevo cupón
    const nuevoCupon = await prisma.cupon.create({
      data: {
        codigo: codigoUnico,
        estado: EstadoCupon.PENDIENTE,
        tipoDescuento: TipoDescuento.PORCENTAJE,
        valorDescuento: 15.00, // Ajustar según regla o config del negocio
        terminosCondiciones: 'Válido para un uso. Presentar en recepción.',
        fechaExpiracion,
        usuarioId: vendedor.id,
        clienteId: cliente.id,
      },
    });

    return {
      success: true,
      codigoCupon: nuevoCupon.codigo,
      mensaje: '¡Cupón generado con éxito!',
    };
  } catch (error) {
    console.error('Error al generar cupón:', error);
    return { success: false, error: 'Ocurrió un error inesperado al procesar tu solicitud.' };
  }
}