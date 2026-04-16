-- ============================================================
-- Migration: 001_initial_schema.sql
-- GovTables — Schema inicial: catálogos de preços públicos
-- Criado em: 2026-04-16
--
-- REGRA MONETÁRIA INVIOLÁVEL:
--   Valores de preço SEMPRE como NUMERIC(15,4).
--   Jamais FLOAT, DOUBLE PRECISION ou REAL.
--   Esta regra garante precisão centesimal exata nos catálogos
--   do governo (ex: R$ 1.234.567,8901).
-- ============================================================


-- ------------------------------------------------------------
-- EXTENSÕES
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";     -- pgvector: busca semântica
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- trigrama: busca fuzzy por texto


-- ------------------------------------------------------------
-- ENUM: tipo de item de catálogo
-- Compartilhado por todas as tabelas de catálogo
-- ------------------------------------------------------------
CREATE TYPE tipo_item AS ENUM (
    'insumo',               -- material, mão de obra ou equipamento unitário
    'composicao_analitica'  -- composição de custo (agrupa múltiplos insumos)
);


-- ------------------------------------------------------------
-- FUNÇÃO: atualização automática de updated_at
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


-- ============================================================
-- tb_catalogo_fontes
-- Registro central de todos os sistemas de custo suportados.
-- Projetado para expansão futura (ORSE, PINI, SEINFRA-CE, etc.)
-- sem necessidade de alterar o schema das tabelas de dados.
-- ============================================================
CREATE TABLE public.tb_catalogo_fontes (
    id            UUID         NOT NULL DEFAULT gen_random_uuid(),
    sigla         TEXT         NOT NULL,   -- ex: 'SINAPI', 'SICRO', 'EMOP', 'SCO'
    nome_completo TEXT         NOT NULL,
    orgao         TEXT         NOT NULL,   -- Órgão responsável
    escopo        TEXT         NOT NULL    -- 'NACIONAL', 'ESTADUAL', 'MUNICIPAL'
                               CHECK (escopo IN ('NACIONAL', 'ESTADUAL', 'MUNICIPAL')),
    uf_escopo     CHAR(2),                 -- NULL se nacional; ex: 'RJ' se estadual/municipal
    site_oficial  TEXT,
    is_ativo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT tb_catalogo_fontes_pkey    PRIMARY KEY (id),
    CONSTRAINT tb_catalogo_fontes_sigla   UNIQUE (sigla)
);

-- Seed das 4 fontes iniciais
INSERT INTO public.tb_catalogo_fontes
    (sigla, nome_completo, orgao, escopo, uf_escopo, site_oficial)
VALUES
    ('SINAPI',
     'Sistema Nacional de Pesquisa de Custos e Índices da Construção Civil',
     'Caixa Econômica Federal / IBGE',
     'NACIONAL', NULL,
     'https://www.caixa.gov.br/site/paginas/downloads.aspx'),
    ('SICRO',
     'Sistema de Custos Referenciais de Obras',
     'Departamento Nacional de Infraestrutura de Transportes (DNIT)',
     'NACIONAL', NULL,
     'https://www.gov.br/dnit/pt-br/assuntos/planejamento-e-pesquisa/custos-e-pagamentos/custos-e-pagamentos-dnit/sistemas-de-custos'),
    ('EMOP',
     'Tabela de Preços EMOP — Estado do Rio de Janeiro',
     'Empresa de Obras Públicas do Estado do Rio de Janeiro (EMOP)',
     'ESTADUAL', 'RJ',
     'https://www.emop.rj.gov.br'),
    ('SCO',
     'Sistema de Custos de Obras da Prefeitura do Rio de Janeiro',
     'Secretaria Municipal de Obras (SMO-Rio)',
     'MUNICIPAL', 'RJ',
     'https://www.rio.rj.gov.br/web/smo');


