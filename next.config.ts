import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // librerie native o con file di dati: restano fuori dal bundle
  serverExternalPackages: ["pdfkit", "@resvg/resvg-js", "sharp", "opentype.js"],
  // i font servono anche alle funzioni del server (anteprime, PDF, JPG)
  outputFileTracingIncludes: { "/**": ["./public/fonts/**", "./node_modules/pdfkit/js/data/**"] },
};

export default nextConfig;
