/*
  Warnings:

  - You are about to drop the column `montoComisionDefault` on the `Negocio` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Negocio" DROP COLUMN "montoComisionDefault",
ADD COLUMN     "porcentajeComisionDefault" DECIMAL(5,2) NOT NULL DEFAULT 10.00;
