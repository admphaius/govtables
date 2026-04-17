import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/supabase";
import type { DcxRow, EmopRow, EtlResult, ScoRow, SicroRow, SinapiRow } from "./types";

// ----------------------------------------------------------------
// Tamanho do lote para upserts — equilibra throughput e memória
// ----------------------------------------------------------------
const BATCH_SIZE = 500;

type SinapiInsert = Database["public"]["Tables"]["tb_sinapi"]["Insert"];
type SicroInsert  = Database["public"]["Tables"]["tb_sicro"]["Insert"];
type EmopInsert   = Database["public"]["Tables"]["tb_emop"]["Insert"];
type ScoInsert    = Database["public"]["Tables"]["tb_sco"]["Insert"];
type DcxInsert    = Database["public"]["Tables"]["tb_dcx"]["Insert"];

type BatchUpsertResult = { inseridos: number; erros: string[] };

// ----------------------------------------------------------------
// SINAPI
// ----------------------------------------------------------------
export async function loadSinapi(
  rows: SinapiRow[],
  resultBase: Omit<EtlResult, "inseridos" | "atualizados">
): Promise<EtlResult> {
  const supabase = createAdminClient();
  const inserts: SinapiInsert[] = rows.map((r) => ({
    codigo:          r.codigo,
    descricao:       r.descricao,
    descricao_longa: r.descricao_longa ?? null,
    unidade_medida:  r.unidade_medida,
    preco_unitario:  r.preco_unitario as unknown as number,
    estado_uf:       r.estado_uf,
    mes_referencia:  r.mes_referencia,
    tipo:            r.tipo,
    classe:          (r.classe as SinapiInsert["classe"]) ?? null,
    is_onerado:      r.is_onerado,
    is_ativo:        true,
    fonte_arquivo:   r.fonte_arquivo,
  }));

  const { inseridos, erros } = await runBatches(async (batch) => {
    const { error, count } = await supabase
      .from("tb_sinapi")
      .upsert(batch as SinapiInsert[], {
        onConflict: "codigo,estado_uf,mes_referencia,is_onerado",
        ignoreDuplicates: false,
        count: "exact",
      });
    return { error: error?.message, count: count ?? batch.length };
  }, inserts);

  return {
    ...resultBase,
    inseridos,
    atualizados: 0,
    erros: [...resultBase.erros, ...erros.map((e) => ({ linha: -1, motivo: e }))],
  };
}

// ----------------------------------------------------------------
// SICRO
// ----------------------------------------------------------------
export async function loadSicro(
  rows: SicroRow[],
  resultBase: Omit<EtlResult, "inseridos" | "atualizados">
): Promise<EtlResult> {
  const supabase = createAdminClient();
  const inserts: SicroInsert[] = rows.map((r) => ({
    codigo:            r.codigo,
    descricao:         r.descricao,
    descricao_longa:   r.descricao_longa ?? null,
    unidade_medida:    r.unidade_medida,
    preco_unitario:    r.preco_unitario as unknown as number,
    regiao_geografica: (r.regiao_geografica as SicroInsert["regiao_geografica"]) ?? null,
    estado_uf:         r.estado_uf ?? null,
    mes_referencia:    r.mes_referencia,
    tipo:              r.tipo,
    segmento:          (r.segmento as SicroInsert["segmento"]) ?? null,
    is_ativo:          true,
    fonte_arquivo:     r.fonte_arquivo,
  }));

  const { inseridos, erros } = await runBatches(async (batch) => {
    const { error, count } = await supabase
      .from("tb_sicro")
      .upsert(batch as SicroInsert[], {
        onConflict: "codigo,mes_referencia,regiao_geografica,estado_uf",
        ignoreDuplicates: false,
        count: "exact",
      });
    return { error: error?.message, count: count ?? batch.length };
  }, inserts);

  return {
    ...resultBase,
    inseridos,
    atualizados: 0,
    erros: [...resultBase.erros, ...erros.map((e) => ({ linha: -1, motivo: e }))],
  };
}

