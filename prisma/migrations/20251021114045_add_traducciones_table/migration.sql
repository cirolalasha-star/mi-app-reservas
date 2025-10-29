-- CreateTable
CREATE TABLE "traducciones" (
    "id" SERIAL NOT NULL,
    "idioma" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "traducciones_pkey" PRIMARY KEY ("id")
);
