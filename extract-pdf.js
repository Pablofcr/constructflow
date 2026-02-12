const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const path = 'C:\\Users\\pablo\\OneDrive\\Área de Trabalho\\2026-1-Relatorio-5-composicao-cub-m2-valores-em-reais.pdf';
const data = new Uint8Array(fs.readFileSync(path));

async function extractText() {
  const doc = await pdfjsLib.getDocument({ data }).promise;
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str).join(' ');
    console.log(`=== PAGE ${i} ===`);
    console.log(text);
    console.log();
  }
}

extractText().catch(e => console.error(e.message));
