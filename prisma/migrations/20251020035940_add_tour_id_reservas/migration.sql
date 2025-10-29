/*
  Warnings:

  - Made the column `tour_id` on table `reservas` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "reservas" ALTER COLUMN "tour_id" SET NOT NULL;
