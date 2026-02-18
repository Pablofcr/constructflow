import { prisma } from '@/lib/prisma';
import { anthropic } from './claude-client';
import { buildBudgetPrompt, buildBudgetPromptWithVariables } from './budget-prompt';
import { downloadFilesAsBase64 } from './file-utils';
import { computeDerivedValues } from './types';
import type { ExtractedVariables } from './types';
import { SINAPI_COMPOSITIONS } from '@/lib/sinapi-data';
import { DEFAULT_STAGES } from '@/lib/seed-etapas';
import { initializeProjectCompositions } from '@/lib/project-compositions';

interface AIServiceResult {
  description: string;
  code: string | null;
  unit: string;
  quantity: number;
  unitPrice: number;
  aiConfidence: number;
  aiReasoning: string;
}

interface AIStageResult {
  code: string;
  services: AIServiceResult[];
}

interface AIBudgetResult {
  stages: AIStageResult[];
}

interface ValidationWarning {
  type: 'EMPTY_STAGE' | 'LOW_QUANTITY' | 'FORBIDDEN_COMPOSITION' | 'MISSING_COMPOSITION' | 'COST_RANGE';
  message: string;
  stageCode?: string;
}

function validateAIBudget(
  result: AIBudgetResult,
  padraoEmpreendimento: string,
  constructedArea?: number
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const isPopular = padraoEmpreendimento === 'POPULAR';

  // Build sets of codes used
  const allCodes = new Set<string>();
  const stageServices: Record<string, AIServiceResult[]> = {};
  let totalCost = 0;

  for (const stage of result.stages) {
    stageServices[stage.code] = stage.services || [];
    for (const svc of stage.services || []) {
      if (svc.code) allCodes.add(svc.code);
      totalCost += (Number(svc.quantity) || 0) * (Number(svc.unitPrice) || 0);
    }
  }

  // Check mandatory stages are not empty
  const mandatoryStages = ['02', '04', '05', '08', '10', '11'];
  if (isPopular) {
    mandatoryStages.push('03', '09');
  }

  for (const code of mandatoryStages) {
    const services = stageServices[code] || [];
    if (services.length === 0) {
      const stageName = DEFAULT_STAGES.find(s => s.code === code)?.name || code;
      warnings.push({
        type: 'EMPTY_STAGE',
        message: `Etapa ${code} (${stageName}) está vazia — deveria ter serviços`,
        stageCode: code,
      });
    }
  }

  // Check revestimento quantities vs constructed area
  if (constructedArea) {
    const chapiscoCodes = ['SINAPI-87878', 'SINAPI-87879'];
    for (const stage of result.stages) {
      if (stage.code !== '08') continue;
      for (const svc of stage.services || []) {
        if (svc.code && chapiscoCodes.includes(svc.code)) {
          if (Number(svc.quantity) < constructedArea) {
            warnings.push({
              type: 'LOW_QUANTITY',
              message: `${svc.description} (${svc.code}): quantidade ${svc.quantity}m² é menor que área construída ${constructedArea}m² — deveria ser área de paredes (perímetro × pé-direito)`,
              stageCode: '08',
            });
          }
        }
      }
    }
  }

  // Popular-specific checks
  if (isPopular) {
    // Forbidden compositions for popular
    const forbidden = ['SINAPI-94970', 'SINAPI-88491'];
    for (const code of forbidden) {
      if (allCodes.has(code)) {
        warnings.push({
          type: 'FORBIDDEN_COMPOSITION',
          message: `Composição ${code} NÃO deve ser usada em padrão POPULAR`,
        });
      }
    }

    // Required compositions for popular
    const required = ['CF-02003', 'CF-02004', 'CF-03002', 'CF-09001'];
    for (const code of required) {
      if (!allCodes.has(code)) {
        warnings.push({
          type: 'MISSING_COMPOSITION',
          message: `Composição obrigatória ${code} não foi incluída no orçamento POPULAR`,
        });
      }
    }
  }

  // Cost per m² sanity check (excluding terreno stage 00)
  if (constructedArea && totalCost > 0) {
    const costPerM2 = totalCost / constructedArea;
    const minCost = isPopular ? 1200 : 1500;
    const maxCost = isPopular ? 3000 : 5000;

    if (costPerM2 < minCost || costPerM2 > maxCost) {
      warnings.push({
        type: 'COST_RANGE',
        message: `Custo/m² = R$${costPerM2.toFixed(0)} — fora da faixa esperada (R$${minCost}-${maxCost}/m²) para padrão ${padraoEmpreendimento}`,
      });
    }
  }

  return warnings;
}