// ----------------------------------------------------------------
// EMOP
// ----------------------------------------------------------------
export async function loadEmop(
  rows: EmopRow[],
  resultBase: Omit<EtlResult, "inseridos" | "atualizados">
): Promise<EtlResult> {
  const supabase = createAdminClient();
  const inserts: EmopInsert[] = rows.map((r) => ({
    codigo:          r.codigo,
    descricao:       r.descricao,
    descricao_longa: r.descricao_longa ?? null,
    unidade_medida:  r.unidade_medida,
    preco_unitario:  r.preco_unitario as unknown as number,
    mes_referencia:  r.mes_referencia,
    tipo:            r.tipo,
    capitulo:        r.capitulo ?? null,
    subcapitulo:     r.subcapitulo ?? null,
    origem_legado:   r.origem_legado,
    is_ativo:        true,
    fonte_arquivo:   r.fonte_arquivo,
  }));

  const { inseridos, erros } = await runBatches(async (batch) => {
    const { error, count } = await supabase
      .from("tb_emop")
      .upsert(batch as EmopInsert[], {
        onConflict: "codigo,mes_referencia",
        ignoreDuplicates: false,
        count: "exact",
      });
    return { error: error?.message, count: count ?? batch.length };
  }, inserts);

  return {
    ...resultBase,
    inseridos,
    atualizados: 0,
    erros: [...resultBase.erros, ...erros.map((e) => ({ linha: -1, motivo: e }))],
  };
}

// ----------------------------------------------------------------
// SCO
// ----------------------------------------------------------------
export async function loadSco(
  rows: ScoRow[],
  resultBase: Omit<EtlResult, "inseridos" | "atualizados">
): Promise<EtlResult> {
  const supabase = createAdminClient();
  const inserts: ScoInsert[] = rows.map((r) => ({
    codigo:          r.codigo,
    descricao:       r.descricao,
    descricao_longa: r.descricao_longa ?? null,
    unidade_medida:  r.unidade_medida,
    preco_unitario:  r.preco_unitario as unknown as number,
    mes_referencia:  r.mes_referencia,
    tipo:            r.tipo,
    grupo:           r.grupo ?? null,
    subgrupo:        r.subgrupo ?? null,
    is_ativo:        true,
    fonte_arquivo:   r.fonte_arquivo,
  }));

  const { inseridos, erros } = await runBatches(async (batch) => {
    const { error, count } = await supabase
      .from("tb_sco")
      .upsert(batch as ScoInsert[], {
        onConflict: "codigo,mes_referencia",
        ignoreDuplicates: false,
        count: "exact",
      });
    return { error: error?.message, count: count ?? batch.length };
  }, inserts);

  return {
    ...resultBase,
    inseridos,
    atualizados: 0,
    erros: [...resultBase.erros, ...erros.map((e) => ({ linha: -1, motivo: e }))],
  };
}

// ----------------------------------------------------------------
// DCX (EMOP-RJ)
// ----------------------------------------------------------------
export async function loadDcx(
  rows: DcxRow[],
  resultBase: Omit<EtlResult, "inseridos" | "atualizados">
): Promise<EtlResult> {
  const supabase = createAdminClient();
  const inserts: DcxInsert[] = rows.map((r) => ({
    codigo:         r.codigo,
    descricao:      r.descricao,
    unidade_medida: r.unidade_medida,
    preco_unitario: r.preco_unitario as unknown as number,
    estado_uf:      r.estado_uf,
    mes_referencia: r.mes_referencia,
    is_ativo:       true,
    fonte_arquivo:  `dcx-${resultBase.arquivo}`,
  }));

  const { inseridos, erros } = await runBatches(async (batch) => {
    const { error, count } = await supabase
      .from("tb_dcx")
      .upsert(batch as DcxInsert[], {
        onConflict: "codigo,estado_uf,mes_referencia",
        ignoreDuplicates: false,
        count: "exact",
      });
    return { error: error?.message, count: count ?? batch.length };
  }, inserts);

  return {
    ...resultBase,
    inseridos,
    atualizados: 0,
    erros: [...resultBase.erros, ...erros.map((e) => ({ linha: -1, motivo: e }))],
  };
}

// ----------------------------------------------------------------
// Helper de batching
// ----------------------------------------------------------------
async function runBatches<T>(
  upsertFn: (batch: T[]) => Promise<{ error?: string; count: number }>,
  rows: T[]
): Promise<BatchUpsertResult> {
  let inseridos = 0;
  const erros: string[] = [];

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error, count } = await upsertFn(batch);
    if (error) {
      erros.push(`Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error}`);
    } else {
      inseridos += count;
    }
  }

  return { inseridos, erros };
}
