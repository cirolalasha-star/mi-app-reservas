-- CreateEnum
CREATE TYPE "dificultad_tour" AS ENUM ('baja', 'media', 'alta');

-- CreateEnum
CREATE TYPE "estado_reserva" AS ENUM ('pendiente', 'confirmada', 'cancelada');

-- CreateEnum
CREATE TYPE "rol_usuario" AS ENUM ('cliente', 'guia', 'admin');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "telefono" VARCHAR(20),
    "rol" "rol_usuario" NOT NULL DEFAULT 'cliente',
    "foto_perfil_url" TEXT,
    "fecha_registro" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tours" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "ubicacion" VARCHAR(150),
    "latitud" DECIMAL(9,6),
    "longitud" DECIMAL(9,6),
    "duracion_dias" INTEGER,
    "precio_base" DECIMAL(10,2) NOT NULL,
    "dificultad" "dificultad_tour" NOT NULL DEFAULT 'baja',
    "cupo_maximo" INTEGER NOT NULL,
    "imagen_url" TEXT,
    "temporada_inicio_mes" SMALLINT,
    "temporada_fin_mes" SMALLINT,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "guia_id" INTEGER,
    "creado_en" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "salida_programada_id" INTEGER NOT NULL,
    "numero_personas" INTEGER NOT NULL,
    "estado" "estado_reserva" NOT NULL DEFAULT 'pendiente',
    "notas" TEXT,
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resenas" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "tour_id" INTEGER NOT NULL,
    "puntuacion" INTEGER NOT NULL,
    "comentario" TEXT,
    "fecha" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resenas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos_tour" (
    "id" SERIAL NOT NULL,
    "tour_id" INTEGER NOT NULL,
    "url_foto" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "fotos_tour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guia_perfiles" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "bio" TEXT,
    "especialidad" VARCHAR(120),
    "valoracion_media" DECIMAL(3,2),

    CONSTRAINT "guia_perfiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ofertas" (
    "id" SERIAL NOT NULL,
    "salida_programada_id" INTEGER NOT NULL,
    "descripcion" TEXT,
    "descuento_porcentaje" DECIMAL(5,2),
    "descuento_importe" DECIMAL(10,2),
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ofertas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salidas_programadas" (
    "id" SERIAL NOT NULL,
    "tour_id" INTEGER NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "plazas_totales" INTEGER NOT NULL,
    "plazas_ocupadas" INTEGER NOT NULL DEFAULT 0,
    "precio_especial" DECIMAL(10,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "salidas_programadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suscriptores_boletin" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "fecha_suscripcion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "suscriptores_boletin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_categorias" (
    "tour_id" INTEGER NOT NULL,
    "categoria_id" INTEGER NOT NULL,

    CONSTRAINT "tour_categorias_pkey" PRIMARY KEY ("tour_id","categoria_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "idx_tours_dificultad" ON "tours"("dificultad");

-- CreateIndex
CREATE INDEX "idx_tours_disponible" ON "tours"("disponible");

-- CreateIndex
CREATE INDEX "idx_tours_ubicacion" ON "tours"("ubicacion");

-- CreateIndex
CREATE INDEX "idx_reservas_estado" ON "reservas"("estado");

-- CreateIndex
CREATE INDEX "idx_reservas_salida" ON "reservas"("salida_programada_id");

-- CreateIndex
CREATE INDEX "idx_reservas_usuario" ON "reservas"("usuario_id");

-- CreateIndex
CREATE INDEX "idx_resenas_tour" ON "resenas"("tour_id");

-- CreateIndex
CREATE UNIQUE INDEX "resenas_usuario_id_tour_id_key" ON "resenas"("usuario_id", "tour_id");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE INDEX "idx_fotos_tour" ON "fotos_tour"("tour_id");

-- CreateIndex
CREATE UNIQUE INDEX "guia_perfiles_usuario_id_key" ON "guia_perfiles"("usuario_id");

-- CreateIndex
CREATE INDEX "idx_ofertas_salida" ON "ofertas"("salida_programada_id");

-- CreateIndex
CREATE INDEX "idx_salidas_fechas" ON "salidas_programadas"("fecha_inicio", "fecha_fin");

-- CreateIndex
CREATE INDEX "idx_salidas_tour" ON "salidas_programadas"("tour_id");

-- CreateIndex
CREATE UNIQUE INDEX "suscriptores_boletin_email_key" ON "suscriptores_boletin"("email");

-- AddForeignKey
ALTER TABLE "tours" ADD CONSTRAINT "tours_guia_id_fkey" FOREIGN KEY ("guia_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_salida_programada_id_fkey" FOREIGN KEY ("salida_programada_id") REFERENCES "salidas_programadas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fotos_tour" ADD CONSTRAINT "fotos_tour_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "guia_perfiles" ADD CONSTRAINT "guia_perfiles_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_salida_programada_id_fkey" FOREIGN KEY ("salida_programada_id") REFERENCES "salidas_programadas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "salidas_programadas" ADD CONSTRAINT "salidas_programadas_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tour_categorias" ADD CONSTRAINT "tour_categorias_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tour_categorias" ADD CONSTRAINT "tour_categorias_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
