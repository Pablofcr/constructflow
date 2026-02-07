-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANEJAMENTO', 'EM_ANDAMENTO', 'PAUSADO', 'CONCLUIDO', 'CANCELADO', 'EM_EXECUCAO');

-- CreateEnum
CREATE TYPE "TipoObra" AS ENUM ('RESIDENCIAL', 'COMERCIAL', 'MISTA');

-- CreateEnum
CREATE TYPE "SubtipoResidencial" AS ENUM ('UNIFAMILIAR', 'MULTIFAMILIAR');

-- CreateEnum
CREATE TYPE "PadraoEmpreendimento" AS ENUM ('POPULAR', 'MEDIO_PADRAO', 'ALTO', 'LUXO', 'MEDIO', 'BAIXO_PADRAO', 'ALTO_PADRAO');

-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('ENGENHEIRO', 'ARQUITETO', 'MESTRE_DE_OBRAS', 'PEDREIRO', 'ELETRICISTA', 'ENCANADOR', 'CARPINTEIRO', 'PINTOR', 'SERVENTE', 'ADMINISTRATIVO', 'OUTRO');

-- CreateEnum
CREATE TYPE "BudgetRealStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'EXECUTING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StageStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CompositionSource" AS ENUM ('SINAPI', 'PINI', 'TCPO', 'CUSTOM');

-- CreateEnum
CREATE TYPE "InsumoType" AS ENUM ('MATERIAL', 'LABOR', 'EQUIPMENT');

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
    "padraoEmpreendimento" "PadraoEmpreendimento" NOT NULL DEFAULT 'MEDIO_PADRAO',
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

