-- CreateEnum
CREATE TYPE "PadraoEmpreendimento" AS ENUM ('POPULAR', 'MEDIO_PADRAO', 'ALTO_PADRAO');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "padraoEmpreendimento" "PadraoEmpreendimento" NOT NULL DEFAULT 'MEDIO_PADRAO';
