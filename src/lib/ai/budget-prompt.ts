import { SINAPI_COMPOSITIONS, SinapiCompositionData } from '@/lib/sinapi-data';
import { DEFAULT_STAGES } from '@/lib/seed-etapas';
import type { ExtractedVariables, DerivedValues } from './types';

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

**Áreas:**
- A_construida = área construída total (m²) ${constructedArea ? `[informado: ${areaRef}m²]` : '[extrair do projeto]'}
- A_terreno = área do terreno (m²)

**Perímetros (MÉTODO H/V OBRIGATÓRIO):**

Use o MÉTODO H/V para mapear TODAS as paredes de forma sistemática:

**HORIZONTAIS (H):** Paredes paralelas à frente da obra (frente → fundos)
- H0 = muro frontal ou primeira parede frontal (m)
- H1 = próxima parede paralela seguindo em direção ao fundo (m)
- H2, H3, H4... = paredes seguintes na sequência (m)
- H_última = muro de fundos ou última parede (m)

**VERTICAIS (V):** Paredes perpendiculares à frente da obra (esquerda → direita)
- V0 = muro esquerdo ou parede lateral esquerda (m)
- V1 = próxima parede perpendicular seguindo para a direita (m)
- V2, V3, V4... = paredes seguintes na sequência (m)
- V_última = muro direito ou parede lateral direita (m)

**REGRAS:**
- SEMPRE começar de H0 (nunca pular números: H0, H1, H3 ← ERRADO!)
- SEMPRE começar de V0 (nunca pular números: V0, V1, V3 ← ERRADO!)
- Especificar se é muro, parede externa ou parede interna para cada uma
- Se muro coincide com parede externa: especificar "H0 = 5,40m (muro/parede externa)"

**CÁLCULO FINAL:**
- P_horizontal = H0 + H1 + H2 + ... + H_última (m)
- P_vertical = V0 + V1 + V2 + ... + V_última (m)
- P_total = P_horizontal + P_vertical (m)

**Alturas (ATENÇÃO — CORRIGIDAS):**
- H_interno = 2,85m — altura para alvenaria e revestimentos INTERNOS
- H_externo = 3,47m — altura COMPLETA da fachada externa (2,85m + 0,12m laje + 0,50m platibanda)
- H_muro = 2,50m (quando não especificado no projeto)
- IMPORTANTE: NÃO confunda H_interno com H_externo! Use 2,85m para cálculos internos e 3,47m para fachada externa.

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

**PRIMEIRO: Classificar paredes do MÉTODO H/V**
- P_interno = soma das paredes H/V marcadas como (int)
- P_externo = soma das paredes H/V marcadas como (ext)
- P_muro = soma das paredes H/V marcadas como (muro)

Exemplo:
H0=5,40m(muro) + H1=5,40m(ext) + H2=5,40m(int) + V0=11,10m(ext/muro) + V1=2,50m(int)
→ P_muro = H0 = 5,40m
→ P_externo = H1 + V0 = 5,40 + 11,10 = 16,50m
→ P_interno = H2 + V1 = 5,40 + 2,50 = 7,90m

**DEPOIS: Calcular áreas de paredes**
- A_paredes_internas = P_interno × H_interno(2,85m) − A_vaos_portas_internas (m²)
- A_paredes_externas = P_externo × H_externo(3,47m) − A_vaos_janelas − A_vaos_portas_externas (m²)
- A_paredes_muros = P_muro × H_muro(2,50m) − A_vaos_portoes (m²)
  → Se não houver muros: P_muro = 0m, A_paredes_muros = 0m²
- A_paredes_total = A_paredes_internas + A_paredes_externas + A_paredes_muros (m²)
- A_cobertura = A_construida × 1,15 (m²) — acréscimo de 15% para beirais
- V_escavacao = P_total × 0,40 × 0,50 (m³) — para fundação popular

