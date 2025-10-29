/*
  Warnings:

  - Made the column `comentario` on table `resenas` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "resenas" ADD COLUMN     "aprobado" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "comentario" SET NOT NULL;
