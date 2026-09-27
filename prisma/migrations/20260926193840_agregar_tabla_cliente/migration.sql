/*
  Warnings:

  - You are about to drop the column `clienteEmail` on the `Cupon` table. All the data in the column will be lost.
  - You are about to drop the column `clienteTelefono` on the `Cupon` table. All the data in the column will be lost.
  - Added the required column `clienteId` to the `Cupon` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cupon" DROP COLUMN "clienteEmail",
DROP COLUMN "clienteTelefono",
ADD COLUMN     "clienteId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "nombre" TEXT,
    "email" TEXT,
    "bloqueado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_telefono_key" ON "Cliente"("telefono");

-- CreateIndex
CREATE INDEX "Cliente_telefono_idx" ON "Cliente"("telefono");

-- CreateIndex
CREATE INDEX "Cliente_email_idx" ON "Cliente"("email");

-- CreateIndex
CREATE INDEX "Cupon_clienteId_idx" ON "Cupon"("clienteId");

-- AddForeignKey
ALTER TABLE "Cupon" ADD CONSTRAINT "Cupon_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
