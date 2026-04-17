/**
 * POST /api/etl/emop
 *
 * Ingere um arquivo EMOP (XLS, XLSX ou DBF legado) na tabela tb_emop.
 *
 * Headers obrigatórios:
 *   x-etl-secret: <ETL_SECRET>
 *
 * Body (multipart/form-data):
 *   arquivo         File    — arquivo XLS/XLSX ou DBF
 *   mes_referencia  string? — ex: "2025-01-01"
 *   origem_legado   string? — "true" | "false" (detectado pela extensão .dbf se omitido)
 */
import { jsonResponse, readUploadedFile, validateEtlSecret } from "../_lib/etl-request";
import { parseEmop } from "@/lib/etl/emop-parser";
import { loadEmop } from "@/lib/etl/catalog-loader";

export async function POST(request: Request) {
  const authError = validateEtlSecret(request);
  if (authError) return authError;

  const fileResult = await readUploadedFile(request);
  if (fileResult instanceof Response) return fileResult;

  const { buffer, filename, formData } = fileResult;

  const origemLegadoRaw = formData.get("origem_legado")?.toString();
  const origemLegado = origemLegadoRaw !== undefined
    ? origemLegadoRaw === "true"
    : undefined;

  const { rows, result } = parseEmop(buffer, filename, {
    mes_referencia: formData.get("mes_referencia")?.toString(),
    origem_legado:  origemLegado,
  });

  if (rows.length === 0) {
    return jsonResponse({ ...result, inseridos: 0, atualizados: 0 });
  }

  const finalResult = await loadEmop(rows, result);
  return jsonResponse(finalResult);
}
