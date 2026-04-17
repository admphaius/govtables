/**
 * POST /api/etl/sinapi
 *
 * Ingere um arquivo SINAPI (XLS ou XLSX) na tabela tb_sinapi.
 *
 * Headers obrigatórios:
 *   x-etl-secret: <ETL_SECRET>
 *
 * Body (multipart/form-data):
 *   arquivo        File    — arquivo XLS/XLSX
 *   estado_uf      string? — ex: "RJ" (detectado do filename se omitido)
 *   mes_referencia string? — ex: "2025-01-01" (detectado do filename se omitido)
 *   is_onerado     string? — "true" | "false" (detectado do filename se omitido)
 */
import { jsonResponse, readUploadedFile, validateEtlSecret } from "../_lib/etl-request";
import { parseSinapi } from "@/lib/etl/sinapi-parser";
import { loadSinapi } from "@/lib/etl/catalog-loader";

export async function POST(request: Request) {
  const authError = validateEtlSecret(request);
  if (authError) return authError;

  const fileResult = await readUploadedFile(request);
  if (fileResult instanceof Response) return fileResult;

  const { buffer, filename, formData } = fileResult;

  const estadoUf      = formData.get("estado_uf")?.toString();
  const mesRef        = formData.get("mes_referencia")?.toString();
  const isOneradoRaw  = formData.get("is_onerado")?.toString();
  const isOnerado     = isOneradoRaw !== undefined
    ? isOneradoRaw === "true"
    : undefined;

  const { rows, result } = parseSinapi(buffer, filename, {
    estado_uf:      estadoUf,
    mes_referencia: mesRef,
    is_onerado:     isOnerado,
  });

  if (rows.length === 0) {
    return jsonResponse({ ...result, inseridos: 0, atualizados: 0 });
  }

  const finalResult = await loadSinapi(rows, result);
  return jsonResponse(finalResult);
}
