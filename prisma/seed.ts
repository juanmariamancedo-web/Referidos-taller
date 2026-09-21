import {
  PrismaClient,
  Rol,
  EstadoCupon,
  TipoDescuento,
  PlataformaWallet,
  EstadoLiquidacion,
  MetodoPago,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando la siembra de la base de datos (Seed)...');

  // 1. Limpiar base de datos previa para evitar duplicados
  await prisma.cupon.deleteMany();
  await prisma.liquidacionDetalle.deleteMany();
  await prisma.pagoNegocio.deleteMany();
  await prisma.liquidacion.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.negocio.deleteMany();

  console.log('🧹 Base de datos de prueba limpiada.');

  // Contraseña encriptada compartida para los usuarios de prueba ('123456')
  const hashedPassword = await bcrypt.hash('123456', 10);

  // 2. Crear Negocios
  const negocio1 = await prisma.negocio.create({
    data: {
      nombre: 'Taller Central San Martín',
      direccion: 'Av. San Martín 1234, CABA',
      activo: true,
      porcentajeFee: 20.0, // 20%
      alias: 'taller.central.mp',
      cbuCvu: '0000003100012345678901',
      bancoOProveedor: 'Mercado Pago',
    },
  });

  const negocio2 = await prisma.negocio.create({
    data: {
      nombre: 'Lubricentro Norte',
      direccion: 'Calle 50 #432, La Plata',
      activo: true,
      porcentajeFee: 15.0, // 15%
      alias: 'lubri.norte.galicia',
      cbuCvu: '0070001200098765432100',
      bancoOProveedor: 'Banco Galicia',
    },
  });

  console.log('🏢 Negocios creados.');

  // 3. Crear Usuarios (Admins y Vendedores)
  const admin = await prisma.usuario.create({
    data: {
      nombre: 'Carlos Admin',
      email: 'admin@sistema.com',
      passwordHash: hashedPassword,
      rol: Rol.ADMIN,
      activo: true,
    },
  });

  const vendedor1 = await prisma.usuario.create({
    data: {
      nombre: 'Juan Pérez',
      email: 'juan.perez@taller.com',
      passwordHash: hashedPassword,
      rol: Rol.VENDEDOR,
      activo: true,
      negocioId: negocio1.id,
      alias: 'juan.perez.vendedor',
      cbuCvu: '0000003100011112223334',
      bancoOProveedor: 'Mercado Pago',
      qrToken: 'qr-token-juan-perez-001',
    },
  });

  const vendedor2 = await prisma.usuario.create({
    data: {
      nombre: 'María Gómez',
      email: 'maria.gomez@lubri.com',
      passwordHash: hashedPassword,
      rol: Rol.VENDEDOR,
      activo: true,
      negocioId: negocio2.id,
      alias: 'maria.gomez.pay',
      cbuCvu: '0000003100055556667778',
      bancoOProveedor: 'Ualá',
      qrToken: 'qr-token-maria-gomez-002',
    },
  });

  console.log('👤 Usuarios (Admin y Vendedores) creados.');

  // 4. Crear Cupones
  const cuponPendiente = await prisma.cupon.create({
    data: {
      codigo: 'CUPON-1001',
      estado: EstadoCupon.PENDIENTE,
      tipoDescuento: TipoDescuento.PORCENTAJE,
      valorDescuento: 15.0, // 15%
      terminosCondiciones: 'Válido para cambio de aceite y filtro.',
      fechaExpiracion: new Date('2026-12-31'),
      clienteTelefono: '+541198765432',
      clienteEmail: 'cliente1@gmail.com',
      walletPlataforma: PlataformaWallet.APPLE,
      walletSerial: 'apple-serial-1001',
      walletUrl: 'https://wallet.apple.com/passes/1001',
      agregadoAWallet: true,
      usuarioId: vendedor1.id,
    },
  });

  const cuponUsado1 = await prisma.cupon.create({
    data: {
      codigo: 'CUPON-1002',
      estado: EstadoCupon.USADO,
      tipoDescuento: TipoDescuento.MONTO_FIJO,
      valorDescuento: 5000.0, // $5000
      terminosCondiciones: 'Descuento directo en alineación y balanceo.',
      fechaExpiracion: new Date('2026-10-15'),
      clienteTelefono: '+541155554444',
      clienteEmail: 'cliente2@gmail.com',
      usuarioId: vendedor1.id,
      fechaUso: new Date('2026-09-10'),
    },
  });

  const cuponUsado2 = await prisma.cupon.create({
    data: {
      codigo: 'CUPON-1003',
      estado: EstadoCupon.USADO,
      tipoDescuento: TipoDescuento.PORCENTAJE,
      valorDescuento: 20.0,
      clienteTelefono: '+541133332222',
      walletPlataforma: PlataformaWallet.GOOGLE,
      walletSerial: 'google-serial-1003',
      agregadoAWallet: true,
      usuarioId: vendedor2.id,
      fechaUso: new Date('2026-09-12'),
    },
  });

  console.log('🎟️ Cupones creados.');

  // 5. Crear Corrida de Liquidación (ejemplo periodo pasado)
  const liquidacion = await prisma.liquidacion.create({
    data: {
      periodo: '2026-09-Q1',
      estado: EstadoLiquidacion.PAGADA,
      fechaPago: new Date('2026-09-15'),
      gestionadoPorId: admin.id,
    },
  });

  // 6. Crear Pago al Negocio 1
  const pagoNegocio1 = await prisma.pagoNegocio.create({
    data: {
      monto: 1000.0, // 20% de comisión retenida sobre $5000 brut de vendedor1
      estado: EstadoLiquidacion.PAGADA,
      metodoPago: MetodoPago.TRANSFERENCIA,
      numeroTransferencia: 'TRX-9988776655',
      fechaPago: new Date('2026-09-15'),
      negocioId: negocio1.id,
      liquidacionId: liquidacion.id,
    },
  });

  // 7. Crear Detalle de Liquidación del Vendedor 1 y vincular el cupón usado
  const detalleVendedor1 = await prisma.liquidacionDetalle.create({
    data: {
      montoBruto: 5000.0,
      comisionDueno: 1000.0, // 20%
      montoNeto: 4000.0, // 5000 - 1000
      estado: EstadoLiquidacion.PAGADA,
      metodoPago: MetodoPago.TRANSFERENCIA,
      numeroTransferencia: 'TRX-1122334455',
      fechaPago: new Date('2026-09-15'),
      liquidacionId: liquidacion.id,
      usuarioId: vendedor1.id,
      pagoNegocioId: pagoNegocio1.id,
    },
  });

  // Vincular el cupón usado 1 con su detalle de liquidación
  await prisma.cupon.update({
    where: { id: cuponUsado1.id },
    data: { liquidacionDetalleId: detalleVendedor1.id },
  });

  console.log('💰 Corrida de liquidación y pagos creados exitosamente.');

  console.log('✅ Seed completado con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error durante la ejecución del Seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });