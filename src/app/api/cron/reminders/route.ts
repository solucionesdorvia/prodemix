import { NextResponse } from "next/server";

import { runClosingReminders } from "@/lib/email/reminders/run-closing-reminders";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Scheduled job entrypoint (e.g. Vercel Cron, GitHub Actions, or system cron).
 * Protect with CRON_SECRET: `Authorization: Bearer <CRON_SECRET>` or `?secret=<CRON_SECRET>`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: { message: "CRON_SECRET is not configured." } },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization");
  const bearerOk = auth === `Bearer ${secret}`;
  const url = new URL(request.url);
  const queryOk = url.searchParams.get("secret") === secret;
  if (!bearerOk && !queryOk) {
    return NextResponse.json(
      { error: { message: "Unauthorized." } },
      { status: 401 },
    );
  }

  const result = await runClosingReminders();
  return NextResponse.json({ ok: true, result });
}
