/**
 * Envía una vista previa del mail de “aviso de cierre de prode” (misma plantilla que el cron).
 * Requiere EMAIL_FROM y (RESEND_API_KEY o EMAIL_SERVER).
 *
 * Uso:
 *   npx tsx scripts/send-test-email.ts
 *   npx tsx scripts/send-test-email.ts destino@correo.com
 *   npx tsx scripts/send-test-email.ts destino@correo.com "Nombre del torneo"
 */
import "dotenv/config";

import { sendProdeClosingReminderEmail } from "../src/lib/email/send-prode-reminder";

const to = process.argv[2] ?? "solucionesdorvia@gmail.com";
const prodeTitle = process.argv[3] ?? "Copa de ejemplo 2026";

async function main() {
  const closesAt = new Date(Date.now() + 36 * 60 * 60 * 1000);

  const result = await sendProdeClosingReminderEmail({
    to,
    prodeTitle,
    prodeSlug: "preview-ejemplo",
    closesAt,
    incomplete: true,
  });

  if (result.sent) {
    console.log(`OK: enviado a ${to} (torneo: «${prodeTitle}»)`);
    process.exit(0);
  }
  console.error("Error:", result.error);
  process.exit(1);
}

void main();
