import { SINAPI_COMPOSITIONS, SinapiCompositionData } from '@/lib/sinapi-data';
import { DEFAULT_STAGES } from '@/lib/seed-etapas';

interface ProjectInfo {
  name: string;
  tipoObra: string;
  padraoEmpreendimento: string;
  enderecoEstado: string;
  enderecoCidade: string;
  constructedArea?: number;
}

interface FileInfo {
  fileName: string;
  category: string;
}

function buildCompositionCatalog(): string {
  const grouped: Record<string, SinapiCompositionData[]> = {};

  for (const comp of SINAPI_COMPOSITIONS) {
    const key = `${comp.category} - ${comp.subcategory}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(comp);
  }

  const lines: string[] = [];
  for (const [category, comps] of Object.entries(grouped)) {
    lines.push(`\n### Etapa ${category}`);
    for (const c of comps) {
      lines.push(`- ${c.code} | ${c.description} | Un: ${c.unit} | Custo base: R$${c.baseCost.toFixed(2)}`);
    }
  }

  return lines.join('\n');
}

function buildStageList(): string {
  return DEFAULT_STAGES.map(
    (s) => `- ${s.code}: ${s.name} — ${s.description || ''}`
  ).join('\n');
}

export function buildBudgetPrompt(project: ProjectInfo, files: FileInfo[]): string {
  const stageList = buildStageList();
  const catalog = buildCompositionCatalog();

  return `Você é um engenheiro orçamentista especializado em construção civil brasileira.

## TAREFA
Analise os arquivos de projeto anexados (PDFs e/ou imagens) e gere um orçamento detalhado para a obra descrita abaixo.
Extraia dimensões, áreas, quantidades e especificações dos projetos para calcular os quantitativos de cada serviço.
NOTA: Arquivos PDF técnicos fornecem dados mais precisos. Imagens (plantas humanizadas, perspectivas) podem conter informações úteis mas com menor precisão — ajuste a confiança (aiConfidence) de acordo.

## DADOS DO PROJETO
- Nome: ${project.name}
- Tipo: ${project.tipoObra}
- Padrão: ${project.padraoEmpreendimento}
- Estado: ${project.enderecoEstado}
- Cidade: ${project.enderecoCidade}
${project.constructedArea ? `- Área construída: ${project.constructedArea} m²` : ''}

## ARQUIVOS ANEXADOS
${files.map((f) => `- ${f.fileName} (${f.category})`).join('\n')}

## 20 ETAPAS DA OBRA (00-19)
${stageList}

## CATÁLOGO DE COMPOSIÇÕES SINAPI DISPONÍVEIS
Use PREFERENCIALMENTE as composições do catálogo abaixo. O código (ex: CF-01001, SINAPI-73964) deve ser referenciado exatamente.
Se nenhuma composição existente se encaixar, use code: null e descreva o serviço.
${catalog}

## INSTRUÇÕES DETALHADAS

1. **Analise cada PDF cuidadosamente**:
   - Plantas baixas: extraia áreas de cômodos, dimensões de paredes, portas, janelas
   - Projeto estrutural: identifique fundações, pilares, vigas, lajes
   - Projeto elétrico: conte pontos de tomada, interruptores, circuitos
   - Projeto hidráulico: identifique pontos de água, esgoto, louças

2. **Para cada etapa (00-19)**, liste os serviços necessários com:
   - Descrição clara do serviço
   - Código SINAPI/CF quando disponível no catálogo
   - Unidade de medida
   - Quantidade calculada a partir dos projetos
   - Preço unitário (use o baseCost do catálogo)
   - Confiança (0.0 a 1.0) na estimativa

3. **Regras**:
   - NÃO invente composições com códigos fictícios. Use os códigos do catálogo acima ou null.
   - Quantidades devem ser baseadas nos projetos, não estimativas genéricas.
   - Arredonde quantidades para 2 casas decimais.
   - Inclua um breve raciocínio (aiReasoning) explicando como chegou na quantidade.
   - Etapas sem serviços identificados nos projetos podem ficar vazias (services: []).
   - A etapa 00 (Terreno) geralmente fica vazia pois depende de informações financeiras, não de projeto.

## FORMATO DE SAÍDA
Responda APENAS com o JSON abaixo, sem markdown, sem explicações antes ou depois:

{
  "stages": [
    {
      "code": "01",
      "services": [
        {
          "description": "Limpeza do terreno mecanizada",
          "code": "CF-01001",
          "unit": "m²",
          "quantity": 250.00,
          "unitPrice": 6.50,
          "aiConfidence": 0.85,
          "aiReasoning": "Área total do terreno: 10m x 25m = 250m² conforme planta de situação"
        }
      ]
    }
  ]
}`;
}
