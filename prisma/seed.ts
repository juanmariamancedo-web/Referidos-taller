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

  // 1. Limpiar base de datos previa para evitar duplicados respetando el orden de FK
  await prisma.cupon.deleteMany();
  await prisma.cliente.deleteMany();
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

  // 3. Crear Usuarios (Admins, Gerente y Vendedores)
  const admin = await prisma.usuario.create({
    data: {
      nombre: 'Carlos Admin',
      apellido: 'Pérez',
      email: 'admin@sistema.com',
      passwordHash: hashedPassword,
      rol: Rol.ADMIN,
      activo: true,
    },
  });

  const vendedor1 = await prisma.usuario.create({
    data: {
      nombre: 'Juan',
      apellido: 'Pérez',
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
      nombre: 'María',
      apellido: 'Gómez',
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

  console.log('👤 Usuarios creados.');

  // 4. Crear Clientes
  const cliente1 = await prisma.cliente.create({
    data: {
      telefono: '541198765432',
      nombre: 'Gonzalo Fernández',
      email: 'cliente1@gmail.com',
    },
  });

  const cliente2 = await prisma.cliente.create({
    data: {
      telefono: '541155554444',
      nombre: 'Anabel Ruiz',
      email: 'cliente2@gmail.com',
    },
  });

  const cliente3 = await prisma.cliente.create({
    data: {
      telefono: '541133332222',
      nombre: 'Martín Silva',
      email: 'cliente3@gmail.com',
    },
  });

  const cliente4 = await prisma.cliente.create({
    data: {
      telefono: '541177778888',
      nombre: 'Lucía Benítez',
      email: 'cliente4@gmail.com',
    },
  });

  console.log('👥 Clientes creados.');

  // 5. Crear Liquidación y Detalle para probar el estado LIQUIDADO
  const liquidacion = await prisma.liquidacion.create({
    data: {
      periodo: '2026-09-Q1',
      estado: EstadoLiquidacion.PAGADA,
      fechaPago: new Date('2026-09-15'),
      gestionadoPorId: admin.id,
    },
  });

  const pagoNegocio1 = await prisma.pagoNegocio.create({
    data: {
      monto: 1000.0,
      estado: EstadoLiquidacion.PAGADA,
      metodoPago: MetodoPago.TRANSFERENCIA,
      numeroTransferencia: 'TRX-9988776655',
      fechaPago: new Date('2026-09-15'),
      negocioId: negocio1.id,
      liquidacionId: liquidacion.id,
    },
  });

  const detalleVendedor1 = await prisma.liquidacionDetalle.create({
    data: {
      montoBruto: 5000.0,
      comisionDueno: 1000.0,
      montoNeto: 4000.0,
      estado: EstadoLiquidacion.PAGADA,
      metodoPago: MetodoPago.TRANSFERENCIA,
      numeroTransferencia: 'TRX-1122334455',
      fechaPago: new Date('2026-09-15'),
      liquidacionId: liquidacion.id,
      usuarioId: vendedor1.id,
      pagoNegocioId: pagoNegocio1.id,
    },
  });

  // 6. Crear Cupones en TODOS los Estados
  // 🟢 6.1 ESTADO: PENDIENTE
  await prisma.cupon.create({
    data: {
      codigo: 'CUPON-PENDIENTE',
      estado: EstadoCupon.PENDIENTE,
      tipoDescuento: TipoDescuento.PORCENTAJE,
      valorDescuento: 15.0,
      terminosCondiciones: 'Válido para cambio de aceite y filtro.',
      fechaExpiracion: new Date('2026-12-31'),
      walletPlataforma: PlataformaWallet.APPLE,
      walletSerial: 'apple-serial-1001',
      walletUrl: 'https://wallet.apple.com/passes/1001',
      agregadoAWallet: true,
      usuarioId: vendedor1.id,
      clienteId: cliente1.id,
    },
  });

  // 🔵 6.2 ESTADO: USADO
  await prisma.cupon.create({
    data: {
      codigo: 'CUPON-USADO',
      estado: EstadoCupon.USADO,
      tipoDescuento: TipoDescuento.PORCENTAJE,
      valorDescuento: 20.0,
      terminosCondiciones: 'Descuento aplicado en alineación y balanceo.',
      fechaExpiracion: new Date('2026-11-30'),
      fechaUso: new Date('2026-09-20'),
      walletPlataforma: PlataformaWallet.GOOGLE,
      walletSerial: 'google-serial-1003',
      agregadoAWallet: true,
      usuarioId: vendedor2.id,
      clienteId: cliente3.id,
    },
  });

  // 🔴 6.3 ESTADO: VENCIDO
  await prisma.cupon.create({
    data: {
      codigo: 'CUPON-VENCIDO',
      estado: EstadoCupon.VENCIDO,
      tipoDescuento: TipoDescuento.MONTO_FIJO,
      valorDescuento: 3000.0,
      terminosCondiciones: 'Cupón caducado sin canjear.',
      fechaExpiracion: new Date('2026-08-01'), // Fecha pasada
      usuarioId: vendedor1.id,
      clienteId: cliente4.id,
    },
  });

  // 🟣 6.4 ESTADO: LIQUIDADO (Vinculado a LiquidacionDetalle)
  await prisma.cupon.create({
    data: {
      codigo: 'CUPON-LIQUIDADO',
      estado: EstadoCupon.LIQUIDADO,
      tipoDescuento: TipoDescuento.MONTO_FIJO,
      valorDescuento: 5000.0,
      terminosCondiciones: 'Descuento procesado y comisión abonada al negocio.',
      fechaExpiracion: new Date('2026-10-15'),
      fechaUso: new Date('2026-09-10'),
      usuarioId: vendedor1.id,
      clienteId: cliente2.id,
      liquidacionDetalleId: detalleVendedor1.id, // <--- Vinculación clave para LIQUIDADO
    },
  });

  console.log('🎟️ Cupones creados en todos sus estados (PENDIENTE, USADO, VENCIDO, LIQUIDADO).');
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