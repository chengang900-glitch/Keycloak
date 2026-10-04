import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const themeRoot = path.resolve(here, "..");
const workspace = path.resolve(themeRoot, "..");
const outputDir = path.join(themeRoot, "test-output");
const require = createRequire(import.meta.url);
const playwrightPackage =
  process.env.PLAYWRIGHT_PACKAGE_PATH ??
  path.join(workspace, "LibreChat-portal/node_modules/playwright");
const { chromium } = require(playwrightPackage);

const origin = "http://127.0.0.1:18080";
const authUrl =
  `${origin}/realms/enterprise-ai-theme-test/protocol/openid-connect/auth` +
  "?client_id=theme-test" +
  `&redirect_uri=${encodeURIComponent(`${origin}/test-callback`)}` +
  "&response_type=code&scope=openid";

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});

const makePage = async (options = {}) => {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const consoleErrors = [];
  const externalRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("request", (request) => {
    const requestUrl = new URL(request.url());
    if (requestUrl.hostname !== "127.0.0.1") externalRequests.push(request.url());
  });
  return { context, page, consoleErrors, externalRequests };
};

try {
  {
    const { context, page, consoleErrors, externalRequests } = await makePage({
      viewport: { width: 1440, height: 1000 },
    });
    await page.goto(authUrl, { waitUntil: "networkidle" });
    await page.locator("#kc-login").waitFor();

    assert.equal(await page.locator(".xz-bento-card").count(), 4);
    assert.deepEqual(
      await page.locator(".xz-bento-card .xz-bento-copy b").allInnerTexts(),
      ["AI工作台", "数据中心", "知识中心", "应用中心"],
    );
    assert.equal(await page.locator(".xz-company-brand img").getAttribute("alt"), "选哲 XuanZhe");
    assert.match(await page.locator(".xz-product-brand img").getAttribute("alt"), /UHOO/);

    const shellBox = await page.locator(".xz-auth-shell").boundingBox();
    assert.ok(shellBox, "auth shell was not visible");
    assert.ok(Math.abs(shellBox.width - 1080) <= 2, `desktop shell width: ${shellBox.width}px`);
    assert.ok(shellBox.height >= 620, `desktop shell height: ${shellBox.height}px`);
    assert.ok(shellBox.height <= 640, `desktop shell unexpectedly stretched: ${shellBox.height}px`);

    const accountTab = page.locator('[data-xz-auth-tab="account"]');
    const qrTab = page.locator('[data-xz-auth-tab="qr"]');
    assert.equal(await accountTab.getAttribute("aria-selected"), "true");
    assert.equal(await page.locator('[data-xz-auth-pane="account"]').isVisible(), true);
    assert.equal(await page.locator('[data-xz-auth-pane="qr"]').isHidden(), true);
    assert.equal(await page.locator("#username").getAttribute("placeholder"), "请输入登录账号");
    assert.equal(await page.locator("#password").getAttribute("placeholder"), "请输入登录密码");

    const usernameControl = page.locator("#username").locator("xpath=..");
    const passwordGroup = page
      .locator("#password")
      .locator(
        "xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' pf-v5-c-input-group ')][1]",
      );
    const passwordToggle = page.locator("#password-show-password");
    assert.equal(await page.locator("#username").evaluate((element) => element === document.activeElement), true);
    await page.locator("#username").evaluate((element) => element.blur());
    await page.waitForTimeout(200);
    const controlStyles = await Promise.all([
      usernameControl.evaluate((element) => {
        const style = getComputedStyle(element);
        return { backgroundColor: style.backgroundColor, borderRadius: style.borderRadius };
      }),
      passwordGroup.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          className: element.className,
          backgroundColor: style.backgroundColor,
          borderRadius: style.borderRadius,
        };
      }),
      passwordToggle.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          borderLeftWidth: style.borderLeftWidth,
          borderRightWidth: style.borderRightWidth,
          borderRadius: style.borderRadius,
        };
      }),
    ]);
    assert.equal(controlStyles[0].backgroundColor, "rgb(245, 247, 251)");
    assert.equal(
      controlStyles[1].backgroundColor,
      "rgb(245, 247, 251)",
      `password group style: ${JSON.stringify(controlStyles[1])}`,
    );
    assert.equal(controlStyles[0].borderRadius, "9px");
    assert.equal(controlStyles[1].borderRadius, "9px");
    assert.equal(controlStyles[2].borderLeftWidth, "0px");
    assert.equal(controlStyles[2].borderRightWidth, "0px");
    assert.equal(controlStyles[2].borderRadius, "7px");
    await page.screenshot({
      path: path.join(outputDir, "desktop-bento-account.png"),
      fullPage: true,
    });

    await qrTab.click();
    assert.equal(await qrTab.getAttribute("aria-selected"), "true");
    assert.equal(await page.locator('[data-xz-auth-pane="account"]').isHidden(), true);
    assert.equal(await page.locator('[data-xz-auth-pane="qr"]').isVisible(), true);
    assert.match(await page.locator(".xz-qr-placeholder").innerText(), /扫码登录功能尚未启用/);
    assert.equal(await page.locator(".xz-qr-placeholder canvas").count(), 0);
    assert.equal(await page.locator(".xz-qr-placeholder img").count(), 0);
    await page.screenshot({
      path: path.join(outputDir, "desktop-bento-qr-placeholder.png"),
      fullPage: true,
    });

    await page.locator("[data-xz-account-return]").click();
    assert.equal(await accountTab.getAttribute("aria-selected"), "true");
    assert.equal(await page.locator("#kc-login").isEnabled(), true);
    await accountTab.focus();
    await accountTab.press("ArrowRight");
    assert.equal(await qrTab.getAttribute("aria-selected"), "true");
    await qrTab.press("ArrowLeft");
    assert.equal(await accountTab.getAttribute("aria-selected"), "true");

    await page.locator("#username").click();
    const usernameFocusStyle = await page.locator("#username").evaluate((input) => {
      const style = getComputedStyle(input);
      return { outlineStyle: style.outlineStyle, boxShadow: style.boxShadow };
    });
    assert.equal(usernameFocusStyle.outlineStyle, "none");
    assert.equal(usernameFocusStyle.boxShadow, "none");
    await page.locator("#password").focus();
    assert.equal(await page.locator("#password").evaluate((element) => element === document.activeElement), true);
    await page.waitForTimeout(220);
    const passwordFocusStyle = await passwordGroup.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        className: element.className,
        matchesFocusWithin: element.matches(":focus-within"),
        matchesScopedSelector: element.matches(
          ".xz-auth-panel .pf-v5-c-input-group:focus-within",
        ),
        rootBlue: getComputedStyle(document.documentElement)
          .getPropertyValue("--xz-blue-500")
          .trim(),
        borderColor: style.borderColor,
        borderStyle: style.borderStyle,
        borderWidth: style.borderWidth,
        boxShadow: style.boxShadow,
      };
    });
    assert.equal(
      passwordFocusStyle.borderColor,
      "rgb(59, 130, 246)",
      `password focus style: ${JSON.stringify(passwordFocusStyle)}`,
    );
    assert.match(passwordFocusStyle.boxShadow, /rgba\(59, 130, 246, 0\.12\)/);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    assert.ok(overflow <= 1, `desktop horizontal overflow: ${overflow}px`);
    assert.deepEqual(externalRequests, []);
    assert.deepEqual(consoleErrors, []);
    await context.close();
  }

  {
    const { context, page, consoleErrors, externalRequests } = await makePage({
      viewport: { width: 390, height: 844 },
    });
    await page.goto(authUrl, { waitUntil: "networkidle" });
    await page.locator("#kc-login").waitFor();
    const positions = await page.evaluate(() => ({
      auth: document.querySelector(".xz-auth-panel")?.getBoundingClientRect().top,
      showcase: document.querySelector(".xz-showcase")?.getBoundingClientRect().top,
    }));
    assert.ok(positions.auth < positions.showcase, "mobile login panel should appear before showcase");
    assert.equal(await page.locator(".xz-bento-card").count(), 4);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    assert.ok(overflow <= 1, `mobile horizontal overflow: ${overflow}px`);
    await page.screenshot({
      path: path.join(outputDir, "mobile-bento-login.png"),
      fullPage: true,
    });
    assert.deepEqual(externalRequests, []);
    assert.deepEqual(consoleErrors, []);
    await context.close();
  }

  {
    const { context, page } = await makePage({
      javaScriptEnabled: false,
      viewport: { width: 1440, height: 1000 },
    });
    await page.goto(authUrl, { waitUntil: "load" });
    assert.equal(await page.locator('[data-xz-auth-pane="account"]').isVisible(), true);
    assert.equal(await page.locator('[data-xz-auth-pane="qr"]').isHidden(), true);
    assert.equal(await page.locator("#kc-login").isEnabled(), true);
    await context.close();
  }

  {
    const { context, page } = await makePage({
      viewport: { width: 1440, height: 1000 },
    });
    await page.goto(authUrl, { waitUntil: "networkidle" });
    await page.locator("#username").fill("not-a-user");
    await page.locator("#password").fill("wrong-password");
    await page.locator("#kc-login").click();
    await page.locator(".kc-feedback-text").waitFor();
    assert.match(await page.locator(".kc-feedback-text").innerText(), /无效|Invalid/i);

    await page.goto(authUrl, { waitUntil: "networkidle" });
    await page.locator("#username").fill("theme-user");
    await page.locator("#password").fill("ThemeTestOnly-2026!");
    await page.locator("#kc-login").click();
    const callbackUrl = new URL(page.url());
    assert.equal(callbackUrl.pathname, "/test-callback");
    assert.ok(
      callbackUrl.searchParams.has("code"),
      `callback did not contain an authorization code; parameters: ${[
        ...callbackUrl.searchParams.keys(),
      ].join(", ")}`,
    );
    await context.close();
  }

  console.log("theme browser checks: PASS");
} finally {
  await browser.close();
}
