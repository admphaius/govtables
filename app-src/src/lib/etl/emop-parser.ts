import * as XLSX from "xlsx";
import {
  buildColMap,
  cellStr,
  findHeaderRow,
  mesFromFilename,
  parsePreco,
} from "./utils";
import type { EmopParseOptions, EmopRow, EtlResult, EtlRowError } from "./types";

// ----------------------------------------------------------------
// Mapeamento de colunas EMOP (XLS e DBF)
// ----------------------------------------------------------------
const COL_MAPPING_XLS = {
  codigo:      ["CODIGO", "COD", "CODIGO_DO_SERVICO", "COD_SVC"],
  descricao:   ["DESCRICAO", "DESCRICAO_DO_SERVICO", "DENOMINACAO", "DESC"],
  unidade:     ["UNIDADE", "UN", "UNID"],
  preco:       ["PRECO", "PRECO_UNITARIO", "VALOR", "VALOR_UNITARIO", "CUSTO"],
  capitulo:    ["CAPITULO", "CAP", "GRUPO_1", "NIVEL_1"],
  subcapitulo: ["SUBCAPITULO", "SUBCAP", "GRUPO_2", "NIVEL_2"],
};

// Mapeamento de colunas DBF legado (sistema SIPCI)
const COL_MAPPING_DBF = {
  codigo:      ["CODIGO", "COD_ITEM", "CD_ITEM"],
  descricao:   ["DESCRICAO", "DESC_ITEM", "DENOMINACAO"],
  unidade:     ["UNIDADE", "UNID", "UN"],
  preco:       ["PRECO", "VALOR", "PRECO_UNT", "VL_UNIT"],
  capitulo:    ["CAPITULO", "CAP", "CD_CAP"],
  subcapitulo: ["SUBCAPITULO", "SUBCAP", "CD_SUB"],
};

function detectTipo(codigo: string, descricao: string): "insumo" | "composicao_analitica" {
  if (descricao.toUpperCase().includes("COMPOSIC")) return "composicao_analitica";
  // Códigos EMOP: insumos têm formato XX.XX; composições XX.XX.XX ou mais níveis
  const levels = codigo.split(/[.\-\/]/).filter(Boolean);
  if (levels.length >= 3) return "composicao_analitica";
  return "insumo";
}

export interface EmopParseResult {
  rows: EmopRow[];
  result: Omit<EtlResult, "inseridos" | "atualizados">;
}

/**
 * Parseia um arquivo EMOP (XLS, XLSX ou DBF).
 * Detecta automaticamente o formato pelo conteúdo.
 *
 * @param buffer   - Buffer do arquivo
 * @param filename - Nome original do arquivo
 * @param options  - Parâmetros explícitos
 */
export function parseEmop(
  buffer: Buffer,
  filename: string,
  options?: Partial<EmopParseOptions>
): EmopParseResult {
  const isDbf = filename.toUpperCase().endsWith(".DBF");
  const mes = options?.mes_referencia ?? mesFromFilename(filename) ?? null;
  const origemLegado = options?.origem_legado ?? isDbf;

  const errors: EtlRowError[] = [];
  const rows: EmopRow[] = [];

  if (!mes) {
    errors.push({ linha: 0, motivo: "Mês de referência não identificado. Informe mes_referencia." });
    return buildEmptyResult(filename, 0, errors);
  }

  // SheetJS lê tanto XLS/XLSX quanto DBF com a mesma API
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

  const colMapping = isDbf ? COL_MAPPING_DBF : COL_MAPPING_XLS;
  const headerIdx = findHeaderRow(raw, ["CODIGO", "DESCRICAO", "UNIDADE", "PRECO"]);

  if (headerIdx < 0) {
    // Para DBF sem linha de cabeçalho explícita: SheetJS usa a primeira linha como cabeçalho
    // Tenta com headerIdx = 0 implicitamente
    errors.push({ linha: 0, motivo: "Cabeçalho não encontrado nas primeiras 20 linhas." });
    return buildEmptyResult(filename, raw.length, errors);
  }

  const colMap = buildColMap(raw[headerIdx], colMapping);
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
      capitulo:    cellStr(row, colMap.capitulo),
      subcapitulo: cellStr(row, colMap.subcapitulo),
      origem_legado: origemLegado,
      fonte_arquivo: filename,
    });
  }

  return {
    rows,
    result: {
      source: "EMOP",
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
): EmopParseResult {
  return {
    rows: [],
    result: {
      source: "EMOP",
      arquivo: filename,
      total_linhas: totalLinhas,
      ignorados: totalLinhas,
      erros,
    },
  };
}
