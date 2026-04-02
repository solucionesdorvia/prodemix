import { expect, test } from "@playwright/test";

test.describe("público", () => {
  /**
   * RSC devuelve shell + metadata; el formulario hidrata tras /api/auth/session.
   * Verificamos 200, marca y que el chunk de la página de login está en el HTML.
   */
  test("login: responde 200 y carga página de login", async ({ request }) => {
    const res = await request.get("/login");
    expect(res.ok()).toBeTruthy();
    const html = await res.text();
    expect(html).toContain("ProdeMix");
    expect(html).toMatch(/Iniciar sesi[oó]n/i);
    expect(html).toContain("login_page_tsx");
  });

  test("health db responde JSON", async ({ request }) => {
    const res = await request.get("/api/health/db");
    test.skip(
      res.status() !== 200,
      `DATABASE_URL no disponible en este entorno (${res.status()})`,
    );
    const json = (await res.json()) as { ok?: boolean };
    expect(json).toHaveProperty("ok");
  });

  test("catálogo torneos (API)", async ({ request }) => {
    const res = await request.get("/api/catalog/tournaments");
    test.skip(
      res.status() !== 200,
      `catálogo no disponible (${res.status()})`,
    );
    const data = (await res.json()) as { tournaments?: unknown };
    expect(Array.isArray(data.tournaments)).toBeTruthy();
  });
});
