const http = require('http');

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = { hostname: u.hostname, port: u.port, path: u.pathname + u.search, method: options.method || 'GET', headers: options.headers || {} };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

const BUDGET_ID = '75b0da1a-6a58-4ec5-bc92-7b7ea875de7b';
const STAGE1_ID = '2f08c957-7b52-4ccc-8445-2c2395003b77';

async function main() {
  // 1. Buscar composição CF-09004 (porcelanato grande formato piso)
  const comps = await fetch('http://localhost:3000/api/compositions?state=CE&search=porcelanato%20grande%20formato');
  const pisoComp = comps.find(c => c.code === 'CF-09004');
  if (!pisoComp) { console.log('Composicao CF-09004 nao encontrada'); return; }
  console.log('1. Composicao:', pisoComp.code, '- R$', pisoComp.unitCost);

  // 2. Adicionar serviço ao orçamento (50m²)
  const service = await fetch(`http://localhost:3000/api/budget-real/${BUDGET_ID}/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stageId: STAGE1_ID,
      description: pisoComp.description,
      unit: pisoComp.unit,
      quantity: 50,
      unitPrice: Number(pisoComp.unitCost),
      compositionId: pisoComp.id,
      code: pisoComp.code,
    }),
  });
  console.log('2. Servico criado: R$', service.unitPrice, 'x 50 = R$', service.totalPrice);

  // 3. Buscar o orçamento para ver o total
  const budget1 = await fetch(`http://localhost:3000/api/budget-real/${BUDGET_ID}`);
  console.log('3. Orcamento ANTES: Total Direto R$', budget1.totalDirectCost, '| Total c/ BDI R$', budget1.totalWithBDI);

  // 4. Encontrar o item de porcelanato na composição (INS-00164)
  const porcelanatoItem = pisoComp.items.find(i => i.code === 'INS-00164');
  console.log('4. Insumo porcelanato:', porcelanatoItem.code, '- R$', porcelanatoItem.unitPrice, '/m²');

  // 5. Atualizar preço do porcelanato de R$115 para R$130
  console.log('5. Atualizando preco do porcelanato para R$ 130...');
  const cascadeResult = await fetch(`http://localhost:3000/api/price-tables/${porcelanatoItem.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unitPrice: 130 }),
  });
  console.log('   Cascata:', JSON.stringify(cascadeResult._cascade));

  // 6. Verificar orçamento DEPOIS
  const budget2 = await fetch(`http://localhost:3000/api/budget-real/${BUDGET_ID}`);
  console.log('6. Orcamento DEPOIS: Total Direto R$', budget2.totalDirectCost, '| Total c/ BDI R$', budget2.totalWithBDI);

  // 7. Verificar serviço atualizado
  const services = await fetch(`http://localhost:3000/api/budget-real/${BUDGET_ID}/services?stageId=${STAGE1_ID}`);
  const updatedService = services.find(s => s.code === 'CF-09004');
  console.log('7. Servico atualizado: R$', updatedService.unitPrice, 'x 50 = R$', updatedService.totalPrice);

  // 8. Restaurar preço original
  console.log('8. Restaurando preco original R$ 115...');
  await fetch(`http://localhost:3000/api/price-tables/${porcelanatoItem.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unitPrice: 115 }),
  });

  // 9. Deletar serviço de teste
  await fetch(`http://localhost:3000/api/budget-real/${BUDGET_ID}/services/${service.id}`, { method: 'DELETE' });
  console.log('9. Servico de teste removido');

  const budget3 = await fetch(`http://localhost:3000/api/budget-real/${BUDGET_ID}`);
  console.log('10. Orcamento final: Total Direto R$', budget3.totalDirectCost, '| Total c/ BDI R$', budget3.totalWithBDI);
}

main().catch(console.error);