-- CreateTable
CREATE TABLE "budget_estimated" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    "landValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "iptuPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.005,
    "iptuValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "condominiumValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "itbiPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.03,
    "itbiValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLandCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cubValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cucValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cubSource" TEXT,
    "cubReferenceMonth" TEXT,
    "cubType" TEXT,
    "constructedArea" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "areaDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "equivalentArea" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "constructionCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "projectDuration" INTEGER DEFAULT 12,
    "totalEstimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adverseSaleDeadline" INTEGER DEFAULT 0,
    "expectedSaleDeadline" INTEGER DEFAULT 0,
    "idealSaleDeadline" INTEGER DEFAULT 0,
    "adverseSaleValue" DOUBLE PRECISION DEFAULT 0,
    "adverseBrokerage" DOUBLE PRECISION DEFAULT 0,
    "adverseTaxes" DOUBLE PRECISION DEFAULT 0,
    "adverseNetProfit" DOUBLE PRECISION DEFAULT 0,
    "adverseProfitMargin" DOUBLE PRECISION DEFAULT 0,
    "adverseROE" DOUBLE PRECISION DEFAULT 0,
    "adverseMonthlyReturn" DOUBLE PRECISION DEFAULT 0,
    "expectedSaleValue" DOUBLE PRECISION DEFAULT 0,
    "expectedBrokerage" DOUBLE PRECISION DEFAULT 0,
    "expectedTaxes" DOUBLE PRECISION DEFAULT 0,
    "expectedNetProfit" DOUBLE PRECISION DEFAULT 0,
    "expectedProfitMargin" DOUBLE PRECISION DEFAULT 0,
    "expectedROE" DOUBLE PRECISION DEFAULT 0,
    "expectedMonthlyReturn" DOUBLE PRECISION DEFAULT 0,
    "idealSaleValue" DOUBLE PRECISION DEFAULT 0,
    "idealBrokerage" DOUBLE PRECISION DEFAULT 0,
    "idealTaxes" DOUBLE PRECISION DEFAULT 0,
    "idealNetProfit" DOUBLE PRECISION DEFAULT 0,
    "idealProfitMargin" DOUBLE PRECISION DEFAULT 0,
    "idealROE" DOUBLE PRECISION DEFAULT 0,
    "idealMonthlyReturn" DOUBLE PRECISION DEFAULT 0,
    "scenario_AA_monthlyReturn" DOUBLE PRECISION DEFAULT 0,
    "scenario_AA_totalMonths" INTEGER DEFAULT 0,
    "scenario_AE_monthlyReturn" DOUBLE PRECISION DEFAULT 0,
    "scenario_AE_totalMonths" INTEGER DEFAULT 0,
    "scenario_AI_monthlyReturn" DOUBLE PRECISION DEFAULT 0,
    "scenario_AI_totalMonths" INTEGER DEFAULT 0,
    "scenario_EA_monthlyReturn" DOUBLE PRECISION DEFAULT 0,
    "scenario_EA_totalMonths" INTEGER DEFAULT 0,
    "scenario_EE_monthlyReturn" DOUBLE PRECISION DEFAULT 0,
    "scenario_EE_totalMonths" INTEGER DEFAULT 0,
    "scenario_EI_monthlyReturn" DOUBLE PRECISION DEFAULT 0,
    "scenario_EI_totalMonths" INTEGER DEFAULT 0,
    "scenario_IA_monthlyReturn" DOUBLE PRECISION DEFAULT 0,
    "scenario_IA_totalMonths" INTEGER DEFAULT 0,
    "scenario_IE_monthlyReturn" DOUBLE PRECISION DEFAULT 0,
    "scenario_IE_totalMonths" INTEGER DEFAULT 0,
    "scenario_II_monthlyReturn" DOUBLE PRECISION DEFAULT 0,
    "scenario_II_totalMonths" INTEGER DEFAULT 0,
    "baixoBaixo" DOUBLE PRECISION DEFAULT 0,
    "baixoMedio" DOUBLE PRECISION DEFAULT 0,
    "baixoAlto" DOUBLE PRECISION DEFAULT 0,
    "medioBaixo" DOUBLE PRECISION DEFAULT 0,
    "medioMedio" DOUBLE PRECISION DEFAULT 0,
    "medioAlto" DOUBLE PRECISION DEFAULT 0,
    "altoBaixo" DOUBLE PRECISION DEFAULT 0,
    "altoMedio" DOUBLE PRECISION DEFAULT 0,
    "altoAlto" DOUBLE PRECISION DEFAULT 0,
    "cenarioSelecionado" TEXT,
    "valorSelecionado" DOUBLE PRECISION,
    "data" JSONB,
    "notes" TEXT,

    CONSTRAINT "budget_estimated_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_real" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Orçamento Real',
    "description" TEXT,
    "status" "BudgetRealStatus" NOT NULL DEFAULT 'DRAFT',
    "totalDirectCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "bdiPercentage" DECIMAL(5,2) NOT NULL DEFAULT 25,
    "totalWithBDI" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "bdiAdministration" DECIMAL(5,2),
    "bdiProfit" DECIMAL(5,2),
    "bdiTaxes" DECIMAL(5,2),
    "bdiRisk" DECIMAL(5,2),
    "bdiOthers" DECIMAL(5,2),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "durationMonths" INTEGER,
    "estimatedBudgetId" TEXT,
    "varianceAmount" DECIMAL(15,2),
    "variancePercent" DECIMAL(5,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_real_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_stages" (
    "id" TEXT NOT NULL,
    "budgetRealId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "code" TEXT,
    "totalCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "status" "StageStatus" NOT NULL DEFAULT 'PENDING',
    "progressPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_services" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "code" TEXT,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unitPrice" DECIMAL(15,4) NOT NULL,
    "totalPrice" DECIMAL(15,2) NOT NULL,
    "compositionId" TEXT,
    "status" "ServiceStatus" NOT NULL DEFAULT 'PENDING',
    "executedQuantity" DECIMAL(15,4),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_measurements" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "formula" TEXT,
    "dimension1" DECIMAL(15,4),
    "dimension2" DECIMAL(15,4),
    "dimension3" DECIMAL(15,4),
    "multiplier" DECIMAL(15,4),
    "result" DECIMAL(15,4) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compositions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "source" "CompositionSource" NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "unitCost" DECIMAL(15,4) NOT NULL,
    "productivity" DECIMAL(15,4),
    "category" TEXT,
    "subcategory" TEXT,
    "sourceDate" TIMESTAMP(3),
    "sourceMonth" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compositions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "composition_items" (
    "id" TEXT NOT NULL,
    "compositionId" TEXT NOT NULL,
    "type" "InsumoType" NOT NULL,
    "description" TEXT NOT NULL,
    "code" TEXT,
    "unit" TEXT NOT NULL,
    "coefficient" DECIMAL(15,6) NOT NULL,
    "unitPrice" DECIMAL(15,4) NOT NULL,
    "totalPrice" DECIMAL(15,4) NOT NULL,
    "productivity" DECIMAL(15,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "composition_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "TeamMemberRole" NOT NULL,
    "cpf" TEXT,
    "rg" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "enderecoRua" TEXT,
    "enderecoNumero" TEXT,
    "enderecoComplemento" TEXT,
    "enderecoBairro" TEXT,
    "enderecoCidade" TEXT,
    "enderecoEstado" TEXT,
    "enderecoCEP" TEXT,
    "centroCustoTipo" TEXT NOT NULL,
    "projectId" TEXT,
    "centroCustoNome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaborators" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "role" TEXT NOT NULL,
    "specialty" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "hireDate" TIMESTAMP(3) NOT NULL,
    "salary" DOUBLE PRECISION NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "costCenterId" TEXT NOT NULL,
    "costCenterType" TEXT NOT NULL,

    CONSTRAINT "collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaborator_allocations" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collaboratorId" TEXT NOT NULL,
    "costCenterId" TEXT NOT NULL,
    "costCenterType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "allocationPercentage" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "collaborator_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cub_values" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referenceYear" INTEGER NOT NULL,
    "referenceMonth" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "subtype" TEXT NOT NULL,
    "standard" TEXT NOT NULL,
    "cubCode" TEXT NOT NULL,
    "materials" DOUBLE PRECISION NOT NULL,
    "labor" DOUBLE PRECISION NOT NULL,
    "adminExpenses" DOUBLE PRECISION NOT NULL,
    "equipment" DOUBLE PRECISION NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "cub_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_codigo_key" ON "projects"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "budget_estimated_projectId_key" ON "budget_estimated"("projectId");

-- CreateIndex
CREATE INDEX "budget_estimated_projectId_idx" ON "budget_estimated"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "budget_real_estimatedBudgetId_key" ON "budget_real"("estimatedBudgetId");

-- CreateIndex
CREATE INDEX "budget_real_projectId_idx" ON "budget_real"("projectId");

-- CreateIndex
CREATE INDEX "budget_real_status_idx" ON "budget_real"("status");

-- CreateIndex
CREATE INDEX "budget_stages_budgetRealId_idx" ON "budget_stages"("budgetRealId");

-- CreateIndex
CREATE INDEX "budget_stages_order_idx" ON "budget_stages"("order");

-- CreateIndex
CREATE UNIQUE INDEX "budget_stages_budgetRealId_order_key" ON "budget_stages"("budgetRealId", "order");

-- CreateIndex
CREATE INDEX "budget_services_stageId_idx" ON "budget_services"("stageId");

-- CreateIndex
CREATE INDEX "budget_services_compositionId_idx" ON "budget_services"("compositionId");

-- CreateIndex
CREATE INDEX "service_measurements_serviceId_idx" ON "service_measurements"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "compositions_code_key" ON "compositions"("code");

-- CreateIndex
CREATE INDEX "compositions_code_idx" ON "compositions"("code");

-- CreateIndex
CREATE INDEX "compositions_source_idx" ON "compositions"("source");

-- CreateIndex
CREATE INDEX "compositions_category_idx" ON "compositions"("category");

-- CreateIndex
CREATE INDEX "composition_items_compositionId_idx" ON "composition_items"("compositionId");

-- CreateIndex
CREATE INDEX "composition_items_type_idx" ON "composition_items"("type");

-- CreateIndex
CREATE INDEX "team_members_projectId_idx" ON "team_members"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "collaborators_cpf_key" ON "collaborators"("cpf");

-- CreateIndex
CREATE INDEX "collaborators_costCenterId_idx" ON "collaborators"("costCenterId");

-- CreateIndex
CREATE INDEX "collaborators_status_idx" ON "collaborators"("status");

-- CreateIndex
CREATE INDEX "collaborator_allocations_collaboratorId_idx" ON "collaborator_allocations"("collaboratorId");

-- CreateIndex
CREATE INDEX "collaborator_allocations_costCenterId_idx" ON "collaborator_allocations"("costCenterId");

-- CreateIndex
CREATE INDEX "collaborator_allocations_isActive_idx" ON "collaborator_allocations"("isActive");

-- CreateIndex
CREATE INDEX "cub_values_reference_idx" ON "cub_values"("referenceYear", "referenceMonth");

-- CreateIndex
CREATE INDEX "cub_values_state_idx" ON "cub_values"("state");

-- CreateIndex
CREATE INDEX "cub_values_type_idx" ON "cub_values"("projectType", "subtype", "standard");

-- AddForeignKey
ALTER TABLE "budget_estimated" ADD CONSTRAINT "budget_estimated_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_real" ADD CONSTRAINT "budget_real_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_real" ADD CONSTRAINT "budget_real_estimatedBudgetId_fkey" FOREIGN KEY ("estimatedBudgetId") REFERENCES "budget_estimated"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_stages" ADD CONSTRAINT "budget_stages_budgetRealId_fkey" FOREIGN KEY ("budgetRealId") REFERENCES "budget_real"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_services" ADD CONSTRAINT "budget_services_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "budget_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_services" ADD CONSTRAINT "budget_services_compositionId_fkey" FOREIGN KEY ("compositionId") REFERENCES "compositions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_measurements" ADD CONSTRAINT "service_measurements_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "budget_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "composition_items" ADD CONSTRAINT "composition_items_compositionId_fkey" FOREIGN KEY ("compositionId") REFERENCES "compositions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

