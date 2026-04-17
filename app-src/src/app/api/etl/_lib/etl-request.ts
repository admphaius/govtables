/**
 * Utilitários compartilhados para as API Routes de ETL.
 *
 * Autenticação: todas as rotas exigem o header `x-etl-secret`
 * com o valor de ETL_SECRET definido nas variáveis de ambiente.
 *
 * Uso exclusivo server-side — jamais importar em Client Components.
 */

export function validateEtlSecret(request: Request): Response | null {
  const secret = process.env.ETL_SECRET;
  if (!secret) {
    return new Response(
      JSON.stringify({ error: "ETL_SECRET não configurado no servidor." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const provided = request.headers.get("x-etl-secret");
  if (provided !== secret) {
    return new Response(
      JSON.stringify({ error: "Não autorizado." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  return null; // sem erro
}

/** Lê o arquivo do FormData e retorna Buffer + nome. */
export async function readUploadedFile(
  request: Request
): Promise<{ buffer: Buffer; filename: string; formData: FormData } | Response> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(
      JSON.stringify({ error: "Corpo da requisição inválido. Esperado multipart/form-data." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const file = formData.get("arquivo");
  if (!(file instanceof File)) {
    return new Response(
      JSON.stringify({ error: 'Campo "arquivo" ausente ou inválido.' }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return { buffer, filename: file.name, formData };
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
