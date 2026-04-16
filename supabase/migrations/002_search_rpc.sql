-- ============================================================
-- Migration: 002_search_rpc.sql
-- GovTables — Busca semântica cross-catálogo via pgvector
-- Criado em: 2026-04-16
--
-- Cria a função RPC `search_catalog_semantic` que faz busca
-- por similaridade coseno em todos os 4 catálogos simultaneamente.
-- Chamada via supabase.rpc('search_catalog_semantic', { ... })
-- ============================================================


-- ============================================================
-- FUNÇÃO: search_catalog_semantic
--
-- Parâmetros:
--   query_embedding   vector(1536) — embedding da consulta
--   filter_catalogo   text         — "SINAPI"|"SICRO"|"EMOP"|"SCO"|NULL (todos)
--   result_limit      int          — máximo de resultados (default 20)
--   min_similarity    float        — similaridade mínima coseno (default 0.5)
--
-- Retorna os `result_limit` itens mais similares, ordenados por
-- similaridade decrescente.
-- ============================================================
CREATE OR REPLACE FUNCTION search_catalog_semantic(
    query_embedding   vector(1536),
    filter_catalogo   text    DEFAULT NULL,
    result_limit      int     DEFAULT 20,
    min_similarity    float   DEFAULT 0.5
)
RETURNS TABLE (
    id               uuid,
    catalogo         text,
    codigo           text,
    descricao        text,
    unidade_medida   text,
    preco_unitario   numeric,
    mes_referencia   date,
    extra_info       jsonb,   -- metadados específicos de cada catálogo
    similarity       float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    -- SINAPI
    SELECT
        s.id,
        'SINAPI'::text                        AS catalogo,
        s.codigo,
        s.descricao,
        s.unidade_medida,
        s.preco_unitario,
        s.mes_referencia::date,
        jsonb_build_object(
            'estado_uf',   s.estado_uf,
            'is_onerado',  s.is_onerado,
            'classe',      s.classe
        )                                     AS extra_info,
        1 - (s.embedding <=> query_embedding) AS similarity
    FROM public.tb_sinapi s
    WHERE s.embedding IS NOT NULL
      AND s.is_ativo = TRUE
      AND (filter_catalogo IS NULL OR filter_catalogo = 'SINAPI')
      AND 1 - (s.embedding <=> query_embedding) >= min_similarity

    UNION ALL

    -- SICRO
    SELECT
        s.id,
        'SICRO'::text,
        s.codigo,
        s.descricao,
        s.unidade_medida,
        s.preco_unitario,
        s.mes_referencia::date,
        jsonb_build_object(
            'regiao_geografica', s.regiao_geografica,
            'estado_uf',         s.estado_uf,
            'segmento',          s.segmento
        ),
        1 - (s.embedding <=> query_embedding)
    FROM public.tb_sicro s
    WHERE s.embedding IS NOT NULL
      AND s.is_ativo = TRUE
      AND (filter_catalogo IS NULL OR filter_catalogo = 'SICRO')
      AND 1 - (s.embedding <=> query_embedding) >= min_similarity

    UNION ALL

    -- EMOP
    SELECT
        e.id,
        'EMOP'::text,
        e.codigo,
        e.descricao,
        e.unidade_medida,
        e.preco_unitario,
        e.mes_referencia::date,
        jsonb_build_object(
            'capitulo',     e.capitulo,
            'subcapitulo',  e.subcapitulo,
            'origem_legado',e.origem_legado
        ),
        1 - (e.embedding <=> query_embedding)
    FROM public.tb_emop e
    WHERE e.embedding IS NOT NULL
      AND e.is_ativo = TRUE
      AND (filter_catalogo IS NULL OR filter_catalogo = 'EMOP')
      AND 1 - (e.embedding <=> query_embedding) >= min_similarity

    UNION ALL

    -- SCO
    SELECT
        sc.id,
        'SCO'::text,
        sc.codigo,
        sc.descricao,
        sc.unidade_medida,
        sc.preco_unitario,
        sc.mes_referencia::date,
        jsonb_build_object(
            'grupo',    sc.grupo,
            'subgrupo', sc.subgrupo
        ),
        1 - (sc.embedding <=> query_embedding)
    FROM public.tb_sco sc
    WHERE sc.embedding IS NOT NULL
      AND sc.is_ativo = TRUE
      AND (filter_catalogo IS NULL OR filter_catalogo = 'SCO')
      AND 1 - (sc.embedding <=> query_embedding) >= min_similarity

    ORDER BY similarity DESC
    LIMIT result_limit
$$;

-- Permissão de execução para roles autenticadas e anon (leitura pública)
GRANT EXECUTE ON FUNCTION search_catalog_semantic(vector, text, int, float)
    TO authenticated, anon;

-- ============================================================
-- FUNÇÃO: count_embeddings_pending
--
-- Retorna quantos itens por catálogo ainda não têm embedding.
-- Usada pelo dashboard de ingestão para mostrar progresso.
-- ============================================================
CREATE OR REPLACE FUNCTION count_embeddings_pending()
RETURNS TABLE (
    catalogo text,
    pendentes bigint,
    total     bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 'SINAPI'::text,
           COUNT(*) FILTER (WHERE embedding IS NULL),
           COUNT(*)
    FROM public.tb_sinapi WHERE is_ativo = TRUE

    UNION ALL

    SELECT 'SICRO'::text,
           COUNT(*) FILTER (WHERE embedding IS NULL),
           COUNT(*)
    FROM public.tb_sicro WHERE is_ativo = TRUE

    UNION ALL

    SELECT 'EMOP'::text,
           COUNT(*) FILTER (WHERE embedding IS NULL),
           COUNT(*)
    FROM public.tb_emop WHERE is_ativo = TRUE

    UNION ALL

    SELECT 'SCO'::text,
           COUNT(*) FILTER (WHERE embedding IS NULL),
           COUNT(*)
    FROM public.tb_sco WHERE is_ativo = TRUE
$$;

GRANT EXECUTE ON FUNCTION count_embeddings_pending()
    TO authenticated, anon;

-- ============================================================
-- FIM DA MIGRATION 002
-- ============================================================