**VALIDAÇÃO OBRIGATÓRIA do MÉTODO H/V:**
✓ Listou TODAS as horizontais sequencialmente: H0, H1, H2, ... (sem pular números!)
✓ Listou TODAS as verticais sequencialmente: V0, V1, V2, ... (sem pular números!)
✓ Especificou tipo de cada parede (muro/externa/interna)
✓ Calculou P_horizontal = H0 + H1 + ... = X m (soma explícita)
✓ Calculou P_vertical = V0 + V1 + ... = Y m (soma explícita)
✓ Calculou P_total = P_horizontal + P_vertical = Z m
✓ Classificou P_externo, P_interno e P_muro a partir das paredes H/V

**EXEMPLO COMPLETO DE EXTRAÇÃO USANDO MÉTODO H/V (use como modelo):**

CORRETO ✅:
=== MÉTODO H/V ===
HORIZONTAIS (frente → fundos):
H0 = 5,40m (muro frontal)
H1 = 5,40m (parede externa frontal da casa)
H2 = 5,40m (parede interna entre sala e quartos)
H3 = 5,40m (parede interna divisória banheiro)
H4 = 5,40m (parede externa fundos)
H5 = 5,40m (muro fundos)
P_horizontal = H0 + H1 + H2 + H3 + H4 + H5 = 32,40m

VERTICAIS (esquerda → direita):
V0 = 11,10m (muro esquerdo / parede lateral esquerda)
V1 = 2,50m (parede interna divisória quarto 1)
V2 = 3,20m (parede interna divisória sala/cozinha)
V3 = 2,80m (parede interna divisória banheiro/lavanderia)
V4 = 11,10m (parede lateral direita / muro direito)
P_vertical = V0 + V1 + V2 + V3 + V4 = 30,70m

P_total = P_horizontal + P_vertical = 32,40m + 30,70m = 63,10m

=== CLASSIFICAÇÃO ===
P_externo = H1 + H4 + V0 + V4 = 5,40 + 5,40 + 11,10 + 11,10 = 33,00m
P_interno = H2 + H3 + V1 + V2 + V3 = 5,40 + 5,40 + 2,50 + 3,20 + 2,80 = 19,30m
P_muro = H0 + H5 = 5,40 + 5,40 = 10,80m

=== ÁREAS DERIVADAS ===
A_paredes_internas = P_interno(19,30m) × H_interno(2,85m) - A_vaos_portas_internas(8,40m²) = 46,61m²
A_paredes_externas = P_externo(33,00m) × H_externo(3,47m) - A_vaos_janelas_portas_externas(6,20m²) = 108,31m²
A_paredes_muros = P_muro(10,80m) × H_muro(2,50m) - A_vaos_portoes(0m²) = 27,00m²
A_paredes_total = 46,61 + 108,31 + 27,00 = 181,92m²

ERRADO ❌:
P_interno = 19,30m (sem mostrar H2, H3, V1, V2, V3)
P_externo = 33,00m (sem mostrar H1, H4, V0, V4)
P_total = 63,10m (sem mostrar P_horizontal + P_vertical)

### STEP 3: Verificação de sanidade
ANTES de prosseguir, verifique:
- A_paredes_total deve ser aproximadamente 3,5 a 4,5 × A_construida
  → Para casa 60m²: paredes totais devem estar entre 210m² e 270m²
  → Se A_paredes_total < 2,5 × A_construida, REVISE o perímetro — provavelmente está faltando paredes internas ou muros
- Chapisco/emboço interno NUNCA pode ser menor que A_construida × 2
- Chapisco/reboco externo NUNCA pode ser menor que A_construida × 1,5
- P_total = P_externo + P_interno + P_muro — verifique que todos os 3 valores foram informados (mesmo que P_muro = 0)
- Para POPULAR: verifique que TODO concreto de superestrutura é FCK 30MPa (não 20MPa nem 25MPa)
- H_externo = 3,47m (não 2,97m) — verifique que usou o valor correto para fachada externa

