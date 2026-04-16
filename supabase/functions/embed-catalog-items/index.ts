/**
 * Edge Function: embed-catalog-items
 *
 * Gera embeddings para itens de catálogo que ainda não têm vetor.
 * Projetada para execução periódica (cron) ou chamada manual pós-ETL.
 *
 * Variáveis de ambiente necessárias (Supabase Secrets):
 *   OPENAI_API_KEY        — chave da API OpenAI
 *   SUPABASE_URL          — URL do projeto (injetado automaticamente)
 *   SUPABASE_SERVICE_ROLE_KEY — chave service_role (injetada automaticamente)
 *
 * Invocação:
 *   supabase functions invoke embed-catalog-items \
 *     --body '{"catalogo":"SINAPI","batch_size":100}'
 *
 * Ou via HTTP:
 *   POST https://<project>.supabase.co/functions/v1/embed-catalog-items
 *   Authorization: Bearer <anon_key>
 *   x-etl-secret: <ETL_SECRET>   (opcional se usando service_role)
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const OPENAI_EMBED_URL = "https://api.openai.com/v1/embeddings";
const EMBED_MODEL      = "text-embedding-3-small";
const EMBED_DIMENSIONS = 1536;
const DEFAULT_BATCH    = 100;

const CATALOGO_TABLES: Record<string, string> = {
  SINAPI: "tb_sinapi",
  SICRO:  "tb_sicro",
  EMOP:   "tb_emop",
  SCO:    "tb_sco",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  const supabaseUrl      = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const openAiKey        = Deno.env.get("OPENAI_API_KEY");

  if (!openAiKey) {
    return json({ error: "OPENAI_API_KEY não configurada." }, 500);
  }

  let body: { catalogo?: string; batch_size?: number } = {};
  try {
    body = await req.json();
  } catch {
    // body opcional
  }

  const catalogo  = (body.catalogo ?? "SINAPI").toUpperCase();
  const batchSize = Math.min(body.batch_size ?? DEFAULT_BATCH, 500);

  if (!(catalogo in CATALOGO_TABLES)) {
    return json({ error: `Catálogo inválido. Use: ${Object.keys(CATALOGO_TABLES).join(", ")}` }, 400);
  }

  const table    = CATALOGO_TABLES[catalogo];
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Busca itens sem embedding
  const { data: items, error: fetchError } = await supabase
    .from(table)
    .select("id, codigo, descricao, descricao_longa")
    .is("embedding", null)
    .eq("is_ativo", true)
    .limit(batchSize);

  if (fetchError) {
    return json({ error: fetchError.message }, 500);
  }

  if (!items || items.length === 0) {
    return json({ catalogo, processados: 0, pendentes: 0, tokens_used: 0 });
  }

  // Monta textos para embedding
  const texts = items.map((item: { codigo: string; descricao: string; descricao_longa?: string | null }) =>
    `[${item.codigo}] ${item.descricao}${item.descricao_longa ? " " + item.descricao_longa : ""}`.slice(0, 8000)
  );

  // Chama OpenAI
  const embedResp = await fetch(OPENAI_EMBED_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts, dimensions: EMBED_DIMENSIONS }),
  });

  if (!embedResp.ok) {
    const err = await embedResp.text();
    return json({ error: `OpenAI error ${embedResp.status}: ${err}` }, 502);
  }

  const embedJson = await embedResp.json() as {
    data: { embedding: number[]; index: number }[];
    usage: { total_tokens: number };
  };

  const sorted = embedJson.data.sort((a, b) => a.index - b.index);

  // Atualiza embeddings no banco
  const updateErrors: string[] = [];
  for (let i = 0; i < items.length; i++) {
    const { error: upErr } = await supabase
      .from(table)
      .update({ embedding: JSON.stringify(sorted[i].embedding) })
      .eq("id", (items[i] as { id: string }).id);

    if (upErr) updateErrors.push(`${(items[i] as { id: string }).id}: ${upErr.message}`);
  }

  // Conta pendentes
  const { count: pendentes } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .is("embedding", null)
    .eq("is_ativo", true);

  return json({
    catalogo,
    processados: items.length - updateErrors.length,
    pendentes: pendentes ?? 0,
    tokens_used: embedJson.usage.total_tokens,
    erros: updateErrors,
  });
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
