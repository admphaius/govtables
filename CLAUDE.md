# CLAUDE.md — GovTables Platform

## Contexto do Projeto
Plataforma web Cloud-Native para orçamentação de obras públicas.
Consolida e expõe catálogos de preços dos sistemas SINAPI, SICRO, EMOP-RJ e SCO-Rio
com busca semântica (pgvector) e UI dashboard orientada a dados.

## Stack Tecnológica

| Camada       | Tecnologia                          | Versão  |
|--------------|-------------------------------------|---------|
| Frontend     | Next.js (App Router)                | 15.x    |
| Estilização  | Tailwind CSS (engine CSS-first)     | v4.x    |
| Componentes  | Shadcn UI + Radix UI                | latest  |
| Banco        | Supabase (PostgreSQL)               | 15.x    |
| Vetores      | pgvector                            | 0.7.x   |
| Deploy App   | Vercel                              |         |
| Deploy DB    | Supabase Cloud                      |         |
| Linguagem    | TypeScript                          | 5.x     |

## Estrutura de Diretórios

```
d:/GovTables/
├── CLAUDE.md                     # Este arquivo — lido a cada sessão
├── supabase/                     # Supabase CLI (migrations, functions, config)
│   ├── migrations/               # SQL migrations imutáveis após aplicadas
│   ├── functions/                # Edge Functions (embed, webhooks)
│   └── config.toml               # Configuração Supabase CLI
└── app-src/                      # Aplicação Next.js 15
    └── src/
        ├── app/                  # App Router (rotas, layouts, pages)
        │   ├── (auth)/           # Grupo de rotas autenticadas
        │   ├── (public)/         # Rotas públicas
        │   ├── api/              # API Routes (ETL, ingestão)
        │   └── globals.css       # Design tokens CSS variables
        ├── components/
        │   ├── ui/               # Shadcn UI (gerados — não editar manualmente)
        │   ├── govtech/          # Design System próprio (GlassPanel, BentoGrid, KPICard)
        │   └── charts/           # Visualização de dados
        ├── lib/
        │   ├── supabase/         # Clientes browser/server/admin + tipos gerados
        │   ├── etl/              # Parsers e pipeline de ingestão (XLS, DBF, PDF)
        │   └── utils/            # Helpers gerais
        └── types/                # Tipos TypeScript globais
```

## Regras de Nomenclatura

- **Componentes React**: PascalCase → `GlassPanel.tsx`, `KPICard.tsx`
- **Utilitários/lib**: kebab-case → `supabase-client.ts`, `sinapi-parser.ts`
- **Tabelas do banco**: snake_case prefixo `tb_` → `tb_sinapi`, `tb_sicro`
- **Migrations**: `{NNN}_{descricao_snake}.sql` → `001_initial_schema.sql`
- **Edge Functions**: kebab-case → `embed-catalog-items`
- **Variáveis de ambiente**: SCREAMING_SNAKE_CASE → `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Rotas Next.js**: kebab-case → `/catalogo/sinapi`, `/comparativo`

## Regras Críticas de Negócio

### Monetário (INVIOLÁVEL)
- Valores monetários SEMPRE em `NUMERIC(15,4)` no PostgreSQL
- NUNCA usar `FLOAT`, `DOUBLE PRECISION` ou `REAL` para preços
- NUNCA arredondar preços na camada de aplicação — exibir com precisão original
- No TypeScript, valores monetários recebidos do banco são `string` (Supabase retorna
  NUMERIC como string). Para cálculos, usar `decimal.js`. NUNCA usar `number` nativo.

### Banco de Dados
- Migrations são imutáveis após aplicadas em produção. Para alterar: nova migration
- Testar RLS policies localmente (ou em branch Supabase) antes de push para produção
- `updated_at` é gerenciado por trigger automático — não atualizar manualmente na app
- Novos sistemas de custo (ex: ORSE, PINI) exigem apenas: (1) entrada em `tb_catalogo_fontes`
  e (2) nova tabela de dados seguindo o padrão das tabelas existentes

### Comandos Que Exigem Aprovação Explícita do Usuário
- `supabase db reset` (destrói dados locais/branch)
- `DROP TABLE`, `TRUNCATE` em qualquer ambiente
- `git push --force` em qualquer branch
- Qualquer operação com flag `--destructive`
- Push para produção Supabase (`supabase db push` apontando para prod)

## Scripts Principais

```bash
# Ambiente (executar na raiz d:/GovTables)
export PATH="/c/tools/supabase:$PATH"   # Supabase CLI (instalado em /c/tools/supabase)

# Desenvolvimento Next.js (em app-src/)
npm run dev                              # Dev server em localhost:3000
npm run build                            # Build de produção
npm run lint                             # ESLint + TypeScript check

