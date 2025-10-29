/*
  Warnings:

  - You are about to drop the column `entidad` on the `traducciones` table. All the data in the column will be lost.
  - You are about to drop the column `entidad_id` on the `traducciones` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "traducciones" DROP COLUMN "entidad",
DROP COLUMN "entidad_id",
ADD COLUMN     "tourId" INTEGER;

-- AddForeignKey
ALTER TABLE "traducciones" ADD CONSTRAINT "traducciones_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE SET NULL ON UPDATE CASCADE;
