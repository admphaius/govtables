import * as XLSX from "xlsx";
import {
  buildColMap,
  cellStr,
  findHeaderRow,
  mesFromFilename,
  parsePreco,
} from "./utils";
import type { EtlResult, EtlRowError, ScoParseOptions, ScoRow } from "./types";

// ----------------------------------------------------------------
// Mapeamento de colunas SCO-Rio (SMO-Rio / Prefeitura do Rio)
// ----------------------------------------------------------------
const COL_MAPPING = {
  codigo:   ["CODIGO", "COD", "CODIGO_DO_SERVICO", "ITEM"],
  descricao:["DESCRICAO", "DESCRICAO_DO_SERVICO", "DENOMINACAO", "DESC"],
  unidade:  ["UNIDADE", "UN", "UNID"],
  preco:    ["PRECO", "PRECO_UNITARIO", "VALOR", "VALOR_UNITARIO", "CUSTO_UNITARIO"],
  grupo:    ["GRUPO", "CAPITULO", "CAP", "NIVEL_1", "GRUPO_1"],
  subgrupo: ["SUBGRUPO", "SUBCAPITULO", "SUBCAP", "NIVEL_2", "GRUPO_2"],
};

function detectTipo(codigo: string, descricao: string): "insumo" | "composicao_analitica" {
  if (descricao.toUpperCase().includes("COMPOSIC")) return "composicao_analitica";
  const levels = codigo.split(/[.\-\/]/).filter(Boolean);
  if (levels.length >= 3) return "composicao_analitica";
  return "insumo";
}

export interface ScoParseResult {
  rows: ScoRow[];
  result: Omit<EtlResult, "inseridos" | "atualizados">;
}

/**
 * Parseia um arquivo SCO-Rio (XLS ou XLSX).
 *
 * @param buffer   - Buffer do arquivo
 * @param filename - Nome original do arquivo
 * @param options  - Parâmetros explícitos
 */
export function parseSco(
  buffer: Buffer,
  filename: string,
  options?: Partial<ScoParseOptions>
): ScoParseResult {
  const mes = options?.mes_referencia ?? mesFromFilename(filename) ?? null;
  const errors: EtlRowError[] = [];
  const rows: ScoRow[] = [];

  if (!mes) {
    errors.push({ linha: 0, motivo: "Mês de referência não identificado. Informe mes_referencia." });
    return buildEmptyResult(filename, 0, errors);
  }

  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  } catch (err) {
    errors.push({ linha: 0, motivo: `Erro ao ler arquivo: ${err instanceof Error ? err.message : String(err)}` });
    return buildEmptyResult(filename, 0, errors);
  }

  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
    blankrows: false,
  });

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
      mes_referencia: mes,
      tipo: detectTipo(codigo, descricao),
      grupo:    cellStr(row, colMap.grupo),
      subgrupo: cellStr(row, colMap.subgrupo),
      fonte_arquivo: filename,
    });
  }

  return {
    rows,
    result: {
      source: "SCO",
      arquivo: filename,
      total_linhas: raw.length - headerIdx - 1,
      ignorados,
      erros: errors,
    },
  };
}

function buildEmptyResult(
  filename: string,
  totalLinhas: number,
  erros: EtlRowError[]
): ScoParseResult {
  return {
    rows: [],
    result: {
      source: "SCO",
      arquivo: filename,
      total_linhas: totalLinhas,
      ignorados: totalLinhas,
      erros,
    },
  };
}
