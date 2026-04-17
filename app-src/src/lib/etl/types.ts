import type { Database } from "@/types/supabase";

// ----------------------------------------------------------------
// Tipos base para o pipeline ETL
// ----------------------------------------------------------------

export type TipoItem = Database["public"]["Enums"]["tipo_item"];

/** Resultado de um job de ingestão */
export interface EtlResult {
  source: "SINAPI" | "SICRO" | "EMOP" | "SCO";
  arquivo: string;
  total_linhas: number;
  inseridos: number;
  atualizados: number;
  ignorados: number;
  erros: EtlRowError[];
}

export interface EtlRowError {
  linha: number;
  motivo: string;
  dados?: Record<string, unknown>;
}

// ----------------------------------------------------------------
// Tipos de linha bruta (pré-validação)
// ----------------------------------------------------------------

export interface SinapiRow {
  codigo: string;
  descricao: string;
  descricao_longa?: string;
  unidade_medida: string;
  preco_unitario: string; // string → Decimal para cálculos
  estado_uf: string;
  mes_referencia: string; // YYYY-MM-DD
  tipo: TipoItem;
  classe?: string | null;
  is_onerado: boolean;
  fonte_arquivo: string;
}

export interface SicroRow {
  codigo: string;
  descricao: string;
  descricao_longa?: string;
  unidade_medida: string;
  preco_unitario: string;
  regiao_geografica?: string | null;
  estado_uf?: string | null;
  mes_referencia: string;
  tipo: TipoItem;
  segmento?: string | null;
  fonte_arquivo: string;
}

export interface EmopRow {
  codigo: string;
  descricao: string;
  descricao_longa?: string;
  unidade_medida: string;
  preco_unitario: string;
  mes_referencia: string;
  tipo: TipoItem;
  capitulo?: string | null;
  subcapitulo?: string | null;
  origem_legado: boolean;
  fonte_arquivo: string;
}

export interface ScoRow {
  codigo: string;
  descricao: string;
  descricao_longa?: string;
  unidade_medida: string;
  preco_unitario: string;
  mes_referencia: string;
  tipo: TipoItem;
  grupo?: string | null;
  subgrupo?: string | null;
  fonte_arquivo: string;
}

// ----------------------------------------------------------------
// Opções de parsing
// ----------------------------------------------------------------

export interface SinapiParseOptions {
  estado_uf: string;
  mes_referencia: string; // YYYY-MM-DD
  is_onerado: boolean;
}

export interface SicroParseOptions {
  mes_referencia: string;
  regiao_geografica?: string;
  estado_uf?: string;
}

export interface EmopParseOptions {
  mes_referencia: string;
  origem_legado?: boolean;
}

export interface ScoParseOptions {
  mes_referencia: string;
}
