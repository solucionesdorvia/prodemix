import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { apiError } from "@/lib/api-errors";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_BYTES = 512 * 1024;

function detectMime(
  buf: Buffer,
): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

/** Subida de foto de perfil (multipart, campo `file`). Se guarda como data URL en `User.image`. */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return apiError(401, "UNAUTHORIZED", "Authentication required.");
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return apiError(400, "INVALID_DATA", "Body inválido.");
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return apiError(400, "INVALID_DATA", "Falta el archivo (campo file).");
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0 || buf.length > MAX_BYTES) {
    return apiError(
      413,
      "INVALID_DATA",
      "La imagen debe ser menor a 512 KB.",
    );
  }

  const mime = detectMime(buf);
  if (!mime) {
    return apiError(422, "INVALID_DATA", "Usá JPEG, PNG o WebP.");
  }

  const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;

  const prisma = getPrisma();
  await prisma.user.update({
    where: { id: userId },
    data: { image: dataUrl },
  });

  return NextResponse.json({ ok: true, image: dataUrl });
}
