import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/prode/:id",
        destination: "/prodes/:id",
        permanent: false,
      },
      {
        source: "/crear",
        destination: "/prodes",
        permanent: false,
      },
      {
        source: "/torneos",
        destination: "/prodes",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