-- ============================================================
-- tb_sinapi
-- Sistema Nacional de Pesquisa de Custos e Índices (CEF/IBGE)
-- Escopo: Nacional, segregado por UF e regime tributário
-- ============================================================
CREATE TABLE public.tb_sinapi (
    id               UUID          NOT NULL DEFAULT gen_random_uuid(),
    codigo           TEXT          NOT NULL,
    descricao        TEXT          NOT NULL,
    descricao_longa  TEXT,
    unidade_medida   VARCHAR(20)   NOT NULL,

    -- NUNCA alterar o tipo abaixo. Ver regra monetária no cabeçalho.
    preco_unitario   NUMERIC(15,4) NOT NULL CHECK (preco_unitario >= 0),

    estado_uf        CHAR(2)       NOT NULL,  -- UF de referência (ex: 'RJ', 'SP')
    mes_referencia   DATE          NOT NULL,  -- Sempre 1º dia do mês (ex: 2025-01-01)
    tipo             tipo_item     NOT NULL,

    -- Classificação do insumo conforme taxonomia SINAPI
    classe           TEXT
                     CHECK (classe IN (
                         'MATERIAL',
                         'MAO_DE_OBRA',
                         'EQUIPAMENTO',
                         'SERVICO_TERCEIRIZADO',
                         'TRANSPORTE'
                     )),

    -- TRUE = com encargos sociais (regime tributário padrão)
    -- FALSE = sem desoneração da folha (Lei 12.546/2011)
    is_onerado       BOOLEAN       NOT NULL DEFAULT TRUE,

    is_ativo         BOOLEAN       NOT NULL DEFAULT TRUE,
    fonte_arquivo    TEXT,                   -- rastreabilidade ETL: nome do arquivo de origem
    embedding        vector(1536),           -- vetor semântico (OpenAI/Voyage text-embedding)

    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT tb_sinapi_pkey   PRIMARY KEY (id),
    -- Unicidade: mesmo código não pode aparecer duas vezes
    -- para a mesma UF, mês e regime tributário
    CONSTRAINT tb_sinapi_unique UNIQUE (codigo, estado_uf, mes_referencia, is_onerado)
);

-- Índices de consulta tb_sinapi
CREATE INDEX idx_sinapi_codigo
    ON public.tb_sinapi (codigo);

CREATE INDEX idx_sinapi_uf_mes
    ON public.tb_sinapi (estado_uf, mes_referencia DESC);

CREATE INDEX idx_sinapi_tipo
    ON public.tb_sinapi (tipo);

CREATE INDEX idx_sinapi_classe
    ON public.tb_sinapi (classe);

-- Índice trigrama para busca textual fuzzy (/catalogo/sinapi?q=...)
CREATE INDEX idx_sinapi_descricao_trgm
    ON public.tb_sinapi USING GIN (descricao gin_trgm_ops);

-- Índice HNSW para busca vetorial por similaridade coseno
CREATE INDEX idx_sinapi_embedding
    ON public.tb_sinapi USING hnsw (embedding vector_cosine_ops);

CREATE TRIGGER trg_sinapi_updated_at
    BEFORE UPDATE ON public.tb_sinapi
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ============================================================
-- tb_sicro
-- Sistema de Custos Referenciais de Obras (DNIT)
-- Escopo: Nacional — granularidade por macrorregião E por UF
-- Foco: Infraestrutura rodoviária, ferroviária, portuária
-- ============================================================
CREATE TABLE public.tb_sicro (
    id                   UUID          NOT NULL DEFAULT gen_random_uuid(),
    codigo               TEXT          NOT NULL,
    descricao            TEXT          NOT NULL,
    descricao_longa      TEXT,
    unidade_medida       VARCHAR(20)   NOT NULL,

    -- NUNCA alterar o tipo abaixo. Ver regra monetária no cabeçalho.
    preco_unitario       NUMERIC(15,4) NOT NULL CHECK (preco_unitario >= 0),

    -- Dupla granularidade geográfica (conforme decisão de projeto):
    -- Macrorregião DNIT (ex: 'SUDESTE') OU UF individual (ex: 'RJ')
    -- Ambos podem ser NULL simultaneamente apenas se o item for nacional sem distinção
    regiao_geografica    VARCHAR(30)
                         CHECK (regiao_geografica IN (
                             'NORTE', 'NORDESTE', 'CENTRO_OESTE', 'SUDESTE', 'SUL'
                         )),
    estado_uf            CHAR(2),               -- UF individual (ex: 'RJ', 'SP')

    mes_referencia       DATE          NOT NULL,
    tipo                 tipo_item     NOT NULL,

    -- Segmento de obra conforme estrutura do catálogo DNIT
    segmento             TEXT
                         CHECK (segmento IN (
                             'TERRAPLENAGEM',
                             'PAVIMENTACAO',
                             'DRENAGEM',
                             'OBRAS_DE_ARTE_ESPECIAIS',
                             'SINALIZACAO',
                             'OBRAS_COMPLEMENTARES',
                             'INSUMOS'
                         )),

    is_ativo             BOOLEAN       NOT NULL DEFAULT TRUE,
    fonte_arquivo        TEXT,
    embedding            vector(1536),

    created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT tb_sicro_pkey PRIMARY KEY (id)
);

