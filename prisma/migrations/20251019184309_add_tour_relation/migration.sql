-- AlterTable
ALTER TABLE "reservas" ADD COLUMN     "tour_id" INTEGER;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "imagen_url" TEXT;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