### STEP 4: Mapeamento variável → serviço
Use as variáveis calculadas (MÉTODO H/V) para preencher as quantidades de cada serviço:
| Serviço | Quantidade = |
|---------|-------------|
| Limpeza terreno | A_terreno |
| Locação obra | perímetro externo + 8m |
| Escavação valas | V_escavacao = P_total × 0,40 × 0,50 |
| Alvenaria de pedra (popular) | P_total × 0,40 × 0,30 |
| Baldrame tijolo (popular) | P_total (metros lineares) |
| Laje treliçada (popular) | A_construida |
| Alvenaria paredes | A_paredes_total − A_vaos_total |
| Vergas | N_portas + N_janelas, comprimento = (largura + 0,60m) cada |
| Chapisco interno | A_paredes_internas (usar P_interno classificado do H/V) |
| Emboço interno | A_paredes_internas |
| Chapisco externo | A_paredes_externas + A_paredes_muros (usar P_externo e P_muro do H/V) |
| Reboco externo | A_paredes_externas + A_paredes_muros |
| Cerâmico parede | A_cozinha_paredes + A_banheiros_paredes |
| Forro/reboco teto | A_construida |
| Contrapiso | A_construida |
| Piso cerâmico | A_construida |
| Pintura interna (massa+PVA) | A_paredes_internas |
| Pintura externa (selador+textura) | A_paredes_externas + A_paredes_muros |
| Cobertura | A_cobertura |
| Aço vigas | P_total × 4 barras ferro φ10,0mm + estribos aço φ4,3mm @ 15cm |
IMPORTANTE: Use SEMPRE a classificação do MÉTODO H/V para separar P_interno, P_externo e P_muro
`;
}

function buildCompositionGuide(padraoEmpreendimento: string): string {
  const isPopularOuBaixo = ['POPULAR', 'BAIXO_PADRAO'].includes(padraoEmpreendimento);
  if (!isPopularOuBaixo) {
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
- **CONCRETO SUPERESTRUTURA**: usar EXCLUSIVAMENTE FCK 30MPa para laje e vigas

⚠️ ATENÇÃO MÁXIMA: O CONCRETO PARA POPULAR É FCK 30MPa!
❌ NUNCA USE: "Concreto FCK 20MPa"
❌ NUNCA USE: "Concreto FCK 25MPa"
✅ SEMPRE USE: "Concreto usinado FCK 30MPa" (código CF-03004)
Se você escreveu "FCK 20MPa" ou "FCK 25MPa" no aiReasoning, APAGUE e corrija para FCK 30MPa
Se você está usando código diferente de CF-03004, CORRIJA para CF-03004

### ALTURAS (ATENÇÃO — VALORES CORRIGIDOS):
- H_interno = 2,85m — usar para alvenaria, revestimentos internos, pinturas internas
- H_externo = 3,47m — usar para fachada externa (2,85m + 0,12m laje + 0,50m platibanda)
- H_muro = 2,50m (quando não especificado no projeto)
⚠️ NUNCA use H_externo = 2,97m — esse valor está ERRADO!
⚠️ Fachada externa = P_externo × 3,47m (não 2,97m)

### PERÍMETROS (MÉTODO H/V OBRIGATÓRIO):
- Use EXCLUSIVAMENTE o MÉTODO H/V para mapear paredes
- HORIZONTAIS: Liste todas de H0 a H_última (frente → fundos)
  → H0 = primeira parede/muro frontal
  → H1, H2, H3... = paredes seguintes
  → H_última = última parede/muro fundos
- VERTICAIS: Liste todas de V0 a V_última (esquerda → direita)
  → V0 = primeira parede/muro lateral esquerdo
  → V1, V2, V3... = paredes seguintes
  → V_última = última parede/muro lateral direito
- NUNCA pule números na sequência (H0, H1, H3 ← ERRO!)
- SEMPRE mostre somas: P_horizontal = H0 + H1 + ... = X m
- SEMPRE classifique: qual parede é muro, externa ou interna
- P_total = P_horizontal + P_vertical (não mais P_ext + P_int + P_muro)

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
  ⚠️ ATENÇÃO: OBRIGATORIAMENTE FCK 30MPa (não 20MPa, não 25MPa)
- Tela Q138 (CF-03003): Área = área construída × 1,15
- Vigas concreto FCK 30MPa (CF-03004): Volume = P_total × 0,15 × 0,15
  ⚠️ ATENÇÃO: OBRIGATORIAMENTE FCK 30MPa (não 20MPa, não 25MPa)
- Aço vigas (CF-03005): P_total × 4 barras de ferro φ10,0mm + estribos aço φ4,3mm a cada 15cm

### 04 - Alvenaria
- Alvenaria (SINAPI-87522): (P_interno + P_externo) × H_interno(2,85m) − A_vaos_total
- Vergas (SINAPI-87529): para CADA porta E janela, comprimento = largura da porta/janela + 0,60m
- Contravergas (SINAPI-87530): para cada janela, 2 unidades de 60cm

### 05 - Cobertura
- Estrutura + telhas: Área = Área construída × 1,15 (acréscimo de 15% para beirais)

### 06 - Impermeabilização
- Fundação (SINAPI-98557): Área = P_total × 0,90m
- Banheiro (SINAPI-98556): Área do piso + área das paredes do banheiro até altura de 50cm

### 08 - Revestimentos (ATENÇÃO: quantidades são MAIORES que a área construída!)
- Chapisco INTERNO (SINAPI-87878): P_interno × H_interno(2,85m) − A_vaos_portas_internas
  → Referência casa 60m²: ~222m²
- Emboço INTERNO (SINAPI-87879): mesma área do chapisco interno
- Chapisco EXTERNO (SINAPI-87884): P_externo × H_externo(3,47m) + A_paredes_muros − A_vaos_janelas − A_vaos_portoes
  → Referência casa 60m²: ~235m² (usando H_externo = 3,47m)
- Reboco EXTERNO (SINAPI-87881): mesma área do chapisco externo
- Cerâmico parede (SINAPI-87882): cozinha + banheiros (referência: ~59m² para casa 60m²)

### 09 - Fôrros
- Usar REBOCO DE TETO (CF-09001) — NÃO usar gesso nem PVC
- Área = área construída

### 11 - Pintura
- Interna: Emassamento (SINAPI-88495) + PVA (SINAPI-88489) = P_interno × H_interno(2,85m) − A_vaos_portas_internas
- EXTERNA popular: Selador (CF-11001) + Textura (CF-11003) — NÃO usar pintura acrílica (SINAPI-88491)
- Área externa = P_externo × H_externo(3,47m) + A_paredes_muros − A_vaos_janelas − A_vaos_portoes

### 12 - Louças e Metais
- Por banheiro: 1 bacia + 1 lavatório + 1 chuveiro COMUM (não elétrico — apenas infraestrutura)
- 1 tanque por área de serviço
`;
}