-- Índice único funcional: trata NULLs via COALESCE para garantir
-- idempotência no ETL mesmo quando região ou UF são NULL
CREATE UNIQUE INDEX idx_sicro_unique
    ON public.tb_sicro (
        codigo,
        mes_referencia,
        COALESCE(regiao_geografica, ''),
        COALESCE(estado_uf, '')
    );

-- Índices de consulta tb_sicro
CREATE INDEX idx_sicro_codigo
    ON public.tb_sicro (codigo);

CREATE INDEX idx_sicro_regiao_mes
    ON public.tb_sicro (regiao_geografica, mes_referencia DESC);

CREATE INDEX idx_sicro_uf_mes
    ON public.tb_sicro (estado_uf, mes_referencia DESC);

CREATE INDEX idx_sicro_segmento
    ON public.tb_sicro (segmento);

CREATE INDEX idx_sicro_descricao_trgm
    ON public.tb_sicro USING GIN (descricao gin_trgm_ops);

CREATE INDEX idx_sicro_embedding
    ON public.tb_sicro USING hnsw (embedding vector_cosine_ops);

CREATE TRIGGER trg_sicro_updated_at
    BEFORE UPDATE ON public.tb_sicro
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ============================================================
-- tb_emop
-- Empresa de Obras Públicas do Estado do Rio de Janeiro (EMOP)
-- Escopo: Estado do RJ
-- Histórico: dados legados em formato DBF (sistema SIPCI)
-- ============================================================
CREATE TABLE public.tb_emop (
    id               UUID          NOT NULL DEFAULT gen_random_uuid(),
    codigo           TEXT          NOT NULL,
    descricao        TEXT          NOT NULL,
    descricao_longa  TEXT,
    unidade_medida   VARCHAR(20)   NOT NULL,

    -- NUNCA alterar o tipo abaixo. Ver regra monetária no cabeçalho.
    preco_unitario   NUMERIC(15,4) NOT NULL CHECK (preco_unitario >= 0),

    mes_referencia   DATE          NOT NULL,
    tipo             tipo_item     NOT NULL,

    -- Hierarquia do catálogo EMOP (dois níveis)
    capitulo         TEXT,         -- ex: '01 - SERVICOS PRELIMINARES'
    subcapitulo      TEXT,         -- ex: '01.01 - LIMPEZA E PREPARO DO TERRENO'

    -- Sinaliza itens migrados de arquivos DBF legados (sistema SIPCI)
    -- Permite rastrear qualidade da migração e aplicar tratamentos especiais
    origem_legado    BOOLEAN       NOT NULL DEFAULT FALSE,

    is_ativo         BOOLEAN       NOT NULL DEFAULT TRUE,
    fonte_arquivo    TEXT,
    embedding        vector(1536),

    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT tb_emop_pkey   PRIMARY KEY (id),
    CONSTRAINT tb_emop_unique UNIQUE (codigo, mes_referencia)
);

-- Índices de consulta tb_emop
CREATE INDEX idx_emop_codigo
    ON public.tb_emop (codigo);

CREATE INDEX idx_emop_mes
    ON public.tb_emop (mes_referencia DESC);

