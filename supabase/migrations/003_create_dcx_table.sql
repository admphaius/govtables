-- ================================================================
-- Migration 003: Criar tabela tb_dcx (arquivos DCX - EMOP/RJ)
-- ================================================================

CREATE TABLE tb_dcx (
  id BIGSERIAL PRIMARY KEY,

  -- Identificação do item
  codigo TEXT NOT NULL,
  descricao TEXT NOT NULL,

  -- Precificação (inviolável)
  unidade_medida VARCHAR(20) DEFAULT 'UN',
  preco_unitario NUMERIC(15,4) NOT NULL,

  -- Localização e data
  estado_uf CHAR(2) NOT NULL DEFAULT 'RJ',
  mes_referencia DATE NOT NULL,

  -- Busca semântica (pgvector)
  embedding vector(1536),

  -- Auditoria
  is_ativo BOOLEAN DEFAULT TRUE,
  fonte_arquivo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint: unicidade por código + estado + data
  UNIQUE(codigo, estado_uf, mes_referencia)
);

-- Índices para performance
CREATE INDEX idx_dcx_codigo ON tb_dcx(codigo);
CREATE INDEX idx_dcx_estado_uf ON tb_dcx(estado_uf);
CREATE INDEX idx_dcx_mes_referencia ON tb_dcx(mes_referencia);
CREATE INDEX idx_dcx_embedding ON tb_dcx USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER trigger_dcx_updated_at
BEFORE UPDATE ON tb_dcx
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_on_row();

-- RLS: tabela é pública de leitura (dados são públicos)
ALTER TABLE tb_dcx ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tb_dcx_select_public" ON tb_dcx
  FOR SELECT USING (true);

CREATE POLICY "tb_dcx_insert_authenticated" ON tb_dcx
  FOR INSERT WITH CHECK (true);

CREATE POLICY "tb_dcx_update_authenticated" ON tb_dcx
  FOR UPDATE USING (true) WITH CHECK (true);
