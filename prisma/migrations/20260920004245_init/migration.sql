-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'VENDEDOR');

-- CreateEnum
CREATE TYPE "EstadoCupon" AS ENUM ('PENDIENTE', 'USADO', 'VENCIDO');

-- CreateEnum
CREATE TYPE "EstadoLiquidacion" AS ENUM ('PENDIENTE', 'PAGADA');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'CHEQUE');

-- CreateEnum
CREATE TYPE "TipoDescuento" AS ENUM ('PORCENTAJE', 'MONTO_FIJO');

-- CreateEnum
CREATE TYPE "PlataformaWallet" AS ENUM ('APPLE', 'GOOGLE');

-- CreateTable
CREATE TABLE "Negocio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "porcentajeFee" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "alias" TEXT,
    "cbuCvu" TEXT,
    "bancoOProveedor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Negocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "alias" TEXT,
    "cbuCvu" TEXT,
    "bancoOProveedor" TEXT,
    "qrToken" TEXT NOT NULL,
    "qrCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "negocioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cupon" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "estado" "EstadoCupon" NOT NULL DEFAULT 'PENDIENTE',
    "tipoDescuento" "TipoDescuento" NOT NULL,
    "valorDescuento" DECIMAL(10,2) NOT NULL,
    "terminosCondiciones" TEXT,
    "fechaExpiracion" TIMESTAMP(3),
    "clienteTelefono" TEXT,
    "clienteEmail" TEXT,
    "walletPlataforma" "PlataformaWallet",
    "walletSerial" TEXT,
    "walletUrl" TEXT,
    "agregadoAWallet" BOOLEAN NOT NULL DEFAULT false,
    "usuarioId" TEXT NOT NULL,
    "liquidacionDetalleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaUso" TIMESTAMP(3),

    CONSTRAINT "Cupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Liquidacion" (
    "id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "estado" "EstadoLiquidacion" NOT NULL DEFAULT 'PENDIENTE',
    "fechaPago" TIMESTAMP(3),
    "gestionadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Liquidacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidacionDetalle" (
    "id" TEXT NOT NULL,
    "montoBruto" DECIMAL(10,2) NOT NULL,
    "comisionDueno" DECIMAL(10,2) NOT NULL,
    "montoNeto" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoLiquidacion" NOT NULL DEFAULT 'PENDIENTE',
    "metodoPago" "MetodoPago" NOT NULL DEFAULT 'EFECTIVO',
    "numeroTransferencia" TEXT,
    "fechaPago" TIMESTAMP(3),
    "fechaCobro" TIMESTAMP(3),
    "liquidacionId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "pagoNegocioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiquidacionDetalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoNegocio" (
    "id" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoLiquidacion" NOT NULL DEFAULT 'PENDIENTE',
    "metodoPago" "MetodoPago" NOT NULL DEFAULT 'EFECTIVO',
    "numeroTransferencia" TEXT,
    "fechaPago" TIMESTAMP(3),
    "fechaCobro" TIMESTAMP(3),
    "negocioId" TEXT NOT NULL,
    "liquidacionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PagoNegocio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Negocio_createdAt_idx" ON "Negocio"("createdAt");

-- CreateIndex
CREATE INDEX "Negocio_nombre_idx" ON "Negocio"("nombre");

-- CreateIndex
CREATE INDEX "Negocio_activo_idx" ON "Negocio"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_qrToken_key" ON "Usuario"("qrToken");

-- CreateIndex
CREATE INDEX "Usuario_negocioId_idx" ON "Usuario"("negocioId");

-- CreateIndex
CREATE INDEX "Usuario_rol_idx" ON "Usuario"("rol");

-- CreateIndex
CREATE INDEX "Usuario_activo_idx" ON "Usuario"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "Cupon_codigo_key" ON "Cupon"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Cupon_walletSerial_key" ON "Cupon"("walletSerial");

-- CreateIndex
CREATE INDEX "Cupon_usuarioId_idx" ON "Cupon"("usuarioId");

-- CreateIndex
CREATE INDEX "Cupon_liquidacionDetalleId_idx" ON "Cupon"("liquidacionDetalleId");

-- CreateIndex
CREATE INDEX "Cupon_estado_idx" ON "Cupon"("estado");

-- CreateIndex
CREATE INDEX "Cupon_fechaUso_idx" ON "Cupon"("fechaUso");

-- CreateIndex
CREATE INDEX "Cupon_createdAt_idx" ON "Cupon"("createdAt");

-- CreateIndex
CREATE INDEX "Liquidacion_gestionadoPorId_idx" ON "Liquidacion"("gestionadoPorId");

-- CreateIndex
CREATE INDEX "Liquidacion_estado_idx" ON "Liquidacion"("estado");

-- CreateIndex
CREATE INDEX "Liquidacion_periodo_idx" ON "Liquidacion"("periodo");

-- CreateIndex
CREATE INDEX "LiquidacionDetalle_liquidacionId_idx" ON "LiquidacionDetalle"("liquidacionId");

-- CreateIndex
CREATE INDEX "LiquidacionDetalle_usuarioId_idx" ON "LiquidacionDetalle"("usuarioId");

-- CreateIndex
CREATE INDEX "LiquidacionDetalle_usuarioId_estado_idx" ON "LiquidacionDetalle"("usuarioId", "estado");

-- CreateIndex
CREATE INDEX "LiquidacionDetalle_pagoNegocioId_idx" ON "LiquidacionDetalle"("pagoNegocioId");

-- CreateIndex
CREATE INDEX "PagoNegocio_negocioId_idx" ON "PagoNegocio"("negocioId");

-- CreateIndex
CREATE INDEX "PagoNegocio_liquidacionId_idx" ON "PagoNegocio"("liquidacionId");

-- CreateIndex
CREATE INDEX "PagoNegocio_negocioId_estado_idx" ON "PagoNegocio"("negocioId", "estado");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cupon" ADD CONSTRAINT "Cupon_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cupon" ADD CONSTRAINT "Cupon_liquidacionDetalleId_fkey" FOREIGN KEY ("liquidacionDetalleId") REFERENCES "LiquidacionDetalle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liquidacion" ADD CONSTRAINT "Liquidacion_gestionadoPorId_fkey" FOREIGN KEY ("gestionadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidacionDetalle" ADD CONSTRAINT "LiquidacionDetalle_liquidacionId_fkey" FOREIGN KEY ("liquidacionId") REFERENCES "Liquidacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidacionDetalle" ADD CONSTRAINT "LiquidacionDetalle_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidacionDetalle" ADD CONSTRAINT "LiquidacionDetalle_pagoNegocioId_fkey" FOREIGN KEY ("pagoNegocioId") REFERENCES "PagoNegocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoNegocio" ADD CONSTRAINT "PagoNegocio_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoNegocio" ADD CONSTRAINT "PagoNegocio_liquidacionId_fkey" FOREIGN KEY ("liquidacionId") REFERENCES "Liquidacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
