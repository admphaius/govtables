/**
 * Cliente de embeddings — OpenAI text-embedding-3-small
 *
 * Produz vetores de 1536 dimensões, compatíveis com o schema vector(1536).
 * Uso exclusivo server-side (API Key nunca exposta ao cliente).
 *
 * Preço: ~$0.02 / 1M tokens (2025-04). Para catálogos com ~100k itens,
 * estimativa de custo inicial de embedding: < US$2.
 */

const OPENAI_EMBED_URL = "https://api.openai.com/v1/embeddings";
const EMBED_MODEL = "text-embedding-3-small";
const EMBED_DIMENSIONS = 1536;
const BATCH_SIZE = 100; // OpenAI aceita até 2048 inputs por chamada

export type EmbeddingVector = number[];

export interface EmbedBatchResult {
  embeddings: EmbeddingVector[];
  tokens_used: number;
}

/**
 * Gera embeddings para um array de textos.
 * Textos são trunados em 8192 tokens (limite do modelo).
 */
export async function embedTexts(texts: string[]): Promise<EmbedBatchResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("[govtables] OPENAI_API_KEY não configurada.");
  }

  const allEmbeddings: EmbeddingVector[] = [];
  let totalTokens = 0;

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const response = await fetch(OPENAI_EMBED_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: EMBED_MODEL,
        input: batch,
        dimensions: EMBED_DIMENSIONS,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI embeddings API error ${response.status}: ${err}`);
    }

    const json = (await response.json()) as {
      data: { embedding: number[]; index: number }[];
      usage: { total_tokens: number };
    };

    // Garante a ordem correta (API retorna ordenado por index)
    const sorted = json.data.sort((a, b) => a.index - b.index);
    allEmbeddings.push(...sorted.map((d) => d.embedding));
    totalTokens += json.usage.total_tokens;
  }

  return { embeddings: allEmbeddings, tokens_used: totalTokens };
}

/**
 * Gera embedding para uma única query de busca.
 */
export async function embedQuery(query: string): Promise<EmbeddingVector> {
  const { embeddings } = await embedTexts([query]);
  return embeddings[0];
}

/**
 * Formata o texto de um item de catálogo para embedding.
 * Combina código + descrição para melhor recall semântico.
 */
export function buildEmbedText(codigo: string, descricao: string, extra?: string): string {
  const parts = [`[${codigo}]`, descricao];
  if (extra) parts.push(extra);
  return parts.join(" ").slice(0, 8000); // margem de segurança
}
