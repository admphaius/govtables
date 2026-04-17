import * as XLSX from "xlsx";
import {
  buildColMap,
  cellStr,
  findHeaderRow,
  mesFromFilename,
  normalizeHeader,
  parsePreco,
  ufFromFilename,
} from "./utils";
import type { EtlResult, EtlRowError, SicroParseOptions, SicroRow } from "./types";

// ----------------------------------------------------------------
// Mapeamento de colunas SICRO (DNIT)
// ----------------------------------------------------------------
const COL_MAPPING = {
  codigo:    ["CODIGO", "COD", "CODIGO_DO_SERVICO", "ITEM"],
  descricao: ["DESCRICAO", "DESCRICAO_DO_SERVICO", "DENOMINACAO", "TITULO", "DESC"],
  unidade:   ["UNIDADE", "UN", "UNID"],
  preco:     ["PRECO", "PRECO_UNITARIO", "CUSTO_TOTAL", "VALOR_TOTAL", "CUSTO_UNITARIO", "TOTAL"],
  segmento:  ["SEGMENTO", "GRUPO", "CAPITULO", "NATUREZA"],
};

const REGIOES_MAP: Record<string, string> = {
  NORTE:        "NORTE",
  NORDESTE:     "NORDESTE",
  CENTRO_OESTE: "CENTRO_OESTE",
  CENTROOESTE:  "CENTRO_OESTE",
  SUDESTE:      "SUDESTE",
  SUL:          "SUL",
};

const SEGMENTOS_MAP: Record<string, string> = {
  TERRAPLENAGEM:           "TERRAPLENAGEM",
  PAVIMENTACAO:            "PAVIMENTACAO",
  PAVIMENTO:               "PAVIMENTACAO",
  DRENAGEM:                "DRENAGEM",
  OBRAS_DE_ARTE:           "OBRAS_DE_ARTE_ESPECIAIS",
  OAE:                     "OBRAS_DE_ARTE_ESPECIAIS",
  SINALIZACAO:             "SINALIZACAO",
  SINAL:                   "SINALIZACAO",
  OBRAS_COMPLEMENTARES:    "OBRAS_COMPLEMENTARES",
  COMPLEMENTAR:            "OBRAS_COMPLEMENTARES",
  INSUMO:                  "INSUMOS",
  INSUMOS:                 "INSUMOS",
};

function normalizeSegmento(raw: string | null): string | null {
  if (!raw) return null;
  const norm = normalizeHeader(raw);
  for (const [key, val] of Object.entries(SEGMENTOS_MAP)) {
    if (norm.includes(key)) return val;
  }
  return null;
}

function normalizeRegiao(raw: string | null): string | null {
  if (!raw) return null;
  const norm = normalizeHeader(raw);
  for (const [key, val] of Object.entries(REGIOES_MAP)) {
    if (norm.includes(key)) return val;
  }
  return null;
}

function detectTipo(codigo: string): "insumo" | "composicao_analitica" {
  // No SICRO, insumos têm código alfanumérico curto; composições começam com
  // padrão "XXXX XX-XX" ou têm 4+ segmentos
  const parts = codigo.split(/[-\/\.]/);
  if (parts.length >= 3) return "composicao_analitica";
  return "insumo";
}

export interface SicroParseResult {
  rows: SicroRow[];
  result: Omit<EtlResult, "inseridos" | "atualizados">;
}

/**
 * Parseia um arquivo SICRO (XLS ou XLSX).
 *
 * @param buffer   - Buffer do arquivo
 * @param filename - Nome original do arquivo
 * @param options  - Parâmetros explícitos
 */
export function parseSicro(
  buffer: Buffer,
  filename: string,
  options?: Partial<SicroParseOptions>
): SicroParseResult {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
    blankrows: false,
  });

  const mes     = options?.mes_referencia   ?? mesFromFilename(filename) ?? null;
  const uf      = options?.estado_uf        ?? ufFromFilename(filename)  ?? null;
  const regiao  = options?.regiao_geografica
    ? normalizeRegiao(options.regiao_geografica)
    : detectRegiaoFromFilename(filename);

  const errors: EtlRowError[] = [];
  const rows: SicroRow[] = [];

  if (!mes) {
    errors.push({ linha: 0, motivo: "Mês de referência não identificado. Informe mes_referencia." });
    return buildEmptyResult(filename, raw.length, errors);
  }

  const headerIdx = findHeaderRow(raw, ["CODIGO", "DESCRICAO", "UNIDADE", "PRECO"]);
  if (headerIdx < 0) {
    errors.push({ linha: 0, motivo: "Cabeçalho não encontrado nas primeiras 20 linhas." });
    return buildEmptyResult(filename, raw.length, errors);
  }

  const colMap = buildColMap(raw[headerIdx], COL_MAPPING);
  let ignorados = 0;

  for (let i = headerIdx + 1; i < raw.length; i++) {
    const row = raw[i];

    const codigo    = cellStr(row, colMap.codigo);
    const descricao = cellStr(row, colMap.descricao);
    const unidade   = cellStr(row, colMap.unidade);
    const precoRaw  = colMap.preco !== undefined ? row[colMap.preco] : null;

    if (!codigo || !descricao || !unidade) {
      ignorados++;
      continue;
    }

    const preco = parsePreco(precoRaw);
    if (preco === null) {
      errors.push({
        linha: i + 1,
        motivo: `Preço inválido: "${precoRaw}"`,
        dados: { codigo, descricao },
      });
      ignorados++;
      continue;
    }

    rows.push({
      codigo,
      descricao,
      unidade_medida: unidade,
      preco_unitario: preco,
      regiao_geografica: regiao,
      estado_uf: uf,
      mes_referencia: mes,
      tipo: detectTipo(codigo),
      segmento: normalizeSegmento(cellStr(row, colMap.segmento)),
      fonte_arquivo: filename,
    });
  }

  return {
    rows,
    result: {
      source: "SICRO",
      arquivo: filename,
      total_linhas: raw.length - headerIdx - 1,
      ignorados,
      erros: errors,
    },
  };
}

function detectRegiaoFromFilename(filename: string): string | null {
  const upper = filename.toUpperCase();
  if (upper.includes("SUL"))          return "SUL";
  if (upper.includes("SUDESTE"))      return "SUDESTE";
  if (upper.includes("NORDESTE"))     return "NORDESTE";
  if (upper.includes("NORTE"))        return "NORTE";
  if (upper.includes("CENTRO_OESTE") || upper.includes("CENTROOESTE")) return "CENTRO_OESTE";
  return null;
}

function buildEmptyResult(
  filename: string,
  totalLinhas: number,
  erros: EtlRowError[]
): SicroParseResult {
  return {
    rows: [],
    result: {
      source: "SICRO",
      arquivo: filename,
      total_linhas: totalLinhas,
      ignorados: totalLinhas,
      erros,
    },
  };
}
