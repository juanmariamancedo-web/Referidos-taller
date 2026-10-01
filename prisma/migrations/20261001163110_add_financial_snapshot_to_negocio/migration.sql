/*
  Warnings:

  - A unique constraint covering the columns `[cuit]` on the table `Negocio` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Negocio_createdAt_idx";

-- DropIndex
DROP INDEX "Negocio_nombre_idx";

-- AlterTable
ALTER TABLE "Negocio" ADD COLUMN     "cuit" TEXT,
ADD COLUMN     "montoComisionDefault" DECIMAL(10,2) NOT NULL DEFAULT 3000.00,
ADD COLUMN     "rubro" TEXT,
ADD COLUMN     "telefono" TEXT,
ADD COLUMN     "tipoDescuentoDefault" "TipoDescuento" NOT NULL DEFAULT 'PORCENTAJE',
ADD COLUMN     "valorDescuentoDefault" DECIMAL(10,2) NOT NULL DEFAULT 10.00;

-- CreateIndex
CREATE UNIQUE INDEX "Negocio_cuit_key" ON "Negocio"("cuit");
