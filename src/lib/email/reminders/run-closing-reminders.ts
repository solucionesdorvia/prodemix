import { getPrisma } from "@/lib/prisma";
import { sendProdeClosingReminderEmail } from "@/lib/email/send-prode-reminder";

export type ClosingReminderRunResult = {
  scannedProdes: number;
  emailsAttempted: number;
  emailsSent: number;
  skippedNoMatches: number;
  errors: string[];
};

/**
 * Finds OPEN prodes whose closesAt falls within the next REMINDER_WINDOW_HOURS (default 24),
 * and emails JOINED users who opted in (remindersEnabled + closingAlertEnabled),
 * have an email address, have not received this prode’s closing reminder yet,
 * and (for copy) whether predictions are incomplete vs match count.
 *
 * Idempotent per (userId, prodeId) via ProdeClosingReminderLog.
 */
export async function runClosingReminders(): Promise<ClosingReminderRunResult> {
  const prisma = getPrisma();
  const windowHours = Number(process.env.REMINDER_WINDOW_HOURS || "24");
  if (!Number.isFinite(windowHours) || windowHours <= 0) {
    return {
      scannedProdes: 0,
      emailsAttempted: 0,
      emailsSent: 0,
      skippedNoMatches: 0,
      errors: ["Invalid REMINDER_WINDOW_HOURS"],
    };
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + windowHours * 60 * 60 * 1000);

  const prodes = await prisma.prode.findMany({
    where: {
      status: "OPEN",
      closesAt: { gt: now, lte: horizon },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      closesAt: true,
      _count: { select: { prodeMatches: true } },
    },
  });

  let emailsAttempted = 0;
  let emailsSent = 0;
  let skippedNoMatches = 0;
  const errors: string[] = [];

  for (const prode of prodes) {
    if (prode._count.prodeMatches === 0) {
      skippedNoMatches++;
      continue;
    }

    const entries = await prisma.prodeEntry.findMany({
      where: {
        prodeId: prode.id,
        status: "JOINED",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            notificationPreference: true,
          },
        },
      },
    });

    const matchCount = prode._count.prodeMatches;

    for (const entry of entries) {
      const email = entry.user.email?.trim();
      if (!email) continue;

      const prefs = entry.user.notificationPreference;
      const optedIn =
        !prefs || (prefs.remindersEnabled && prefs.closingAlertEnabled);
      if (!optedIn) continue;

      const existing = await prisma.prodeClosingReminderLog.findUnique({
        where: {
          userId_prodeId: { userId: entry.userId, prodeId: prode.id },
        },
      });
      if (existing) continue;

      const predictionCount = await prisma.prediction.count({
        where: { userId: entry.userId, prodeId: prode.id },
      });
      const incomplete = predictionCount < matchCount;

      emailsAttempted++;
      const result = await sendProdeClosingReminderEmail({
        to: email,
        prodeTitle: prode.title,
        prodeSlug: prode.slug,
        closesAt: prode.closesAt,
        incomplete,
      });

      if (result.sent) {
        emailsSent++;
        try {
          await prisma.prodeClosingReminderLog.create({
            data: {
              userId: entry.userId,
              prodeId: prode.id,
            },
          });
        } catch (e) {
          errors.push(
            `log ${entry.userId.slice(0, 8)}…/${prode.slug}: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      } else {
        errors.push(`${email} · ${prode.slug}: ${result.error}`);
      }
    }
  }

  return {
    scannedProdes: prodes.length,
    emailsAttempted,
    emailsSent,
    skippedNoMatches,
    errors,
  };
}
