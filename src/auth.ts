/**
 * Auth.js (NextAuth v5) — sesión en base de datos (cookies HTTP-only).
 *
 * Variables (ver `.env.example`):
 * - AUTH_SECRET — openssl rand -base64 32
 * - AUTH_URL o NEXTAUTH_URL — URL pública (ej. http://localhost:3000)
 * - DATABASE_URL — Postgres
 * - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET — OAuth Google (opcional)
 * - EMAIL_SERVER + EMAIL_FROM — enlace mágico por correo (opcional; Nodemailer)
 */
import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import Credentials from "next-auth/providers/credentials";

import { logStructured } from "@/lib/observability";
import { verifyPassword } from "@/lib/auth/password";
import { getPrisma } from "@/lib/prisma";

const providers: Provider[] = [
  Credentials({
    id: "credentials",
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Contraseña", type: "password" },
    },
    async authorize(credentials) {
      const emailRaw = credentials?.email;
      const password = credentials?.password;
      const email =
        typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
      if (!email || typeof password !== "string" || !password) return null;

      const prisma = getPrisma();
      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (!user?.passwordHash || user.bannedAt) return null;
      const ok = await verifyPassword(password, user.passwordHash);
      if (!ok) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
  providers.push(
    Nodemailer({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  );
}

const isProd = process.env.NODE_ENV === "production";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(getPrisma()),
  providers,
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  /** HTTPS-only cookies in production (localhost stays http in dev). */
  useSecureCookies: isProd,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        const u = user as unknown as {
          id: string;
          name: string | null;
          image: string | null;
          username: string | null;
        };
        session.user.id = u.id;
        session.user.name = u.name;
        session.user.image = u.image;
        session.user.username = u.username ?? null;
      }
      return session;
    },
  },
  events: {
    signIn({ account, isNewUser }) {
      logStructured("auth.sign_in", {
        provider: account?.provider ?? "unknown",
        isNewUser: Boolean(isNewUser),
      });
    },
    signOut(message) {
      logStructured("auth.sign_out", {
        sessionKind: "session" in message ? "database" : "jwt",
      });
    },
  },
});
