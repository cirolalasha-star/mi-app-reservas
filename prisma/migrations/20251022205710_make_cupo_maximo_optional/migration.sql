/*
  Warnings:

  - Made the column `temporada_inicio_mes` on table `tours` required. This step will fail if there are existing NULL values in that column.
  - Made the column `temporada_fin_mes` on table `tours` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "tours" ALTER COLUMN "cupo_maximo" DROP NOT NULL,
ALTER COLUMN "temporada_inicio_mes" SET NOT NULL,
ALTER COLUMN "temporada_fin_mes" SET NOT NULL;