export function buildBudgetPrompt(project: ProjectInfo, files: FileInfo[]): BudgetPromptResult {
  const stageList = buildStageList();
  const catalog = buildCompositionCatalog();
  const isPopularOuBaixo = ['POPULAR', 'BAIXO_PADRAO'].includes(project.padraoEmpreendimento);

  // === SYSTEM PROMPT (stable content, high priority) ===
  const systemParts: string[] = [];

  systemParts.push(`Você é um engenheiro orçamentista sênior com 20+ anos de experiência em construção civil brasileira.
Sua especialidade é estimar quantitativos precisos a partir de projetos arquitetônicos e gerar orçamentos detalhados.
Você SEMPRE calcula áreas de paredes usando perímetro × pé-direito, NUNCA confunde área de piso com área de parede.`);

  // Popular rules FIRST (before catalog) — highest priority
  if (isPopularOuBaixo) {
    systemParts.push(buildPopularRules());
    systemParts.push(buildCompositionGuide(project.padraoEmpreendimento));
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
${isPopularOuBaixo ? '   - SIGA RIGOROSAMENTE as regras populares e a tabela USAR/NÃO USAR do system prompt.' : ''}

### VALIDAÇÃO FINAL antes de retornar o JSON:
${isPopularOuBaixo ? '✓ Verifique que TODO concreto de superestrutura é FCK 30MPa (não 20MPa nem 25MPa)\n' : ''}✓ Verifique que mostrou P_interno = parede_1 + parede_2 + ... = total (soma explícita)
✓ Verifique que informou P_muro (mesmo que seja 0m)
✓ Verifique que usou H_interno = 2,85m para cálculos internos
${isPopularOuBaixo ? '✓ Verifique que usou H_externo = 3,47m para fachada externa (NÃO 2,97m)\n' : ''}✓ Verifique que chapisco interno ≥ A_construida × 2
✓ Verifique que chapisco externo ≥ A_construida × 1,5

### EXEMPLOS DE aiReasoning CORRETO vs INCORRETO

**Exemplo 1: Perímetros (MÉTODO H/V)**
❌ ERRADO: "P_interno = 45,00m" ou "P_total = 78,10m"
✅ CORRETO: "HORIZONTAIS: H0=5,40m(muro) + H1=5,40m(ext) + H2=5,40m(int) + H3=5,40m(int) + H4=5,40m(ext) + H5=5,40m(muro) = 32,40m
VERTICAIS: V0=11,10m(ext/muro) + V1=2,50m(int) + V2=3,20m(int) + V3=2,80m(int) + V4=11,10m(ext/muro) = 30,70m
P_total = P_horizontal(32,40m) + P_vertical(30,70m) = 63,10m
P_interno = H2 + H3 + V1 + V2 + V3 = 5,40 + 5,40 + 2,50 + 3,20 + 2,80 = 19,30m"

**Exemplo 2: Sequência Incompleta**
❌ ERRADO: "H0, H1, H3, H4" (pulou H2!)
✅ CORRETO: "H0, H1, H2, H3, H4" (sequência completa sem pulos)

**Exemplo 3: Chapisco interno**
❌ ERRADO: "P_interno(45m) × H(2,97m) - vaos(8,40m²) = 125,25m²"
✅ CORRETO: "P_interno(45m) × H_interno(2,85m) - A_vaos_portas_internas(8,40m²) = 120,15m²"

**Exemplo 4: Chapisco externo (POPULAR)**
❌ ERRADO: "P_externo(33,10m) × H(2,97m) - vaos(4,80m²) = 93,51m²"
✅ CORRETO: "P_externo(33,10m) × H_externo(3,47m) - A_vaos_janelas(4,80m²) = 109,96m²"

**Exemplo 5: Concreto (POPULAR)**
❌ ERRADO: "Volume laje = A_construida(60m²) × 0,08m = 4,80m³" + descrição "Concreto FCK 20MPa"
✅ CORRETO: "Volume laje = A_construida(60m²) × 0,08m = 4,80m³" + descrição "Concreto usinado FCK 30MPa" + código "CF-03004"`);

  userParts.push(`## CHECKLIST FINAL OBRIGATÓRIO

ANTES de retornar o JSON, você DEVE revisar TODO o orçamento e corrigir os seguintes erros se encontrá-los:

${isPopularOuBaixo ? `🔍 VERIFICAR: Busque no JSON inteiro por "FCK 20" ou "FCK 25"
→ Se encontrar: APAGUE e reescreva como "FCK 30MPa"
→ Código obrigatório: CF-03004

` : ''}🔍 VERIFICAR: Busque por perímetros SEM usar MÉTODO H/V
→ Se encontrar "P_interno = 45,00m" ou "P_externo = 33,00m" sem H0, H1, V0, V1:
→ REESCREVA usando MÉTODO H/V completo:
  • Liste TODAS as horizontais: H0, H1, H2, ... (sem pular números!)
  • Liste TODAS as verticais: V0, V1, V2, ... (sem pular números!)
  • Especifique tipo: (muro), (ext), (int) para cada parede
  • Calcule P_horizontal = H0 + H1 + ... = X m
  • Calcule P_vertical = V0 + V1 + ... = Y m
  • Calcule P_total = P_horizontal + P_vertical = Z m

🔍 VERIFICAR: Busque por sequências incompletas (H0, H1, H3... falta H2!)
→ Se encontrar pulo na numeração:
→ CORRIJA listando TODAS as paredes sequencialmente

${isPopularOuBaixo ? `🔍 VERIFICAR: Busque por "× H" ou "× 2,97" em cálculos de parede
→ Se for parede INTERNA e usar 2,97m ou 3,47m: CORRIJA para H_interno(2,85m)
→ Se for parede EXTERNA e usar 2,85m ou 2,97m: CORRIJA para H_externo(3,47m)

` : ''}🔍 VERIFICAR: Confira que chapisco interno ≥ A_construida × 2
→ Para casa 60m²: chapisco interno deve ser ≥ 120m²
→ Se for menor: REVISE o cálculo (provavelmente usou altura errada)

🔍 VERIFICAR: Confira que chapisco externo ≥ A_construida × 1,5
→ Para casa 60m²: chapisco externo deve ser ≥ 90m²
→ Se for menor: REVISE o cálculo (provavelmente faltou muros ou usou altura errada)

⚠️ SE VOCÊ ENCONTROU E CORRIGIU ALGUM ERRO ACIMA, REFAÇA TODO O JSON COM OS VALORES CORRIGIDOS.`);

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FASE 2: Prompt com variáveis confirmadas pelo engenheiro
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function formatConfirmedVariables(vars: ExtractedVariables): string {
  const d = vars.derived as DerivedValues;
  const lines: string[] = [];

  lines.push(`## ⚠️ VARIÁVEIS CONFIRMADAS PELO ENGENHEIRO — USE ESTES VALORES`);
  lines.push(`**NÃO re-leia os PDFs para obter medidas. Use EXCLUSIVAMENTE os valores abaixo.**\n`);

  lines.push(`### ÁREAS`);
  lines.push(`- Área construída = ${vars.areaConstruida} m²`);
  lines.push(`- Área terreno = ${vars.areaTerreno} m²\n`);

  lines.push(`### ALTURAS`);
  lines.push(`- H_interno = ${vars.heights.hInterno}m`);
  lines.push(`- H_externo = ${vars.heights.hExterno}m`);
  lines.push(`- H_muro = ${vars.heights.hMuro}m\n`);

  lines.push(`### PAREDES (MÉTODO H/V — CONFIRMADO)`);
  lines.push(`HORIZONTAIS:`);
  const hWalls = vars.walls.filter((w) => w.direction === 'H');
  for (const w of hWalls) {
    lines.push(`- ${w.id} = ${w.length}m (${w.classification}) — ${w.description}`);
  }
  lines.push(`P_horizontal = ${hWalls.map((w) => w.length).join(' + ')} = ${d.pHorizontal}m\n`);

  lines.push(`VERTICAIS:`);
  const vWalls = vars.walls.filter((w) => w.direction === 'V');
  for (const w of vWalls) {
    lines.push(`- ${w.id} = ${w.length}m (${w.classification}) — ${w.description}`);
  }
  lines.push(`P_vertical = ${vWalls.map((w) => w.length).join(' + ')} = ${d.pVertical}m\n`);

  lines.push(`P_total = ${d.pHorizontal} + ${d.pVertical} = ${d.pTotal}m`);
  lines.push(`P_externo = ${d.pExterno}m`);
  lines.push(`P_interno = ${d.pInterno}m`);
  lines.push(`P_muro = ${d.pMuro}m\n`);

  lines.push(`### ABERTURAS`);
  for (const o of vars.openings) {
    lines.push(`- ${o.quantity}× ${o.type} ${o.width}×${o.height}m (${o.location}) — ${o.description}`);
  }
  lines.push(`A_vaos_portas_int = ${d.aVaosPortasInt}m²`);
  lines.push(`A_vaos_portas_ext = ${d.aVaosPortasExt}m²`);
  lines.push(`A_vaos_janelas = ${d.aVaosJanelas}m²`);
  lines.push(`A_vaos_portoes = ${d.aVaosPortoes}m²`);
  lines.push(`A_vaos_total = ${d.aVaosTotal}m²\n`);

  lines.push(`### ÁREAS DE PAREDES (DERIVADAS)`);
  lines.push(`- A_paredes_internas = P_interno(${d.pInterno}m) × H_interno(${vars.heights.hInterno}m) − vaos_int(${d.aVaosPortasInt}m²) = ${d.aParedesInternas}m²`);
  lines.push(`- A_paredes_externas = P_externo(${d.pExterno}m) × H_externo(${vars.heights.hExterno}m) − vaos_ext(${d.aVaosPortasExt + d.aVaosJanelas}m²) = ${d.aParedesExternas}m²`);
  lines.push(`- A_paredes_muros = P_muro(${d.pMuro}m) × H_muro(${vars.heights.hMuro}m) − vaos_portoes(${d.aVaosPortoes}m²) = ${d.aParedesMuros}m²`);
  lines.push(`- A_paredes_total = ${d.aParedesTotal}m²\n`);

  lines.push(`### AMBIENTES`);
  for (const r of vars.rooms) {
    lines.push(`- ${r.name}: ${r.area}m² (${r.type})`);
  }

  lines.push(`\n### OUTROS VALORES DERIVADOS`);
  lines.push(`- A_cobertura = ${d.aCobertura}m²`);
  lines.push(`- V_escavação = ${d.vEscavacao}m³`);

  return lines.join('\n');
}

export function buildBudgetPromptWithVariables(
  project: ProjectInfo,
  files: FileInfo[],
  confirmedVars: ExtractedVariables
): BudgetPromptResult {
  const stageList = buildStageList();
  const catalog = buildCompositionCatalog();
  const isPopularOuBaixo = ['POPULAR', 'BAIXO_PADRAO'].includes(project.padraoEmpreendimento);

  // === SYSTEM PROMPT ===
  const systemParts: string[] = [];

  systemParts.push(`Você é um engenheiro orçamentista sênior com 20+ anos de experiência em construção civil brasileira.
As variáveis do projeto (paredes, áreas, aberturas) já foram extraídas e CONFIRMADAS pelo engenheiro.
Use EXCLUSIVAMENTE os valores confirmados fornecidos. NÃO re-leia os PDFs para obter medidas.
Sua tarefa é APENAS gerar o orçamento usando as variáveis pré-confirmadas.`);

  // Confirmed variables section (highest priority)
  systemParts.push(formatConfirmedVariables(confirmedVars));

  // Popular rules
  if (isPopularOuBaixo) {
    systemParts.push(buildPopularRules());
    systemParts.push(buildCompositionGuide(project.padraoEmpreendimento));
  } else {
    systemParts.push(buildCompositionGuide(project.padraoEmpreendimento));
  }

  // Composition catalog
  systemParts.push(`## CATÁLOGO DE COMPOSIÇÕES SINAPI DISPONÍVEIS
Use PREFERENCIALMENTE as composições do catálogo abaixo. O código (ex: CF-01001, SINAPI-73964) deve ser referenciado exatamente.
Se nenhuma composição existente se encaixar, use code: null e descreva o serviço.
${catalog}`);

  // Stage list
  systemParts.push(`## 20 ETAPAS DA OBRA (00-19)
${stageList}`);

  const systemPrompt = systemParts.join('\n\n');

  // === USER PROMPT ===
  const userParts: string[] = [];

  userParts.push(`## DADOS DO PROJETO
- Nome: ${project.name}
- Tipo: ${project.tipoObra}
- Padrão: ${project.padraoEmpreendimento}
- Estado: ${project.enderecoEstado}
- Cidade: ${project.enderecoCidade}
- Área construída: ${confirmedVars.areaConstruida} m²`);

  userParts.push(`## ARQUIVOS ANEXADOS (para referência visual apenas — NÃO re-leia medidas)
${files.map((f) => `- ${f.fileName} (${f.category})`).join('\n')}`);

  userParts.push(`## INSTRUÇÕES

As variáveis do projeto (paredes H/V, alturas, aberturas, ambientes) já estão no system prompt.
Use-as DIRETAMENTE para calcular quantidades. NÃO extraia medidas dos PDFs novamente.

Para cada etapa (00-19), liste os serviços necessários com:
- Descrição clara do serviço
- Código SINAPI/CF quando disponível no catálogo
- Unidade de medida
- Quantidade calculada a partir das variáveis confirmadas
- Preço unitário (use o baseCost do catálogo)
- aiConfidence: valor de 0.9 a 1.0 (variáveis já confirmadas pelo engenheiro)
- aiReasoning: explique QUAL variável usou e como calculou

${isPopularOuBaixo ? 'SIGA RIGOROSAMENTE as regras populares e a tabela USAR/NÃO USAR.\n' : ''}`);

  userParts.push(`## FORMATO DE SAÍDA
Responda APENAS com o JSON abaixo, sem markdown, sem explicações:

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
          "aiConfidence": 0.95,
          "aiReasoning": "A_terreno confirmado = 250m²"
        }
      ]
    }
  ]
}`);

  const userPrompt = userParts.join('\n\n');

  return { systemPrompt, userPrompt };
}
