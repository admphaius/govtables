/**
 * POST /api/etl/embed
 *
 * Gera embeddings (OpenAI text-embedding-3-small) para itens
 * de catálogo que ainda não têm vetor. Processa um lote por chamada.
 *
 * Headers obrigatórios:
 *   x-etl-secret: <ETL_SECRET>
 *
 * Body (JSON):
 *   catalogo   "SINAPI" | "SICRO" | "EMOP" | "SCO"
 *   batch_size  number?  — itens por chamada (default 100, max 500)
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { buildEmbedText, embedTexts } from "@/lib/embeddings";
import { jsonResponse, validateEtlSecret } from "../_lib/etl-request";

const CATALOGO_TABLES = {
  SINAPI: "tb_sinapi",
  SICRO:  "tb_sicro",
  EMOP:   "tb_emop",
  SCO:    "tb_sco",
} as const;

type CatalogoKey = keyof typeof CATALOGO_TABLES;

export async function POST(request: Request) {
  const authError = validateEtlSecret(request);
  if (authError) return authError;

  let body: { catalogo?: string; batch_size?: number };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Body JSON inválido." }, 400);
  }

  const catalogo = body.catalogo?.toUpperCase() as CatalogoKey | undefined;
  if (!catalogo || !(catalogo in CATALOGO_TABLES)) {
    return jsonResponse(
      { error: `Campo "catalogo" obrigatório. Valores: ${Object.keys(CATALOGO_TABLES).join(", ")}` },
      400
    );
  }

  const batchSize = Math.min(body.batch_size ?? 100, 500);
  const table = CATALOGO_TABLES[catalogo];
  const supabase = createAdminClient();

  // Busca itens sem embedding
  const { data: items, error: fetchError } = await supabase
    .from(table)
    .select("id, codigo, descricao, descricao_longa")
    .is("embedding", null)
    .eq("is_ativo", true)
    .limit(batchSize);

  if (fetchError) {
    return jsonResponse({ error: fetchError.message }, 500);
  }

  if (!items || items.length === 0) {
    return jsonResponse({ catalogo, processados: 0, pendentes: 0, tokens_used: 0 });
  }

  // Gera textos para embedding
  const texts = items.map((item) =>
    buildEmbedText(
      item.codigo,
      item.descricao,
      (item as { descricao_longa?: string | null }).descricao_longa ?? undefined
    )
  );

  let embedResult: { embeddings: number[][]; tokens_used: number };
  try {
    embedResult = await embedTexts(texts);
  } catch (err) {
    return jsonResponse(
      { error: `Falha na API de embeddings: ${err instanceof Error ? err.message : String(err)}` },
      502
    );
  }

  // Atualiza embedding de cada item
  const updateErrors: string[] = [];
  for (let i = 0; i < items.length; i++) {
    const { error: updateError } = await supabase
      .from(table)
      .update({ embedding: JSON.stringify(embedResult.embeddings[i]) })
      .eq("id", items[i].id);

    if (updateError) {
      updateErrors.push(`${items[i].id}: ${updateError.message}`);
    }
  }

  // Conta pendentes restantes
  const { count: pendentes } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .is("embedding", null)
    .eq("is_ativo", true);

  return jsonResponse({
    catalogo,
    processados: items.length - updateErrors.length,
    pendentes: pendentes ?? 0,
    tokens_used: embedResult.tokens_used,
    erros: updateErrors,
  });
}
