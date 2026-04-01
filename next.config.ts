import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/prode/:id",
        destination: "/prodes/:id",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
