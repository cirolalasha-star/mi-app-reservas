/*
  Warnings:

  - You are about to alter the column `password` on the `usuarios` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "password" SET DATA TYPE VARCHAR(255);
