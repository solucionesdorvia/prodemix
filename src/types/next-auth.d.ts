import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string | null;
      role?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}
