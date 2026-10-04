import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const themeRoot = path.resolve(here, "..");
const workspace = path.resolve(themeRoot, "..");
const require = createRequire(import.meta.url);
const playwrightPackage =
  process.env.PLAYWRIGHT_PACKAGE_PATH ??
  path.join(workspace, "LibreChat-portal/node_modules/playwright");
const { chromium } = require(playwrightPackage);

const origin = process.env.KEYCLOAK_PRODUCTION_ORIGIN ?? "http://demo.uhoo.cn:9433";
const authUrl =
  `${origin}/realms/enterprise-ai/protocol/openid-connect/auth` +
  "?client_id=librechat" +
  `&redirect_uri=${encodeURIComponent(`${origin}/oauth/openid/callback`)}` +
  "&response_type=code&scope=openid";

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  const response = await page.goto(authUrl, { waitUntil: "networkidle" });
  assert.equal(response?.status(), 200);
  await page.locator("#kc-login").waitFor();
  assert.equal(await page.locator(".xz-bento-card").count(), 4);
  assert.match(await page.locator(".xz-showcase").innerText(), /应用、知识与数据/);
  assert.equal(await page.locator("#username").getAttribute("placeholder"), "请输入登录账号");
  assert.equal(await page.locator("#password").getAttribute("placeholder"), "请输入登录密码");
  const passwordGroup = page
    .locator("#password")
    .locator(
      "xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' pf-v5-c-input-group ')][1]",
    );
  await page.locator("#username").evaluate((element) => element.blur());
  await page.waitForTimeout(200);
  assert.equal(
    await passwordGroup.evaluate((element) => getComputedStyle(element).backgroundColor),
    "rgb(245, 247, 251)",
  );
  const toggleStyle = await page.locator("#password-show-password").evaluate((element) => {
    const style = getComputedStyle(element);
    return { borderLeftWidth: style.borderLeftWidth, borderRightWidth: style.borderRightWidth };
  });
  assert.deepEqual(toggleStyle, { borderLeftWidth: "0px", borderRightWidth: "0px" });
  await page.locator("#password").focus();
  await page.waitForTimeout(220);
  assert.equal(
    await passwordGroup.evaluate((element) => getComputedStyle(element).borderColor),
    "rgb(59, 130, 246)",
  );
  await page.locator('[data-xz-auth-tab="qr"]').click();
  assert.match(await page.locator(".xz-qr-placeholder").innerText(), /扫码登录功能尚未启用/);
  await page.locator("[data-xz-account-return]").click();
  assert.equal(
    await page.locator('[data-xz-auth-tab="account"]').getAttribute("aria-selected"),
    "true",
  );
  await page.waitForTimeout(350);
  assert.equal(await page.locator('[data-xz-auth-pane="account"]').isVisible(), true);
  assert.equal(await page.locator("#kc-login").isEnabled(), true);
  assert.deepEqual(consoleErrors, []);
  await page.screenshot({
    path: path.join(themeRoot, "test-output", "production-bento-login.png"),
    fullPage: true,
  });
  await context.close();
  console.log("production theme smoke check: PASS");
} finally {
  await browser.close();
}
