/**
 * POST /api/etl/dcx
 *
 * Ingere um arquivo DCX (fixed-width) na tabela tb_dcx.
 *
 * Headers obrigatórios:
 *   x-etl-secret: <ETL_SECRET>
 *
 * Body (multipart/form-data):
 *   arquivo        File    — arquivo .DCX
 *   estado_uf      string? — ex: "RJ" (padrão = detectado do filename)
 *   mes_referencia string? — ex: "2025-01-01" (padrão = detectado do filename)
 */
import { jsonResponse, readUploadedFile, validateEtlSecret } from "../_lib/etl-request";
import { parseDcx } from "@/lib/etl/dcx-parser";
import { loadDcx } from "@/lib/etl/catalog-loader";

export async function POST(request: Request) {
  const authError = validateEtlSecret(request);
  if (authError) return authError;

  const fileResult = await readUploadedFile(request);
  if (fileResult instanceof Response) return fileResult;

  const { buffer, filename, formData } = fileResult;

  const estadoUf = formData.get("estado_uf")?.toString();
  const mesRef = formData.get("mes_referencia")?.toString();

  const { rows, result } = parseDcx(buffer, filename, {
    estado_uf: estadoUf,
    mes_referencia: mesRef,
  });

  if (rows.length === 0) {
    return jsonResponse({ ...result, inseridos: 0, atualizados: 0 });
  }

  const finalResult = await loadDcx(rows, result);
  return jsonResponse(finalResult);
}
