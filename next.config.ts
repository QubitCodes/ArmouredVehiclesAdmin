import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "armored-api.qubyt.codes",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "armapi.qubyt.codes",
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
