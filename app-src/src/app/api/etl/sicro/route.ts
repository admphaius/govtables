/**
 * POST /api/etl/sicro
 *
 * Ingere um arquivo SICRO (XLS ou XLSX) na tabela tb_sicro.
 *
 * Headers obrigatórios:
 *   x-etl-secret: <ETL_SECRET>
 *
 * Body (multipart/form-data):
 *   arquivo            File    — arquivo XLS/XLSX
 *   mes_referencia     string? — ex: "2025-01-01"
 *   regiao_geografica  string? — ex: "SUDESTE"
 *   estado_uf          string? — ex: "RJ"
 */
import { jsonResponse, readUploadedFile, validateEtlSecret } from "../_lib/etl-request";
import { parseSicro } from "@/lib/etl/sicro-parser";
import { loadSicro } from "@/lib/etl/catalog-loader";

export async function POST(request: Request) {
  const authError = validateEtlSecret(request);
  if (authError) return authError;

  const fileResult = await readUploadedFile(request);
  if (fileResult instanceof Response) return fileResult;

  const { buffer, filename, formData } = fileResult;

  const { rows, result } = parseSicro(buffer, filename, {
    mes_referencia:    formData.get("mes_referencia")?.toString(),
    regiao_geografica: formData.get("regiao_geografica")?.toString(),
    estado_uf:         formData.get("estado_uf")?.toString(),
  });

  if (rows.length === 0) {
    return jsonResponse({ ...result, inseridos: 0, atualizados: 0 });
  }

  const finalResult = await loadSicro(rows, result);
  return jsonResponse(finalResult);
}
