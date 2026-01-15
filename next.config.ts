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
        protocol: "https",
        hostname: "armapi2.qubyt.codes",
        port: "",
        pathname: "/**",
      },
    ],
  },
  env: {
    SA_LOGIN: process.env.SA_LOGIN,
  },
};

export default nextConfig;
