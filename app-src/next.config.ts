import type { NextConfig } from "next";

const securityHeaders = [
  // Bloqueia framing da página (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Impede MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referrer estrito para não vazar URL internos
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desativa features sensíveis de browser não utilizadas
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // HSTS — força HTTPS por 1 ano (ativar só em produção com domínio próprio)
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // Rotas ETL ficam em /api/etl/* — não precisam de resposta rápida
  // maxDuration é configurado via vercel.json por rota

  async headers() {
    return [
      {
        // Aplica headers de segurança em todas as rotas
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // API routes: sem cache por padrão (dados mudam com ingestão)
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        // Busca semântica: cache curto (30s) para queries repetidas
        source: "/api/search",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=30, stale-while-revalidate=60" },
        ],
      },
    ];
  },

  // Suprime avisos de hydration em dev ao usar dados do banco
  reactStrictMode: true,

  // Exclui arquivos de ETL do bundle do cliente (segurança)
  serverExternalPackages: ["xlsx"],
};

export default nextConfig;
