/*
  Warnings:

  - You are about to drop the column `fecha_creacion` on the `reservas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "reservas" DROP COLUMN "fecha_creacion",
ADD COLUMN     "fecha" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