function parseAiConfidence(raw: unknown): number {
  let confidence = Number(raw);
  if (isNaN(confidence) || confidence <= 0) {
    confidence = 0.5;
  } else if (confidence > 1) {
    // AI might return 85 instead of 0.85
    confidence = confidence / 100;
  }
  return Math.min(1, Math.max(0, confidence));
}

/**
 * Corrige erros sistemáticos da IA após a geração
 * Garante que valores críticos estejam corretos independentemente do que a IA gerou
 */
function correctAIErrors(
  result: AIBudgetResult,
  padraoEmpreendimento: string
): AIBudgetResult {
  const isPopular = padraoEmpreendimento === 'POPULAR';
  const corrections: string[] = [];
  
  for (const stage of result.stages) {
    for (const svc of stage.services) {
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // CORREÇÃO 1: FCK → 30MPa OBRIGATÓRIO (POPULAR)
      // Baseado no CÓDIGO CF-03004 (confiável) + descrição como fallback
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (isPopular && stage.code === '03') { // Supraestrutura
        const isCF03004ByCode = svc.code === 'CF-03004';
        const descLower = svc.description.toLowerCase();
        const isConcreteByDesc = (descLower.includes('concreto')) &&
            (descLower.includes('laje') || descLower.includes('viga') || descLower.includes('fck'));

        if (isCF03004ByCode || isConcreteByDesc) {
          // Forçar código correto
          svc.code = 'CF-03004';

          // Corrigir FCK na descrição (qualquer valor que não seja 30MPa)
          const hasWrongFCK = /FCK\s*(20|25)\s*MPa/gi.test(svc.description) ||
                              /FCK(20|25)/gi.test(svc.description);
          const hasNoFCK = !/FCK\s*30/gi.test(svc.description);

          if (hasWrongFCK || (isConcreteByDesc && hasNoFCK)) {
            const oldDesc = svc.description;
            svc.description = svc.description
              .replace(/FCK\s*20\s*MPa/gi, 'FCK 30MPa')
              .replace(/FCK\s*25\s*MPa/gi, 'FCK 30MPa')
              .replace(/FCK20/gi, 'FCK30')
              .replace(/FCK25/gi, 'FCK30');

            // Se ainda não tem FCK 30MPa na descrição, substituir a descrição inteira
            if (!/FCK\s*30/gi.test(svc.description)) {
              svc.description = 'Concreto usinado FCK 30MPa para laje e vigas — lançamento e adensamento (popular)';
            }

            svc.aiReasoning = (svc.aiReasoning || '') +
              ` ⚠️ AUTO-CORRIGIDO: FCK alterado para 30MPa (obrigatório POPULAR). Desc anterior: "${oldDesc.substring(0, 60)}"`;
            corrections.push(`Etapa 03: FCK corrigido para 30MPa (código CF-03004) — desc corrigida`);
          }
        }
      }
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // CORREÇÃO 2: Alturas incorretas (2,97m → 2,85m ou 3,47m)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (svc.aiReasoning && stage.code === '08') { // Revestimentos
        const reasoning = svc.aiReasoning;
        
        // Detectar se usou altura errada (2,97m genérico)
        const usedWrongHeight = reasoning.includes('2,97m') || reasoning.includes('2.97m') || 
                                reasoning.includes('× 2,97') || reasoning.includes('× 2.97');
        
        if (usedWrongHeight) {
          
          // ─────────────────────────────────────────────────────
          // CASO 1: Revestimento INTERNO (deve usar 2,85m)
          // ─────────────────────────────────────────────────────
          if (reasoning.includes('P_interno') || 
              reasoning.includes('paredes_internas') ||
              svc.description.toLowerCase().includes('interno')) {
            
            // Extrair P_interno do reasoning
            const pInternoMatch = reasoning.match(/P_interno\s*\(\s*(\d+(?:\.\d+)?)\s*m?\s*\)/);
            const vaosMatch = reasoning.match(/vaos[^\d]*([\d.]+)/);
            
            if (pInternoMatch) {
              const p_interno = parseFloat(pInternoMatch[1]);
              const vaos = vaosMatch ? parseFloat(vaosMatch[1]) : 0;
              
              // Recalcular com altura correta (2,85m)
              const newQuantity = Math.max(0, p_interno * 2.85 - vaos);
              const oldQuantity = svc.quantity;
              
              svc.quantity = Math.round(newQuantity * 100) / 100;
              
              // Recalcular total price
              if (typeof svc.unitPrice === 'number') {
                // totalPrice será recalculado no loop principal
              }
              
              // Atualizar reasoning
              svc.aiReasoning = reasoning
                .replace(/2,97m/g, '2,85m')
                .replace(/2\.97m/g, '2.85m')
                + ` ⚠️ CORRIGIDO: Altura alterada de 2,97m para 2,85m (H_interno); quantidade ${oldQuantity.toFixed(2)}→${svc.quantity.toFixed(2)}m²`;
              
              corrections.push(`Etapa ${stage.code}: ${svc.description} - Altura corrigida 2,97→2,85m (interno), qtd ${oldQuantity.toFixed(2)}→${svc.quantity.toFixed(2)}m²`);
            }
          }
          
          // ─────────────────────────────────────────────────────
          // CASO 2: Revestimento EXTERNO (deve usar 3,47m)
          // ─────────────────────────────────────────────────────
          else if (reasoning.includes('P_externo') || 
                   reasoning.includes('paredes_externas') ||
                   svc.description.toLowerCase().includes('externo')) {
            
            // Extrair P_externo do reasoning
            const pExternoMatch = reasoning.match(/P_externo\s*\(\s*(\d+(?:\.\d+)?)\s*m?\s*\)/);
            const vaosMatch = reasoning.match(/vaos[^\d]*([\d.]+)/);
            
            if (pExternoMatch) {
              const p_externo = parseFloat(pExternoMatch[1]);
              const vaos = vaosMatch ? parseFloat(vaosMatch[1]) : 0;
              
              // Recalcular com altura correta (3,47m)
              const newQuantity = Math.max(0, p_externo * 3.47 - vaos);
              const oldQuantity = svc.quantity;
              
              svc.quantity = Math.round(newQuantity * 100) / 100;
              
              // Atualizar reasoning
              svc.aiReasoning = reasoning
                .replace(/2,97m/g, '3,47m')
                .replace(/2\.97m/g, '3.47m')
                + ` ⚠️ CORRIGIDO: Altura alterada de 2,97m para 3,47m (H_externo); quantidade ${oldQuantity.toFixed(2)}→${svc.quantity.toFixed(2)}m²`;
              
              corrections.push(`Etapa ${stage.code}: ${svc.description} - Altura corrigida 2,97→3,47m (externo), qtd ${oldQuantity.toFixed(2)}→${svc.quantity.toFixed(2)}m²`);
            }
          }
        }
      }
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // CORREÇÃO 3: Pintura (mesmo tratamento de alturas)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (svc.aiReasoning && stage.code === '11') { // Pintura
        const reasoning = svc.aiReasoning;
        
        const usedWrongHeight = reasoning.includes('2,97m') || reasoning.includes('2.97m') || 
                                reasoning.includes('× 2,97') || reasoning.includes('× 2.97');
        
        if (usedWrongHeight) {
          
          // Pintura INTERNA → 2,85m
          if (reasoning.includes('P_interno') || 
              reasoning.includes('paredes_internas') ||
              svc.description.toLowerCase().includes('interna')) {
            
            const pInternoMatch = reasoning.match(/P_interno\s*\(\s*(\d+(?:\.\d+)?)\s*m?\s*\)/);
            const vaosMatch = reasoning.match(/vaos[^\d]*([\d.]+)/);
            
            if (pInternoMatch) {
              const p_interno = parseFloat(pInternoMatch[1]);
              const vaos = vaosMatch ? parseFloat(vaosMatch[1]) : 0;
              const newQuantity = Math.max(0, p_interno * 2.85 - vaos);
              const oldQuantity = svc.quantity;
              
              svc.quantity = Math.round(newQuantity * 100) / 100;
              svc.aiReasoning = reasoning
                .replace(/2,97m/g, '2,85m')
                .replace(/2\.97m/g, '2.85m')
                + ` ⚠️ CORRIGIDO: H_interno 2,97→2,85m; qtd ${oldQuantity.toFixed(2)}→${svc.quantity.toFixed(2)}m²`;
              
              corrections.push(`Etapa ${stage.code}: ${svc.description} - Altura corrigida 2,97→2,85m (pintura interna), qtd ${oldQuantity.toFixed(2)}→${svc.quantity.toFixed(2)}m²`);
            }
          }
          
          // Pintura EXTERNA → 3,47m
          else if (reasoning.includes('P_externo') || 
                   reasoning.includes('paredes_externas') ||
                   svc.description.toLowerCase().includes('externa')) {
            
            const pExternoMatch = reasoning.match(/P_externo\s*\(\s*(\d+(?:\.\d+)?)\s*m?\s*\)/);
            const vaosMatch = reasoning.match(/vaos[^\d]*([\d.]+)/);
            
            if (pExternoMatch) {
              const p_externo = parseFloat(pExternoMatch[1]);
              const vaos = vaosMatch ? parseFloat(vaosMatch[1]) : 0;
              const newQuantity = Math.max(0, p_externo * 3.47 - vaos);
              const oldQuantity = svc.quantity;
              
              svc.quantity = Math.round(newQuantity * 100) / 100;
              svc.aiReasoning = reasoning
                .replace(/2,97m/g, '3,47m')
                .replace(/2\.97m/g, '3.47m')
                + ` ⚠️ CORRIGIDO: H_externo 2,97→3,47m; qtd ${oldQuantity.toFixed(2)}→${svc.quantity.toFixed(2)}m²`;
              
              corrections.push(`Etapa ${stage.code}: ${svc.description} - Altura corrigida 2,97→3,47m (pintura externa), qtd ${oldQuantity.toFixed(2)}→${svc.quantity.toFixed(2)}m²`);
            }
          }
        }
      }
      
    } // end for services
  } // end for stages

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CORREÇÃO 4: Administração da Obra (POPULAR) — etapa 19
  // REGRAS FIXAS: engenheiro = 0,40 mês | mestre = 4 meses
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (isPopular) {
    for (const stage of result.stages) {
      if (stage.code !== '19') continue;

      for (const svc of stage.services) {
        // ENGENHEIRO CIVIL: 1 engenheiro / 10 casas × 4 meses = 0,40 mês
        if (svc.code === 'SINAPI-90778' || svc.description.toLowerCase().includes('engenheiro')) {
          const oldQty = svc.quantity;
          if (Number(svc.quantity) !== 0.40) {
            svc.quantity = 0.40;
            svc.aiReasoning = `Prazo popular = 4 meses; rateio 1 engenheiro / 10 casas = 4 × (1/10) = 0,40 mês` +
              ` ⚠️ AUTO-CORRIGIDO: qtd ${oldQty} → 0,40 (regra fixa POPULAR)`;
            corrections.push(`Etapa 19: Engenheiro corrigido ${oldQty} → 0,40 mês (4 meses ÷ 10 casas)`);
          }
        }

        // MESTRE DE OBRAS: prazo fixo 4 meses
        if (svc.code === 'SINAPI-90780' || svc.description.toLowerCase().includes('mestre de obras')) {
          const oldQty = svc.quantity;
          if (Number(svc.quantity) !== 4) {
            svc.quantity = 4;
            svc.aiReasoning = `Prazo popular = 4 meses; 1 mestre por obra = 4 meses` +
              ` ⚠️ AUTO-CORRIGIDO: qtd ${oldQty} → 4 (regra fixa POPULAR)`;
            corrections.push(`Etapa 19: Mestre de obras corrigido ${oldQty} → 4 meses (prazo fixo POPULAR)`);
          }
        }

        // EPI: máximo 6 trabalhadores para obra popular
        if (svc.code === 'SINAPI-90786' || svc.description.toLowerCase().includes('epi')) {
          const oldQty = svc.quantity;
          if (Number(svc.quantity) > 6) {
            svc.quantity = 6;
            svc.aiReasoning = `Estimativa: 6 trabalhadores para obra popular 60m²` +
              ` ⚠️ AUTO-CORRIGIDO: qtd ${oldQty} → 6 (máximo para POPULAR)`;
            corrections.push(`Etapa 19: EPI corrigido ${oldQty} → 6 un (máximo POPULAR)`);
          }
        }
      }
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CORREÇÃO 5: Validação do MÉTODO H/V
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  // Consolidar todo o aiReasoning para buscar evidências do método H/V
  const allReasoning = result.stages
    .flatMap(st => st.services.map(svc => svc.aiReasoning || ''))
    .join('\n');
  
  // Buscar padrões do método H/V
  const hasHorizontals = /H\d+\s*=/i.test(allReasoning);
  const hasVerticals = /V\d+\s*=/i.test(allReasoning);
  const hasPHorizontal = /P_horizontal/i.test(allReasoning);
  const hasPVertical = /P_vertical/i.test(allReasoning);
  
  // Se o método H/V não foi encontrado de forma alguma
  if (!hasHorizontals && !hasVerticals) {
    const warning = '⚠️ MÉTODO H/V NÃO DETECTADO: A IA não usou o método H/V (H0, H1... V0, V1...) para calcular perímetros. Validar manualmente os perímetros.';
    
    // Adicionar warning no primeiro serviço que menciona perímetro
    for (const stage of result.stages) {
      for (const svc of stage.services) {
        if (svc.aiReasoning && 
            (svc.aiReasoning.includes('P_interno') || 
             svc.aiReasoning.includes('P_externo') || 
             svc.aiReasoning.includes('P_total'))) {
          
          if (!svc.aiReasoning.includes('MÉTODO H/V NÃO DETECTADO')) {
            svc.aiReasoning += `\n\n${warning}`;
            corrections.push('VALIDAÇÃO H/V: Método H/V não foi aplicado pela IA');
            break;
          }
        }
      }
    }
  }
  // Se encontrou parcial (só H ou só V)
  else if (hasHorizontals && !hasVerticals) {
    const warning = '⚠️ MÉTODO H/V INCOMPLETO: Detectadas paredes HORIZONTAIS (H0, H1...) mas faltam VERTICAIS (V0, V1...). Validar manualmente.';
    
    for (const stage of result.stages) {
      for (const svc of stage.services) {
        if (svc.aiReasoning && svc.aiReasoning.includes('H0')) {
          if (!svc.aiReasoning.includes('MÉTODO H/V INCOMPLETO')) {
            svc.aiReasoning += `\n\n${warning}`;
            corrections.push('VALIDAÇÃO H/V: Faltam paredes VERTICAIS (V0, V1...)');
            break;
          }
        }
      }
    }
  }
  else if (hasVerticals && !hasHorizontals) {
    const warning = '⚠️ MÉTODO H/V INCOMPLETO: Detectadas paredes VERTICAIS (V0, V1...) mas faltam HORIZONTAIS (H0, H1...). Validar manualmente.';
    
    for (const stage of result.stages) {
      for (const svc of stage.services) {
        if (svc.aiReasoning && svc.aiReasoning.includes('V0')) {
          if (!svc.aiReasoning.includes('MÉTODO H/V INCOMPLETO')) {
            svc.aiReasoning += `\n\n${warning}`;
            corrections.push('VALIDAÇÃO H/V: Faltam paredes HORIZONTAIS (H0, H1...)');
            break;
          }
        }
      }
    }
  }
  // Se encontrou H e V mas não as somas P_horizontal e P_vertical
  else if ((hasHorizontals && hasVerticals) && (!hasPHorizontal || !hasPVertical)) {
    const warning = '⚠️ MÉTODO H/V PARCIAL: Paredes H/V listadas mas faltam somas P_horizontal e P_vertical. Validar cálculo do P_total.';
    
    for (const stage of result.stages) {
      for (const svc of stage.services) {
        if (svc.aiReasoning && 
            (svc.aiReasoning.includes('H0') || svc.aiReasoning.includes('V0'))) {
          
          if (!svc.aiReasoning.includes('MÉTODO H/V PARCIAL')) {
            svc.aiReasoning += `\n\n${warning}`;
            corrections.push('VALIDAÇÃO H/V: Faltam somas P_horizontal e P_vertical');
            break;
          }
        }
      }
    }
  }
  // Se encontrou tudo, validar se a sequência está completa (sem pulos)
  else if (hasHorizontals && hasVerticals && hasPHorizontal && hasPVertical) {
    // Extrair todos os números H
    const hNumbers = Array.from(allReasoning.matchAll(/H(\d+)\s*=/gi))
      .map(m => parseInt(m[1]))
      .sort((a, b) => a - b);
    
    // Extrair todos os números V
    const vNumbers = Array.from(allReasoning.matchAll(/V(\d+)\s*=/gi))
      .map(m => parseInt(m[1]))
      .sort((a, b) => a - b);
    
    // Verificar se há pulos na sequência H (ex: H0, H1, H3... falta H2)
    let hasGapsH = false;
    for (let i = 1; i < hNumbers.length; i++) {
      if (hNumbers[i] !== hNumbers[i-1] + 1 && hNumbers[i] !== hNumbers[i-1]) {
        hasGapsH = true;
        break;
      }
    }
    
    // Verificar se há pulos na sequência V
    let hasGapsV = false;
    for (let i = 1; i < vNumbers.length; i++) {
      if (vNumbers[i] !== vNumbers[i-1] + 1 && vNumbers[i] !== vNumbers[i-1]) {
        hasGapsV = true;
        break;
      }
    }
    
    if (hasGapsH || hasGapsV) {
      const gapMsg = hasGapsH && hasGapsV 
        ? 'HORIZONTAIS e VERTICAIS têm pulos na sequência' 
        : hasGapsH 
        ? 'HORIZONTAIS têm pulos (ex: H0, H1, H3... falta H2)' 
        : 'VERTICAIS têm pulos (ex: V0, V1, V3... falta V2)';
      
      const warning = `⚠️ MÉTODO H/V COM LACUNAS: ${gapMsg}. Pode haver paredes não contabilizadas. Validar no projeto.`;
      
      for (const stage of result.stages) {
        for (const svc of stage.services) {
          if (svc.aiReasoning && 
              (svc.aiReasoning.includes('H0') || svc.aiReasoning.includes('V0'))) {
            
            if (!svc.aiReasoning.includes('MÉTODO H/V COM LACUNAS')) {
              svc.aiReasoning += `\n\n${warning}`;
              corrections.push(`VALIDAÇÃO H/V: ${gapMsg}`);
              break;
            }
          }
        }
      }
    }
    // Se passou em todas as validações
    else {
      corrections.push(`✅ VALIDAÇÃO H/V: Método H/V aplicado corretamente! H[${hNumbers.join(',')}] + V[${vNumbers.join(',')}]`);
    }
  }
  
  // Log resumo das correções
  if (corrections.length > 0) {
    console.log(`\n${'='.repeat(70)}`);
    console.log('🔧 CORREÇÕES AUTOMÁTICAS APLICADAS:');
    console.log('='.repeat(70));
    corrections.forEach((msg, idx) => {
      console.log(`${idx + 1}. ${msg}`);
    });
    console.log('='.repeat(70));
    console.log(`Total: ${corrections.length} correção(ões) aplicada(s)\n`);
  } else {
    console.log('✅ Nenhuma correção automática necessária - IA seguiu o framework corretamente!');
  }
  
  return result;
}

export async function generateAIBudget(budgetAIId: string): Promise<void> {
  const startTime = Date.now();

  try {
    // Update status to GENERATING
    await prisma.budgetAI.update({
      where: { id: budgetAIId },
      data: { status: 'GENERATING' },
    });

    // Fetch budget AI with project data
    const budgetAI = await prisma.budgetAI.findUnique({
      where: { id: budgetAIId },
      include: {
        project: {
          include: {
            files: true,
            budgetEstimated: { select: { constructedArea: true } },
          },
        },
        stages: { orderBy: { order: 'asc' } },
      },
    });

    if (!budgetAI) throw new Error('BudgetAI não encontrado');

    const project = budgetAI.project;
    const files = project.files;

    if (files.length === 0) {
      throw new Error('Nenhum arquivo anexado ao projeto');
    }

    // Limit: max 8 files
    const filesToUse = files.slice(0, 8);

    // Download files from Supabase Storage as base64
    const fileContents = await downloadFilesAsBase64(filesToUse);

    if (fileContents.length === 0) {
      throw new Error('Não foi possível baixar nenhum arquivo');
    }

    // Check if we have confirmed variables (Phase 2)
    const hasConfirmedVars = budgetAI.extractedVariables != null;
    let confirmedVars: ExtractedVariables | null = null;

    if (hasConfirmedVars) {
      confirmedVars = budgetAI.extractedVariables as unknown as ExtractedVariables;
      // Ensure derived values are computed
      if (!confirmedVars.derived) {
        confirmedVars.derived = computeDerivedValues(confirmedVars);
      }
      console.log('🔄 Fase 2: Usando variáveis confirmadas pelo engenheiro');
    } else {
      console.log('🔄 Fase única: Geração sem variáveis pré-extraídas (fluxo legado)');
    }

    // Build prompt
    const constructedArea = project.budgetEstimated?.constructedArea || undefined;
    const projectInfo = {
      name: project.name,
      tipoObra: project.tipoObra,
      padraoEmpreendimento: project.padraoEmpreendimento,
      enderecoEstado: project.enderecoEstado,
      enderecoCidade: project.enderecoCidade,
      constructedArea: confirmedVars?.areaConstruida || constructedArea,
    };
    const fileInfo = filesToUse.map((f) => ({
      fileName: f.fileName,
      category: f.category,
    }));

    const { systemPrompt, userPrompt } = confirmedVars
      ? buildBudgetPromptWithVariables(projectInfo, fileInfo, confirmedVars)
      : buildBudgetPrompt(projectInfo, fileInfo);

    // Delete existing services if re-generating (Phase 2 after review)
    if (hasConfirmedVars && budgetAI.stages.length > 0) {
      for (const stage of budgetAI.stages) {
        await prisma.budgetAIService.deleteMany({
          where: { stageId: stage.id },
        });
      }
      // Reset stage totals
      for (const stage of budgetAI.stages) {
        await prisma.budgetAIStage.update({
          where: { id: stage.id },
          data: { totalCost: 0, percentage: 0 },
        });
      }
    }

    // Call Claude API with extended thinking
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      thinking: {
        type: 'enabled',
        budget_tokens: 10000,
      },
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            ...fileContents,
            { type: 'text', text: userPrompt },
          ],
        },
      ],
    });

    // Extract text response (skip thinking blocks)
    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Claude não retornou texto');
    }

    // Parse JSON from response (handle potential markdown wrapping)
    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    let result: AIBudgetResult;
    try {
      result = JSON.parse(jsonStr);
    } catch {
      throw new Error(`JSON inválido retornado pela IA: ${jsonStr.substring(0, 200)}`);
    }

    if (!result.stages || !Array.isArray(result.stages)) {
      throw new Error('Resposta da IA não contém stages');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // CORREÇÃO AUTOMÁTICA DE ERROS SISTEMÁTICOS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('🔧 Aplicando correção automática de erros...');
    result = correctAIErrors(result, project.padraoEmpreendimento);
    console.log('✅ Correção automática concluída');

    // Post-generation validation (log warnings, don't block)
    const validationWarnings = validateAIBudget(
      result,
      project.padraoEmpreendimento,
      constructedArea
    );
    if (validationWarnings.length > 0) {
      console.warn('=== VALIDAÇÃO DO ORÇAMENTO IA ===');
      for (const w of validationWarnings) {
        console.warn(`[${w.type}]${w.stageCode ? ` Etapa ${w.stageCode}:` : ''} ${w.message}`);
      }
      console.warn(`Total: ${validationWarnings.length} warning(s)`);
      console.warn('=================================');
    }

    // Ensure project compositions are initialized (idempotent)
    const projectState = project.enderecoEstado || 'SP';
    await initializeProjectCompositions(project.id, projectState);

    // Build composition lookup from ProjectComposition (project-scoped prices)
    const compositionByCode: Record<string, string> = {};
    const projectCompositionByCode: Record<string, string> = {};
    const compositionPrices: Record<string, number> = {};

    const projectCompositions = await prisma.projectComposition.findMany({
      where: { projectId: project.id },
      select: { id: true, code: true, unitCost: true, sourceId: true },
    });

    for (const comp of projectCompositions) {
      projectCompositionByCode[comp.code] = comp.id;
      compositionPrices[comp.code] = Number(comp.unitCost);
      if (comp.sourceId) {
        compositionByCode[comp.code] = comp.sourceId;
      }
    }

    // Fallback: also map from global compositions for codes not in project
    const dbCompositions = await prisma.composition.findMany({
      select: { id: true, code: true, unitCost: true },
    });

    for (const comp of dbCompositions) {
      if (!compositionByCode[comp.code]) {
        compositionByCode[comp.code] = comp.id;
      }
      if (!compositionPrices[comp.code]) {
        compositionPrices[comp.code] = Number(comp.unitCost);
      }
    }

    // Also map from static data as last fallback
    for (const comp of SINAPI_COMPOSITIONS) {
      if (!compositionPrices[comp.code]) {
        compositionPrices[comp.code] = comp.baseCost;
      }
    }

    // Build stage lookup (budgetAI stages already created)
    const stageByCode: Record<string, string> = {};
    for (const stage of budgetAI.stages) {
      if (stage.code) stageByCode[stage.code] = stage.id;
    }

    let grandTotal = 0;

    // Process each stage from AI response
    for (const aiStage of result.stages) {
      const stageId = stageByCode[aiStage.code];
      if (!stageId) continue;
      if (!aiStage.services || aiStage.services.length === 0) continue;

      let stageTotal = 0;

      for (const svc of aiStage.services) {
        const quantity = Math.max(0, Number(svc.quantity) || 0);
        // Project composition price takes priority over AI-estimated price
        const unitPrice = (svc.code && compositionPrices[svc.code]) ? compositionPrices[svc.code] : (Number(svc.unitPrice) || 0);
        const totalPrice = Math.round(quantity * unitPrice * 100) / 100;
        const compositionId = svc.code ? compositionByCode[svc.code] || null : null;
        const projectCompId = svc.code ? projectCompositionByCode[svc.code] || null : null;

        await prisma.budgetAIService.create({
          data: {
            stageId,
            description: svc.description,
            code: svc.code || null,
            unit: svc.unit,
            quantity,
            unitPrice,
            totalPrice,
            compositionId,
            projectCompositionId: projectCompId,
            aiConfidence: parseAiConfidence(svc.aiConfidence),
            aiReasoning: svc.aiReasoning || null,
          },
        });

        stageTotal += totalPrice;
      }

      grandTotal += stageTotal;
    }

    // Update stage totals and percentages
    for (const aiStage of result.stages) {
      const stageId = stageByCode[aiStage.code];
      if (!stageId) continue;

      // Recalculate from DB
      const services = await prisma.budgetAIService.findMany({
        where: { stageId },
        select: { totalPrice: true },
      });

      const stageTotal = services.reduce((sum, s) => sum + Number(s.totalPrice), 0);
      const percentage = grandTotal > 0 ? (stageTotal / grandTotal) * 100 : 0;

      await prisma.budgetAIStage.update({
        where: { id: stageId },
        data: {
          totalCost: stageTotal,
          percentage: Math.round(percentage * 100) / 100,
        },
      });
    }

    const durationMs = Date.now() - startTime;

    // Update budget AI with results
    await prisma.budgetAI.update({
      where: { id: budgetAIId },
      data: {
        status: 'GENERATED',
        totalDirectCost: grandTotal,
        aiModel: 'claude-sonnet-4-5-20250929',
        aiPromptTokens: response.usage?.input_tokens || null,
        aiOutputTokens: response.usage?.output_tokens || null,
        aiDurationMs: durationMs,
        generatedAt: new Date(),
        filesUsed: filesToUse.map((f) => ({
          id: f.id,
          fileName: f.fileName,
          category: f.category,
        })),
      },
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    console.error('Erro na geração do orçamento IA:', error);

    await prisma.budgetAI.update({
      where: { id: budgetAIId },
      data: {
        status: 'FAILED',
        aiError: errorMessage,
        aiDurationMs: durationMs,
      },
    });
  }
}
