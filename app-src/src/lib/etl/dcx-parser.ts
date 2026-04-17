/**
 * Parser para arquivos .DCX (formato fixed-width de catálogos EMOP/RJ)
 *
 * Estrutura do DCX:
 * - Registros de tamanho fixo (544 bytes por linha)
 * - Campos: código, descrição, unidade, preço unitário
 * - Sem headers — apenas dados
 *
 * Exemplo de linha (544 bytes):
 * [código 13 chars][desc 250 chars][unidade 5 chars][preco 15 chars][resto]
 */

import { mesFromFilename, ufFromFilename, parsePreco } from "./utils";
import type { EtlResult, EtlRowError } from "./types";

export interface DcxRow {
  codigo: string;
  descricao: string;
  unidade_medida: string;
  preco_unitario: string;
  estado_uf: string;
  mes_referencia: string;
}

export interface DcxParseResult {
  rows: DcxRow[];
  result: Omit<EtlResult, "inseridos" | "atualizados">;
}

/**
 * Parseia um arquivo DCX e extrai as linhas.
 *
 * @param buffer - Buffer do arquivo DCX
 * @param filename - Nome do arquivo (ex: EMOP130525.dcx para extrair UF/data)
 * @param options - Opções de override (estado_uf, mes_referencia)
 */
export function parseDcx(
  buffer: Buffer,
  filename: string,
  options?: { estado_uf?: string; mes_referencia?: string }
): DcxParseResult {
  const text = buffer.toString("utf-8");
  const lines = text.split("\n").filter((line) => line.trim().length > 0);

  // Detectar parâmetros do filename
  const detectedUf = ufFromFilename(filename) || "RJ"; // EMOP = Rio
  const detectedMes = mesFromFilename(filename);

  const estadoUf = options?.estado_uf || detectedUf;
  const mesRef = options?.mes_referencia || detectedMes;

  const errors: EtlRowError[] = [];
  const rows: DcxRow[] = [];

  lines.forEach((line, index) => {
    const trim = line.trim();
    if (!trim) return;

    const parsed = parseDcxLine(trim, index);
    if (!parsed.codigo || !parsed.preco) {
      errors.push({
        linha: index,
        motivo: `Código ou preço inválidos.`,
      });
      return;
    }

    rows.push({
      codigo: parsed.codigo,
      descricao: parsed.descricao,
      unidade_medida: parsed.unidade || "UN",
      preco_unitario: parsed.preco,
      estado_uf: estadoUf,
      mes_referencia: mesRef ? mesRef : new Date().toISOString().split("T")[0],
    });
  });

  return {
    rows,
    result: {
      source: "DCX",
      arquivo: filename,
      total_linhas: lines.length,
      ignorados: errors.length,
      erros: errors,
    },
  };
}

/**
 * Parseia uma única linha DCX (fixed-width).
 *
 * A estrutura estimada é:
 *   0-12:   CÓDIGO (13 chars)
 *   13-262: DESCRIÇÃO (250 chars)
 *   263-267: UNIDADE (5 chars)
 *   268-282: PREÇO (15 chars)
 *   resto: padding/lixo
 */
function parseDcxLine(
  line: string,
  index: number
): { codigo: string; descricao: string; unidade: string; preco: string } {
  // Estrutura observada: código começa no início
  const codigo = line.substring(0, 13).trim();

  // Descrição ocupa a maior parte após o código
  // Estimamos que vem em seguida e ocupa ~250 caracteres
  let descricao = line.substring(13, 263).trim();

  // Unidade costuma vir depois
  const unidade = line.substring(263, 268).trim();

  // Preço: procuramos números com ponto decimal
  // Pode estar nos chars 268 em diante
  let preco = "";
  const restante = line.substring(268);

  // Procura por padrão de preço: número com até 2 casas decimais
  const precoMatch = restante.match(/(\d+[.,]\d{2})/);
  if (precoMatch) {
    preco = precoMatch[1].replace(",", ".");
  }

  // Se não encontrou, tenta extrair número simples
  if (!preco) {
    const numMatch = restante.match(/(\d+\.?\d*)/);
    if (numMatch) {
      preco = numMatch[1];
    }
  }

  // Validar e normalizar preço
  const precoNormalizado = preco ? parsePreco(preco) : "";

  return {
    codigo,
    descricao,
    unidade,
    preco: precoNormalizado,
  };
}