# Banco de dados (em d:/GovTables — onde está supabase/)
supabase login                           # Autenticar na conta Supabase
supabase link --project-ref <REF>        # Vincular ao projeto remoto
supabase migration new <nome>            # Criar nova migration vazia
supabase db push                         # Aplicar migrations no remoto (REQUER APROVAÇÃO)
supabase gen types typescript \
  --project-id <REF> \
  > app-src/src/types/supabase.ts        # Regenerar tipos TypeScript
```

## Design System — Tokens Principais

| Token            | Valor           | Uso                          |
|------------------|-----------------|------------------------------|
| `--color-bg`     | `#0a0f1e`       | Fundo principal (dark)       |
| `--color-surface`| `#111827`       | Cards, painéis               |
| `--color-baltic` | `#1e40af`       | Azul Baltic (primário)       |
| `--color-accent` | `#22d3ee`       | Cyan accent (KPIs, alertas)  |
| `--color-border` | `rgba(255,255,255,0.08)` | Bordas glassmorphism |
| `--font-sans`    | `Inter`         | Corpo e UI                   |

## Catálogos de Preços Suportados

| Sistema  | Órgão             | Escopo        | Formato Original     | Periodicidade |
|----------|-------------------|---------------|----------------------|---------------|
| SINAPI   | CEF / IBGE        | Nacional/UF   | XLS / API            | Mensal        |
| SICRO    | DNIT              | Nacional/UF   | XLS / PDF            | Semestral     |
| EMOP-RJ  | EMOP / SEINFRA-RJ | Estado RJ     | DBF legacy / XLS     | Mensal        |
| SCO-Rio  | SMO-Rio           | Município RJ  | XLS / PDF            | Mensal        |

## Estado Atual do Projeto

| Fase | Status       | Descrição                                       |
|------|--------------|-------------------------------------------------|
| 0    | ✅ Completo  | CLAUDE.md criado, Next.js scaffolded, Supabase init |
| 1    | ✅ Completo  | Migration 001 aplicada no remoto, tipos gerados, clientes Supabase criados |
| 2    | ✅ Completo  | Tailwind v4 confirmado, Shadcn UI (base-nova) instalado, 13 componentes |
| 3    | ✅ Completo  | Design System: GlassPanel, BentoGrid, KPICard, globals.css GovTech      |
| 4    | ✅ Completo  | Dashboard, 4 páginas de catálogo, Sidebar, AppShell, CatalogTable |
| 5    | ✅ Completo  | ETL Foundation: parsers SINAPI/SICRO/EMOP/SCO, catalog-loader, 4 API routes |
| 6    | ✅ Completo  | Busca semântica: migration RPC, embeddings client, Edge Function, API /search, página /busca |
| 7    | ✅ Completo  | vercel.json, next.config.ts (headers), .env.example, CI workflow, migrate workflow |

## Deploy — Checklist Inicial

### 1. Repositório GitHub
```bash
git init && git add . && git commit -m "feat: initial govtables platform"
git remote add origin https://github.com/<user>/govtables.git
git push -u origin main
```

### 2. Secrets do repositório GitHub
Configurar em: **Settings → Secrets and variables → Actions**
| Secret | Onde obter |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | supabase.com/dashboard/account/tokens |
| `SUPABASE_PROJECT_REF` | supabase.com/dashboard/project/<ref> |
| `SUPABASE_DB_PASSWORD` | Supabase → Settings → Database |
| `OPENAI_API_KEY` | platform.openai.com/api-keys |

### 3. Vercel
1. Importar repositório em vercel.com/new
2. **Root Directory**: `app-src`
3. Adicionar variáveis de ambiente (copiar de `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `ETL_SECRET`

### 4. Supabase — primeiro push manual
```bash
export PATH="/c/tools/supabase:$PATH"
supabase login
supabase link --project-ref <REF>
supabase db push          # aplica migrations 001 + 002
supabase functions deploy embed-catalog-items --project-ref <REF>
```

### 5. Regenerar tipos após novas migrations
```bash
supabase gen types typescript \
  --project-id <REF> \
  > app-src/src/types/supabase.ts
```

## Ambiente Local

- **OS**: Windows 11
- **Shell**: Bash (via VS Code / Claude Code)
- **Node**: v24.13.1 | **npm**: 11.8.0
- **Supabase CLI**: 2.90.0 (binário em `/c/tools/supabase/`)
- **Docker**: NÃO instalado — usar Supabase remoto (branches para dev/staging)
- **Next.js app**: `d:/GovTables/app-src/`
- **Supabase config**: `d:/GovTables/supabase/`
