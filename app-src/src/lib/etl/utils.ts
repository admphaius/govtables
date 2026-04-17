import Decimal from "decimal.js";

// ----------------------------------------------------------------
// Utilitários compartilhados do pipeline ETL
// ----------------------------------------------------------------

/**
 * Normaliza cabeçalhos de colunas para comparação tolerante:
 * remove acentos, converte para maiúsculo, colapsa espaços.
 */
export function normalizeHeader(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Encontra o índice da primeira linha que contém os headers esperados.
 * Retorna -1 se não encontrar dentro das primeiras `maxRows` linhas.
 */
export function findHeaderRow(
  rows: unknown[][],
  markers: string[],
  maxRows = 20
): number {
  const normalizedMarkers = markers.map(normalizeHeader);
  for (let i = 0; i < Math.min(rows.length, maxRows); i++) {
    const cells = rows[i].map((c) => normalizeHeader(String(c ?? "")));
    const matched = normalizedMarkers.filter((m) =>
      cells.some((c) => c.includes(m))
    );
    if (matched.length >= Math.ceil(normalizedMarkers.length * 0.6)) {
      return i;
    }
  }
  return -1;
}

/**
 * Mapeia os headers normalizados para índices de coluna.
 */
export function buildColMap(
  headerRow: unknown[],
  mapping: Record<string, string[]>
): Record<string, number> {
  const result: Record<string, number> = {};
  const normalized = headerRow.map((c) => normalizeHeader(String(c ?? "")));

  for (const [field, candidates] of Object.entries(mapping)) {
    const normalizedCandidates = candidates.map(normalizeHeader);
    for (let i = 0; i < normalized.length; i++) {
      if (normalizedCandidates.some((c) => normalized[i].includes(c))) {
        result[field] = i;
        break;
      }
    }
  }
  return result;
}

/**
 * Extrai o valor de uma célula como string limpa, ou null.
 */
export function cellStr(
  row: unknown[],
  idx: number | undefined
): string | null {
  if (idx === undefined || idx < 0 || idx >= row.length) return null;
  const v = row[idx];
  if (v === null || v === undefined || v === "") return null;
  return String(v).trim();
}

/**
 * Converte valor de célula para string Decimal válida.
 * Aceita formatos BR (1.234,56) e EN (1234.56).
 * Retorna null se inválido ou zero-negativo.
 */
export function parsePreco(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const s = String(raw).trim().replace(/\s/g, "");
  if (!s) return null;

  // Remove símbolo de moeda
  const cleaned = s.replace(/^R\$\s*/, "");

  // Formato BR: separador de milhar = ".", decimal = ","
  const brFormat = /^-?\d{1,3}(\.\d{3})*(,\d+)?$/;
  // Formato EN: separador de milhar = ",", decimal = "."
  const enFormat = /^-?\d{1,3}(,\d{3})*(\.\d+)?$/;
  // Simples (sem separador de milhar)
  const simpleFormat = /^-?\d+([.,]\d+)?$/;

  let normalized: string;
  if (brFormat.test(cleaned)) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (enFormat.test(cleaned)) {
    normalized = cleaned.replace(/,/g, "");
  } else if (simpleFormat.test(cleaned)) {
    normalized = cleaned.replace(",", ".");
  } else {
    return null;
  }

  try {
    const d = new Decimal(normalized);
    if (d.isNaN() || !d.isFinite() || d.lt(0)) return null;
    return d.toFixed(4);
  } catch {
    return null;
  }
}

/**
 * Converte "MM/YYYY" ou "YYYY-MM" ou Date para "YYYY-MM-01".
 */
export function parseMesReferencia(raw: string | Date | null): string | null {
  if (!raw) return null;

  if (raw instanceof Date) {
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}-01`;
  }

  const s = String(raw).trim();

  // YYYY-MM-DD (já no formato correto)
  const iso = s.match(/^(\d{4})-(\d{2})-\d{2}$/);
  if (iso) return `${iso[1]}-${iso[2]}-01`;

  // YYYY-MM
  const ym = s.match(/^(\d{4})-(\d{2})$/);
  if (ym) return `${ym[1]}-${ym[2]}-01`;

  // MM/YYYY
  const mmyyyy = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmyyyy) return `${mmyyyy[2]}-${mmyyyy[1].padStart(2, "0")}-01`;

  // YYYY (assume janeiro)
  const yyyy = s.match(/^(\d{4})$/);
  if (yyyy) return `${yyyy[1]}-01-01`;

  return null;
}

const MESES: Record<string, string> = {
  JANEIRO: "01", FEVEREIRO: "02", MARCO: "03", ABRIL: "04",
  MAIO: "05", JUNHO: "06", JULHO: "07", AGOSTO: "08",
  SETEMBRO: "09", OUTUBRO: "10", NOVEMBRO: "11", DEZEMBRO: "12",
  MARCH: "03", APRIL: "04", MAY: "05", JUNE: "06",
  JULY: "07", AUGUST: "08", OCTOBER: "10", NOVEMBER: "11", DECEMBER: "12",
};

/**
 * Tenta extrair mês de referência do nome de arquivo.
 * Ex: "SINAPI_RJ_022025.xlsx" → "2025-02-01"
 */
export function mesFromFilename(filename: string): string | null {
  const base = filename.toUpperCase().replace(/\.[^.]+$/, "");

  // Padrão: MMYYYY ou MM_YYYY ou MM-YYYY
  const mmyyyy = base.match(/(\d{2})[_\-]?(\d{4})/);
  if (mmyyyy) {
    const m = parseInt(mmyyyy[1], 10);
    const y = parseInt(mmyyyy[2], 10);
    if (m >= 1 && m <= 12 && y >= 2000 && y <= 2100) {
      return `${y}-${String(m).padStart(2, "0")}-01`;
    }
  }

  // Padrão: YYYYMM
  const yyyymm = base.match(/(\d{4})(\d{2})(?!\d)/);
  if (yyyymm) {
    const y = parseInt(yyyymm[1], 10);
    const m = parseInt(yyyymm[2], 10);
    if (m >= 1 && m <= 12 && y >= 2000 && y <= 2100) {
      return `${y}-${String(m).padStart(2, "0")}-01`;
    }
  }

  // Padrão: nome do mês
  for (const [nome, num] of Object.entries(MESES)) {
    if (base.includes(nome)) {
      const yearMatch = base.match(/(\d{4})/);
      if (yearMatch) return `${yearMatch[1]}-${num}-01`;
    }
  }

  return null;
}

/**
 * Tenta extrair UF do nome de arquivo.
 * Ex: "SINAPI_Preco_Ref_RJ_012025.xlsx" → "RJ"
 */
export function ufFromFilename(filename: string): string | null {
  const UFS = [
    "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
    "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
    "RS","RO","RR","SC","SP","SE","TO",
  ];
  const base = filename.toUpperCase().replace(/\.[^.]+$/, "");
  // Procura UF cercada de não-letras
  for (const uf of UFS) {
    const regex = new RegExp(`(?<![A-Z])${uf}(?![A-Z])`);
    if (regex.test(base)) return uf;
  }
  return null;
}

/**
 * Detecta se o arquivo SINAPI é "desonerado" a partir do nome.
 * NaoDesonerado / NAO_DESONERADO = is_onerado = TRUE
 * Desonerado (sem "Nao") = is_onerado = FALSE
 */
export function isOneradoFromFilename(filename: string): boolean {
  const upper = filename.toUpperCase();
  if (upper.includes("NAODESONERADO") || upper.includes("NAO_DESONERADO") ||
      upper.includes("NAODESON") || upper.includes("SEMDES")) {
    return true;
  }
  if (upper.includes("DESONERADO") || upper.includes("DESON")) {
    return false;
  }
  return true; // default: com encargos (onerado)
}
