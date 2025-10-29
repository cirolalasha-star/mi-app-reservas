/*
  Warnings:

  - The `rol` column on the `usuarios` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `password` to the `usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tours" ALTER COLUMN "precio_base" DROP NOT NULL;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "password" TEXT NOT NULL,
DROP COLUMN "rol",
ADD COLUMN     "rol" TEXT NOT NULL DEFAULT 'usuario';
