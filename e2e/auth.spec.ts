import { expect, test } from "@playwright/test";

/**
 * Requiere base de datos y usuario de prueba:
 *   E2E_EMAIL=... E2E_PASSWORD=... npx playwright test e2e/auth.spec.ts
 */
const email = process.env.E2E_EMAIL?.trim();
const password = process.env.E2E_PASSWORD;

test.describe("auth E2E", () => {
  test("login → home o onboarding usuario", async ({ page }) => {
    test.skip(
      !email || !password,
      "Definí E2E_EMAIL y E2E_PASSWORD para correr este flujo.",
    );
    await page.goto("/login");
    await page.getByPlaceholder("vos@ejemplo.com").fill(email!);
    await page.getByPlaceholder("Mínimo 8 caracteres").first().fill(password!);
    await page.getByRole("button", { name: /^Entrar$/ }).click();
    await page.waitForURL(
      (url) =>
        url.pathname === "/" || url.pathname === "/onboarding/username",
      { timeout: 30_000 },
    );
    const path = new URL(page.url()).pathname;
    expect(["/", "/onboarding/username"]).toContain(path);
    if (path === "/onboarding/username") {
      await expect(
        page.getByRole("heading", { name: /Elegí tu usuario/i }),
      ).toBeVisible();
    } else {
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    }
  });
});
