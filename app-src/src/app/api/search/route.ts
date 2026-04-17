/**
 * GET /api/search?q=<texto>&catalogo=<SINAPI|SICRO|EMOP|SCO>&limit=<n>&min_similarity=<0-1>
 *
 * Busca semântica cross-catálogo via pgvector (cosine similarity).
 * Acessível publicamente (dados de catálogos são públicos).
 *
 * Parâmetros:
 *   q              string   — consulta em linguagem natural (obrigatório)
 *   catalogo       string?  — filtra por catálogo específico
 *   limit          number?  — máx de resultados (default 20, max 50)
 *   min_similarity number?  — similaridade mínima 0-1 (default 0.5)
 */
import { createClient } from "@/lib/supabase/server";
import { embedQuery } from "@/lib/embeddings";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q             = searchParams.get("q")?.trim();
  const catalogo      = searchParams.get("catalogo")?.toUpperCase() || null;
  const limitRaw      = parseInt(searchParams.get("limit") ?? "20", 10);
  const minSimilarity = parseFloat(searchParams.get("min_similarity") ?? "0.5");

  if (!q) {
    return Response.json({ error: 'Parâmetro "q" obrigatório.' }, { status: 400 });
  }

  const limit = Math.min(isNaN(limitRaw) ? 20 : limitRaw, 50);

  // Valida catálogo
  const VALID_CATALOGOS = ["SINAPI", "SICRO", "EMOP", "SCO", null];
  if (!VALID_CATALOGOS.includes(catalogo)) {
    return Response.json(
      { error: `Catálogo inválido. Use: SINAPI, SICRO, EMOP ou SCO.` },
      { status: 400 }
    );
  }

  // Gera embedding da query
  let queryEmbedding: number[];
  try {
    queryEmbedding = await embedQuery(q);
  } catch (err) {
    return Response.json(
      { error: `Falha ao gerar embedding: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("search_catalog_semantic", {
    query_embedding:  JSON.stringify(queryEmbedding) as unknown as string,
    filter_catalogo:  catalogo,
    result_limit:     limit,
    min_similarity:   isNaN(minSimilarity) ? 0.5 : minSimilarity,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    query: q,
    catalogo: catalogo ?? "todos",
    total: data?.length ?? 0,
    results: data ?? [],
  });
}