CREATE INDEX idx_emop_capitulo
    ON public.tb_emop (capitulo);

CREATE INDEX idx_emop_legado
    ON public.tb_emop (origem_legado) WHERE origem_legado = TRUE;

CREATE INDEX idx_emop_descricao_trgm
    ON public.tb_emop USING GIN (descricao gin_trgm_ops);

CREATE INDEX idx_emop_embedding
    ON public.tb_emop USING hnsw (embedding vector_cosine_ops);

CREATE TRIGGER trg_emop_updated_at
    BEFORE UPDATE ON public.tb_emop
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ============================================================
-- tb_sco
-- Sistema de Custos de Obras da Prefeitura do Rio de Janeiro
-- Escopo: Município do Rio de Janeiro (SMO-Rio)
-- ============================================================
CREATE TABLE public.tb_sco (
    id               UUID          NOT NULL DEFAULT gen_random_uuid(),
    codigo           TEXT          NOT NULL,
    descricao        TEXT          NOT NULL,
    descricao_longa  TEXT,
    unidade_medida   VARCHAR(20)   NOT NULL,

    -- NUNCA alterar o tipo abaixo. Ver regra monetária no cabeçalho.
    preco_unitario   NUMERIC(15,4) NOT NULL CHECK (preco_unitario >= 0),

    mes_referencia   DATE          NOT NULL,
    tipo             tipo_item     NOT NULL,

    -- Hierarquia do catálogo SCO-Rio (dois níveis)
    grupo            TEXT,         -- ex: '1 - SERVICOS GERAIS'
    subgrupo         TEXT,         -- ex: '1.1 - PREPARACAO DO TERRENO'

    is_ativo         BOOLEAN       NOT NULL DEFAULT TRUE,
    fonte_arquivo    TEXT,
    embedding        vector(1536),

    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT tb_sco_pkey   PRIMARY KEY (id),
    CONSTRAINT tb_sco_unique UNIQUE (codigo, mes_referencia)
);

-- Índices de consulta tb_sco
CREATE INDEX idx_sco_codigo
    ON public.tb_sco (codigo);

CREATE INDEX idx_sco_mes
    ON public.tb_sco (mes_referencia DESC);

CREATE INDEX idx_sco_grupo
    ON public.tb_sco (grupo);

CREATE INDEX idx_sco_descricao_trgm
    ON public.tb_sco USING GIN (descricao gin_trgm_ops);

CREATE INDEX idx_sco_embedding
    ON public.tb_sco USING hnsw (embedding vector_cosine_ops);

CREATE TRIGGER trg_sco_updated_at
    BEFORE UPDATE ON public.tb_sco
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
--
-- Política de segurança:
--   LEITURA: pública (catálogos de preços são dados públicos)
--   ESCRITA:  reservada ao service_role (ETL backend via Supabase Admin)
--             O service_role bypassa RLS por padrão — registrado aqui
--             como documentação explícita da intenção de segurança.
--             Nenhuma role de usuário final possui permissão de escrita.
-- ============================================================
ALTER TABLE public.tb_catalogo_fontes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_sinapi          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_sicro           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_emop            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_sco             ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública (authenticated + anon)
CREATE POLICY "catalogo_fontes_leitura_publica"
    ON public.tb_catalogo_fontes FOR SELECT USING (true);

CREATE POLICY "sinapi_leitura_publica"
    ON public.tb_sinapi FOR SELECT USING (true);

CREATE POLICY "sicro_leitura_publica"
    ON public.tb_sicro FOR SELECT USING (true);

CREATE POLICY "emop_leitura_publica"
    ON public.tb_emop FOR SELECT USING (true);

CREATE POLICY "sco_leitura_publica"
    ON public.tb_sco FOR SELECT USING (true);

-- Políticas de escrita: NENHUMA para roles de usuário.
-- INSERT/UPDATE/DELETE só via service_role (key de servidor).
-- Qualquer tentativa de escrita por anon/authenticated será bloqueada por RLS.


-- ============================================================
-- FIM DA MIGRATION 001
-- ============================================================
