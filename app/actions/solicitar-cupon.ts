'use server';

import { prisma } from '@/lib/prisma';
import { EstadoCupon, TipoDescuento } from '@prisma/client';
import { generateRandomCode } from '@/lib/crypto'; // O tu función helper de generación de códigos

export interface SolicitarCuponResponse {
  success: boolean;
  codigoCupon?: string;
  mensaje?: string;
  error?: string;
}

export async function solicitarCuponAction(formData: FormData): Promise<SolicitarCuponResponse> {
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
    // 2. Buscar al vendedor por su qrToken incluyendo su negocio
    const vendedor = await prisma.usuario.findUnique({
      where: { qrToken: vendedorQrToken },
      include: {
        negocio: {
          select: {
            id: true,
            nombre: true,
            activo: true,
            porcentajeFee: true, // Se obtiene el fee/descuento del negocio
          },
        },
      },
    });

    if (!vendedor || !vendedor.activo) {
      return { success: false, error: 'El código QR escaneado no es válido o el vendedor está inactivo.' };
    }

    if (!vendedor.negocio || !vendedor.negocio.activo) {
      return { success: false, error: 'El negocio asociado no se encuentra activo.' };
    }

    // 3. Determinación y sanitización del valor del descuento/fee
    // Se extrae el fee del negocio o se asigna un valor base por defecto (ej. 10%) si es nulo
    const descuentoAplicable = vendedor.negocio.porcentajeFee 
      ? Number(vendedor.negocio.porcentajeFee)
      : 10.0;

    // 4. Crear o buscar al cliente (Upsert)
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
      return { success: false, error: 'No es posible emitir cupones para este número de teléfono.' };
    }

    // 5. Verificar si el cliente ya tiene un cupón PENDIENTE con este vendedor/negocio
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

    // 6. Configurar vigencia del cupón (14 días)
    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + 14);

    // 7. Generación de código único evitando colisiones
    let codigoUnico = '';
    let existeCodigo = true;
    let intentos = 0;

    while (existeCodigo && intentos < 5) {
      codigoUnico = `REF-${generateRandomCode?.() || Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const cuponExistente = await prisma.cupon.findUnique({
        where: { codigo: codigoUnico },
        select: { id: true },
      });
      if (!cuponExistente) {
        existeCodigo = false;
      }
      intentos++;
    }

    if (existeCodigo) {
      return { success: false, error: 'No se pudo generar un código único. Inténtalo nuevamente.' };
    }

    // 8. Crear el nuevo cupón con el fee/descuento verificado
    const nuevoCupon = await prisma.cupon.create({
      data: {
        codigo: codigoUnico,
        estado: EstadoCupon.PENDIENTE,
        tipoDescuento: TipoDescuento.PORCENTAJE,
        valorDescuento: descuentoAplicable,
        terminosCondiciones: 'Válido para un solo uso. Presentar en el establecimiento.',
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
    console.error('Error al solicitar cupón:', error);
    return {
      success: false,
      error: 'Ocurrió un error inesperado al procesar tu solicitud.',
    };
  }
}