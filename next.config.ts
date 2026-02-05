import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_API_BASE_URL ?? "armapi2.qubyt.codes",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "armapi.qubyt.codes",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3002",
        pathname: "/**",
      },
    ],
    unoptimized: true,
  },
  env: {
    SA_LOGIN: process.env.SA_LOGIN,
  },
};

export default nextConfig;
