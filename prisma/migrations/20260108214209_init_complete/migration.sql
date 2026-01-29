-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANEJAMENTO', 'EM_EXECUCAO', 'PAUSADO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoObra" AS ENUM ('RESIDENCIAL', 'COMERCIAL', 'MISTA');

-- CreateEnum
CREATE TYPE "SubtipoResidencial" AS ENUM ('UNIFAMILIAR', 'MULTIFAMILIAR');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "codigo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANEJAMENTO',
    "tipoObra" "TipoObra" NOT NULL,
    "subtipoResidencial" "SubtipoResidencial",
    "enderecoRua" TEXT NOT NULL,
    "enderecoNumero" TEXT NOT NULL,
    "enderecoComplemento" TEXT,
    "enderecoBairro" TEXT NOT NULL,
    "enderecoCidade" TEXT NOT NULL,
    "enderecoEstado" TEXT NOT NULL,
    "enderecoCEP" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "orcamentoEstimado" DOUBLE PRECISION NOT NULL,
    "orcamentoReal" DOUBLE PRECISION,
    "totalGasto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dataInicioEstimada" TIMESTAMP(3) NOT NULL,
    "dataInicioReal" TIMESTAMP(3),
    "prazoFinal" TIMESTAMP(3) NOT NULL,
    "linkOrcamento" TEXT,
    "linkPlanejamento" TEXT,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_codigo_key" ON "projects"("codigo");
