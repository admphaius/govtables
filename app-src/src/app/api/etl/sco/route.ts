/**
 * POST /api/etl/sco
 *
 * Ingere um arquivo SCO-Rio (XLS ou XLSX) na tabela tb_sco.
 *
 * Headers obrigatórios:
 *   x-etl-secret: <ETL_SECRET>
 *
 * Body (multipart/form-data):
 *   arquivo         File    — arquivo XLS/XLSX
 *   mes_referencia  string? — ex: "2025-01-01"
 */
import { jsonResponse, readUploadedFile, validateEtlSecret } from "../_lib/etl-request";
import { parseSco } from "@/lib/etl/sco-parser";
import { loadSco } from "@/lib/etl/catalog-loader";

export async function POST(request: Request) {
  const authError = validateEtlSecret(request);
  if (authError) return authError;

  const fileResult = await readUploadedFile(request);
  if (fileResult instanceof Response) return fileResult;

  const { buffer, filename, formData } = fileResult;

  const { rows, result } = parseSco(buffer, filename, {
    mes_referencia: formData.get("mes_referencia")?.toString(),
  });

  if (rows.length === 0) {
    return jsonResponse({ ...result, inseridos: 0, atualizados: 0 });
  }

  const finalResult = await loadSco(rows, result);
  return jsonResponse(finalResult);
}
