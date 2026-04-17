import * as XLSX from "xlsx";
import {
  buildColMap,
  cellStr,
  findHeaderRow,
  isOneradoFromFilename,
  mesFromFilename,
  parsePreco,
  ufFromFilename,
} from "./utils";
import type { EtlResult, EtlRowError, SinapiParseOptions, SinapiRow } from "./types";

// ----------------------------------------------------------------
// Mapeamento de colunas SINAPI
// Os arquivos CEF usam variações destes nomes ao longo das versões.
// ----------------------------------------------------------------
const COL_MAPPING = {
  codigo:        ["CODIGO", "COD", "CODIGO_DO_SERVICO", "CODIGO_ITEM"],
  descricao:     ["DESCRICAO", "DESCRICAO_DO_SERVICO", "DENOMINACAO", "DESC"],
  unidade:       ["UNIDADE", "UN", "UNID", "UNIDADE_DE_MEDIDA"],
  preco:         ["PRECO", "PRECO_UNITARIO", "VALOR_UNITARIO", "CUSTO_UNITARIO", "VALOR"],
  classe:        ["CLASSE", "TIPO_ITEM", "CATEGORIA", "GRUPO"],
};

// Mapeamento de classes SINAPI para o ENUM do banco
const CLASSE_MAP: Record<string, string> = {
  MATERIAL:                "MATERIAL",
  MAO_DE_OBRA:             "MAO_DE_OBRA",
  MAO:                     "MAO_DE_OBRA",
  EQUIPAMENTO:             "EQUIPAMENTO",
  SERVICO_TERCEIRIZADO:    "SERVICO_TERCEIRIZADO",
  SERVICO:                 "SERVICO_TERCEIRIZADO",
  TRANSPORTE:              "TRANSPORTE",
};

function normalizeClasse(raw: string | null): string | null {
  if (!raw) return null;
  const upper = raw.toUpperCase().replace(/[^A-Z_]/g, "_");
  for (const [key, val] of Object.entries(CLASSE_MAP)) {
    if (upper.includes(key)) return val;
  }
  return null;
}

// SINAPI tem itens analíticos (insumos) e sintéticos (composições)
function detectTipo(codigo: string, descricao: string): "insumo" | "composicao_analitica" {
  // Composições SINAPI costumam ter código numérico ≥ 5 dígitos
  // ou a própria descrição diz "COMPOSIÇÃO"
  if (descricao.toUpperCase().includes("COMPOSIC") || descricao.toUpperCase().includes("COMP.")) {
    return "composicao_analitica";
  }
  const numerico = codigo.replace(/\D/g, "");
  if (numerico.length >= 5) return "composicao_analitica";
  return "insumo";
}

export interface SinapiParseResult {
  rows: SinapiRow[];
  result: Omit<EtlResult, "inseridos" | "atualizados">;
}

/**
 * Parseia um arquivo SINAPI (XLS ou XLSX) e retorna as linhas validadas.
 *
 * @param buffer  - Buffer do arquivo
 * @param filename - Nome original do arquivo (usado para extrair UF/mês/regime)
 * @param options - Parâmetros explícitos (sobrescrevem detecção automática)
 */
export function parseSinapi(
  buffer: Buffer,
  filename: string,
  options?: Partial<SinapiParseOptions>
): SinapiParseResult {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
    blankrows: false,
  });

  // Detecta metadados a partir do nome do arquivo
  const uf       = options?.estado_uf   ?? ufFromFilename(filename)   ?? null;
  const mes      = options?.mes_referencia ?? mesFromFilename(filename) ?? null;
  const onerado  = options?.is_onerado  ?? isOneradoFromFilename(filename);

  const errors: EtlRowError[] = [];
  const rows: SinapiRow[] = [];

  if (!uf) {
    errors.push({ linha: 0, motivo: "UF não identificada. Informe estado_uf nos parâmetros." });
    return {
      rows,
      result: {
        source: "SINAPI",
        arquivo: filename,
        total_linhas: raw.length,
        ignorados: raw.length,
        erros: errors,
      },
    };
  }

  if (!mes) {
    errors.push({ linha: 0, motivo: "Mês de referência não identificado. Informe mes_referencia." });
    return {
      rows,
      result: {
        source: "SINAPI",
        arquivo: filename,
        total_linhas: raw.length,
        ignorados: raw.length,
        erros: errors,
      },
    };
  }

  const headerIdx = findHeaderRow(raw, Object.keys(COL_MAPPING));
  if (headerIdx < 0) {
    errors.push({ linha: 0, motivo: "Cabeçalho não encontrado nas primeiras 20 linhas." });
    return {
      rows,
      result: {
        source: "SINAPI",
        arquivo: filename,
        total_linhas: raw.length,
        ignorados: raw.length,
        erros: errors,
      },
    };
  }

  const colMap = buildColMap(raw[headerIdx], COL_MAPPING);
  let ignorados = 0;

  for (let i = headerIdx + 1; i < raw.length; i++) {
    const row = raw[i];

    const codigo = cellStr(row, colMap.codigo);
    const descricao = cellStr(row, colMap.descricao);
    const unidade = cellStr(row, colMap.unidade);
    const precoRaw = colMap.preco !== undefined ? row[colMap.preco] : null;

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
      estado_uf: uf,
      mes_referencia: mes,
      tipo: detectTipo(codigo, descricao),
      classe: normalizeClasse(cellStr(row, colMap.classe)),
      is_onerado: onerado,
      fonte_arquivo: filename,
    });
  }

  return {
    rows,
    result: {
      source: "SINAPI",
      arquivo: filename,
      total_linhas: raw.length - headerIdx - 1,
      ignorados,
      erros: errors,
    },
  };
}
