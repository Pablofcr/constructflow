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

export interface BudgetPromptResult {
  systemPrompt: string;
  userPrompt: string;
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

function buildCalculationFramework(constructedArea?: number): string {
  const areaRef = constructedArea ? `${constructedArea}` : '??';
  return `
## FRAMEWORK DE CÁLCULO OBRIGATÓRIO

Antes de gerar os serviços, você DEVE seguir estes passos na ordem:

### STEP 1: Extrair variáveis dos projetos (PDFs/imagens)
Analise cada arquivo e extraia:

**Áreas e Perímetros:**
- A_construida = área construída total (m²) ${constructedArea ? `[informado: ${areaRef}m²]` : '[extrair do projeto]'}
- A_terreno = área do terreno (m²)
- P_externo = perímetro externo da edificação (m)
- P_interno = perímetro total de TODAS as paredes internas (m) — some TODOS os comprimentos
- P_muro = perímetro dos muros (m)
- P_total = P_externo + P_interno + P_muro (m)

**Alturas (ATENÇÃO: diferenciar interno/externo/muro):**
- H_interno = 2,85m — altura para alvenaria, revestimentos internos
- H_externo = 2,97m — altura fachada (2,85m + 0,12m laje) — usar 2,97m quando não especificado no projeto
- H_platibanda = 0,50m — altura adicional da platibanda (somar ao H_externo para fachada completa)
- H_muro = 2,50m (quando não especificado no projeto)

**Vãos:**
- N_portas = número total de portas (un)
- N_janelas = número total de janelas (un)
- N_portoes = número total de portões em muros (un)
- A_vaos_portas = N_portas × 0,80 × 2,10 (m²) — área total dos vãos de portas
- A_vaos_janelas = somatório(largura × altura de cada janela) (m²)
- A_vaos_portoes = somatório(largura × altura de cada portão) (m²)
- A_vaos_total = A_vaos_portas + A_vaos_janelas + A_vaos_portoes (m²)

**Ambientes:**
- N_banheiros = número de banheiros
- A_cozinha_paredes = área de paredes da cozinha para cerâmica (m²)
- A_banheiros_paredes = área de paredes dos banheiros para cerâmica (m²)

### STEP 2: Calcular variáveis derivadas
- A_paredes_internas = P_interno × H_interno(2,85m) − A_vaos_portas_internas (m²)
- A_paredes_externas = P_externo × (H_externo(2,97m) + H_platibanda(0,50m)) − A_vaos_janelas − A_vaos_portas_externas (m²)
- A_paredes_muros = P_muro × H_muro(2,50m) − A_vaos_portoes (m²)
- A_paredes_total = A_paredes_internas + A_paredes_externas + A_paredes_muros (m²)
- A_cobertura = A_construida × 1,15 (m²) — acréscimo de 15% para beirais
- V_escavacao = P_total × 0,40 × 0,50 (m³) — para fundação popular

### STEP 3: Verificação de sanidade
ANTES de prosseguir, verifique:
- A_paredes_total deve ser aproximadamente 3,5 a 4,5 × A_construida
  → Para casa 60m²: paredes totais devem estar entre 210m² e 270m²
  → Se A_paredes_total < 2,5 × A_construida, REVISE o perímetro — provavelmente está faltando paredes internas ou muros
- Chapisco/emboço interno NUNCA pode ser menor que A_construida × 2
- Chapisco/reboco externo NUNCA pode ser menor que A_construida × 1,5

### STEP 4: Mapeamento variável → serviço
Use as variáveis calculadas para preencher as quantidades de cada serviço:
| Serviço | Quantidade = |
|---------|--------------|
| Limpeza terreno | A_terreno |
| Locação obra | P_externo + 8m |
| Escavação valas | V_escavacao |
| Alvenaria de pedra (popular) | P_total × 0,40 × 0,30 |
| Baldrame tijolo (popular) | P_total (metros lineares) |
| Laje treliçada (popular) | A_construida |
| Alvenaria paredes | (P_interno + P_externo) × H_interno − A_vaos_total |
| Vergas | N_portas + N_janelas, comprimento = (largura + 0,60m) cada |
| Chapisco interno | P_interno × H_interno(2,85m) − A_vaos_portas_internas |
| Emboço interno | P_interno × H_interno(2,85m) − A_vaos_portas_internas |
| Chapisco externo | (P_externo × (H_externo(2,97m) + H_platibanda(0,50m))) + A_paredes_muros − A_vaos_janelas − A_vaos_portoes |
| Reboco externo | (P_externo × (H_externo(2,97m) + H_platibanda(0,50m))) + A_paredes_muros − A_vaos_janelas − A_vaos_portoes |
| Cerâmico parede | A_cozinha_paredes + A_banheiros_paredes |
| Forro/reboco teto | A_construida |
| Contrapiso | A_construida |
| Piso cerâmico | A_construida |
| Pintura interna (massa+PVA) | P_interno × H_interno(2,85m) − A_vaos_portas_internas |
| Pintura externa (selador+textura) | A_paredes_externas + (A_paredes_muros − A_vaos_portoes) |
| Cobertura | A_cobertura |
| Aço vigas | P_total × 4 barras ferro φ10,0mm + estribos aço φ4,3mm @ 15cm |
`;
}

function buildCompositionGuide(padraoEmpreendimento: string): string {
  if (padraoEmpreendimento !== 'POPULAR') {
    return `
## GUIA DE SELEÇÃO DE COMPOSIÇÕES (Padrão: ${padraoEmpreendimento})
- Fundação: conforme projeto estrutural (sapata, estaca, viga baldrame conforme complexidade)
- Forro: gesso, drywall ou PVC conforme projeto
- Pintura externa: acrílica (SINAPI-88491) ou conforme projeto
- Chuveiro: elétrico ou a gás conforme projeto
`;
  }

  return `
## GUIA DE SELEÇÃO DE COMPOSIÇÕES (Padrão: POPULAR)

### TABELA OBRIGATÓRIA — USAR vs NÃO USAR para POPULAR

| Etapa | USAR (composição correta) | NÃO USAR (errado para popular) |
|-------|--------------------------|-------------------------------|
| 02 Infraestrutura | CF-02003 Alvenaria de pedra + CF-02004 Baldrame tijolo | SINAPI-94970 Viga baldrame concreto |
| 03 Supraestrutura | CF-03002 Laje treliçada + CF-03003 Tela Q138 + CF-03004 Concreto FCK30 + CF-03005 Aço CA-50 | (nunca deixar etapa vazia) |
| 09 Fôrros | CF-09001 Reboco de teto | Gesso ou PVC |
| 11 Pintura ext. | CF-11001 Selador + CF-11003 Textura | SINAPI-88491 Acrílica |
| 12 Chuveiro | Chuveiro COMUM (infraestrutura apenas) | Chuveiro elétrico |
`;
}

function buildPopularRules(): string {
  return `
## REGRAS OBRIGATÓRIAS PARA CASAS POPULARES

ATENÇÃO: Estas regras são OBRIGATÓRIAS para padrão POPULAR. Siga rigorosamente cada item.

### MATERIAIS OBRIGATÓRIOS:
- **CIMENTO**: usar CPIII em TODAS as composições e traços (chapisco, reboco, concreto, argamassas)
- **CONCRETO SUPERESTRUTURA**: usar FCK 30MPa (NÃO usar FCK 20MPa)

### ALTURAS (ATENÇÃO — diferenciar):
- **Pé-direito padrão**: 2,97m (quando não especificado no projeto) — usar 2,85m para cálculos internos
- **H_interno** = 2,85m (alvenaria, revestimentos internos)
- **H_externo** = 2,97m (2,85m + 0,12m laje)
- **H_platibanda** = 0,50m (adicional para fachada externa)
- **H_muro** = 2,50m (quando não especificado no projeto)

### PERÍMETROS:
- **Perímetro paredes** = soma de TODOS os comprimentos das paredes (internas + externas + muros)
- **P_total** = P_externo + P_interno + P_muro
- Sempre MEDIR TODOS os comprimentos (não estimar)

### 01 - Serviços Preliminares
- Limpeza terreno (SINAPI-73847): Área = área total do TERRENO (não da edificação)
- Locação de obra (SINAPI-84275): Perímetro da edificação + 1m cada lado

### 02 - Infraestrutura
- Escavação valas (SINAPI-79479): Volume = P_total × 0,40m × 0,50m
- Fundação popular: NÃO usar viga baldrame de concreto (SINAPI-94970)
  → Usar: Alvenaria de pedra (CF-02003) — Volume = P_total × 0,40 × 0,30
  → Usar: Baldrame tijolo (CF-02004) — Comprimento = P_total (metros lineares)
- Reaterro (SINAPI-79480): Volume = Volume escavação − (Volume alvenaria de pedra + Volume baldrame tijolo)

### 03 - Supraestrutura (OBRIGATÓRIA — esta etapa NUNCA deve ficar vazia)
- Laje treliçada (CF-03002): Área = área construída
- Concreto laje FCK 30MPa (CF-03004): Volume = Área construída × 0,08m
- Tela Q138 (CF-03003): Área = área construída × 1,15
- Vigas concreto FCK 30MPa (CF-03004): Volume = P_total × 0,15 × 0,15
- Aço vigas (CF-03005): P_total × 4 barras de ferro φ10,0mm + estribos aço φ4,3mm a cada 15cm

### 04 - Alvenaria
- Alvenaria (SINAPI-87522): (P_interno + P_externo) × 2,85m − A_vaos_total (portas, janelas e portões)
- Vergas (SINAPI-87529): para CADA porta E janela, comprimento = largura da porta/janela + 0,60m
- Contravergas (SINAPI-87530): para cada janela, 2 unidades de 60cm

### 05 - Cobertura
- Estrutura + telhas: Área = Área construída × 1,15 (acréscimo de 15% para beirais)

### 06 - Impermeabilização
- Fundação (SINAPI-98557): Área = P_total × 0,90m
- Banheiro (SINAPI-98556): Área do piso + área das paredes do banheiro até altura de 50cm

### 08 - Revestimentos (ATENÇÃO: quantidades são MAIORES que a área construída!)
- Chapisco INTERNO (SINAPI-87878): P_interno × 2,85m − A_vaos_portas_internas
  → Referência casa 60m²: ~222m²
- Emboço INTERNO (SINAPI-87879): mesma área do chapisco interno
- Chapisco EXTERNO (SINAPI-87884): P_externo × (2,97m + 0,50m platibanda) + A_paredes_muros − A_vaos_janelas − A_vaos_portoes
  → Referência casa 60m²: ~235m²
- Reboco EXTERNO (SINAPI-87881): mesma área do chapisco externo
- Cerâmico parede (SINAPI-87882): cozinha + banheiros (referência: ~59m² para casa 60m²)

### 09 - Fôrros
- Usar REBOCO DE TETO (CF-09001) — NÃO usar gesso nem PVC
- Área = área construída

### 11 - Pintura
- Interna: Emassamento (SINAPI-88495) + PVA (SINAPI-88489) = mesma área do chapisco interno
- EXTERNA popular: Selador (CF-11001) + Textura (CF-11003) — NÃO usar pintura acrílica (SINAPI-88491)
- Área externa = A_paredes_externas + (A_paredes_muros − A_vaos_portoes)

### 12 - Louças e Metais
- Por banheiro: 1 bacia + 1 lavatório + 1 chuveiro COMUM (não elétrico — apenas infraestrutura)
- 1 tanque por área de serviço
`;
}

export function buildBudgetPrompt(project: ProjectInfo, files: FileInfo[]): BudgetPromptResult {
  const stageList = buildStageList();
  const catalog = buildCompositionCatalog();
  const isPopular = project.padraoEmpreendimento === 'POPULAR';

  // === SYSTEM PROMPT (stable content, high priority) ===
  const systemParts: string[] = [];

  systemParts.push(`Você é um engenheiro orçamentista sênior com 20+ anos de experiência em construção civil brasileira.
Sua especialidade é estimar quantitativos precisos a partir de projetos arquitetônicos e gerar orçamentos detalhados.
Você SEMPRE calcula áreas de paredes usando perímetro × pé-direito, NUNCA confunde área de piso com área de parede.`);

  // Popular rules FIRST (before catalog) — highest priority
  if (isPopular) {
    systemParts.push(buildPopularRules());
    systemParts.push(buildCompositionGuide('POPULAR'));
  } else {
    systemParts.push(buildCompositionGuide(project.padraoEmpreendimento));
  }

  // Calculation framework
  systemParts.push(buildCalculationFramework(project.constructedArea));

  // Composition catalog
  systemParts.push(`## CATÁLOGO DE COMPOSIÇÕES SINAPI DISPONÍVEIS
Use PREFERENCIALMENTE as composições do catálogo abaixo. O código (ex: CF-01001, SINAPI-73964) deve ser referenciado exatamente.
Se nenhuma composição existente se encaixar, use code: null e descreva o serviço.
${catalog}`);

  // Stage list
  systemParts.push(`## 20 ETAPAS DA OBRA (00-19)
${stageList}`);

  const systemPrompt = systemParts.join('\n\n');

  // === USER PROMPT (per-request content) ===
  const userParts: string[] = [];

  userParts.push(`## DADOS DO PROJETO
- Nome: ${project.name}
- Tipo: ${project.tipoObra}
- Padrão: ${project.padraoEmpreendimento}
- Estado: ${project.enderecoEstado}
- Cidade: ${project.enderecoCidade}
${project.constructedArea ? `- Área construída: ${project.constructedArea} m²` : ''}`);

  userParts.push(`## ARQUIVOS ANEXADOS
${files.map((f) => `- ${f.fileName} (${f.category})`).join('\n')}`);

  userParts.push(`## INSTRUÇÕES DE ANÁLISE

1. **Analise cada PDF/imagem cuidadosamente**:
   - Plantas baixas: extraia áreas de cômodos, dimensões de paredes, portas, janelas
   - MEÇA o perímetro TOTAL de todas as paredes (externas + internas + muros)
   - Projeto estrutural: identifique fundações, pilares, vigas, lajes
   - Projeto elétrico: conte pontos de tomada, interruptores, circuitos
   - Projeto hidráulico: identifique pontos de água, esgoto, louças

2. **SIGA O FRAMEWORK DE CÁLCULO** definido no system prompt:
   - STEP 1: Extraia todas as variáveis
   - STEP 2: Calcule as variáveis derivadas
   - STEP 3: Faça a verificação de sanidade
   - STEP 4: Use o mapeamento variável → serviço

3. **Para cada etapa (00-19)**, liste os serviços necessários com:
   - Descrição clara do serviço
   - Código SINAPI/CF quando disponível no catálogo
   - Unidade de medida
   - Quantidade calculada a partir dos projetos (USANDO as variáveis do framework)
   - Preço unitário (use o baseCost do catálogo)
   - aiConfidence: valor de 0.0 a 1.0 indicando sua confiança real na estimativa
     → 0.9-1.0: dados extraídos diretamente do projeto com medidas claras
     → 0.7-0.8: dados calculados a partir de medidas parciais do projeto
     → 0.5-0.6: estimativa baseada em referências tipológicas
     → 0.3-0.4: chute educado por falta de dados
   - aiReasoning: explique QUAL variável usou e como calculou (ex: "P_interno(45m) × H_interno(2,85m) − vaos(18m²) = 110,25m²")

4. **Regras**:
   - NÃO invente composições com códigos fictícios. Use os códigos do catálogo ou null.
   - Quantidades devem ser baseadas nos projetos, não estimativas genéricas.
   - Arredonde quantidades para 2 casas decimais.
   - A etapa 00 (Terreno) geralmente fica vazia pois depende de informações financeiras.
${isPopular ? '   - SIGA RIGOROSAMENTE as regras populares e a tabela USAR/NÃO USAR do system prompt.' : ''}`);

  userParts.push(`## FORMATO DE SAÍDA
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
          "aiReasoning": "A_terreno = 10m × 25m = 250m² conforme planta de situação"
        }
      ]
    }
  ]
}`);

  const userPrompt = userParts.join('\n\n');

  return { systemPrompt, userPrompt };
}
