const XLSX = require('xlsx');

// Criar um workbook com dados fake de SINAPI
const ws_data = [
  ['Código', 'Descrição', 'Unidade', 'Preço Unitário', 'UF', 'Mês/Ano', 'Classe', 'Onerado'],
  ['001001', 'Concreto usinado fck 25', 'm³', '450.50', 'SP', '2026-04', 'Concreto', 'Sim'],
  ['001002', 'Aço CA-50', 'kg', '8.75', 'SP', '2026-04', 'Aço', 'Sim'],
  ['001003', 'Alvenaria de bloco cerâmico', 'm²', '125.00', 'RJ', '2026-04', 'Alvenaria', 'Não'],
];

const ws = XLSX.utils.aoa_to_sheet(ws_data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "SINAPI");
XLSX.writeFile(wb, 'sinapi-teste.xlsx');

console.log('✓ sinapi-teste.xlsx criado');
