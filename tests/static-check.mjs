import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const login = path.join(root, "src/main/resources/theme/enterprise-ai/login");

const read = (relativePath) => readFile(path.join(login, relativePath), "utf8");

const template = await read("template.ftl");
const properties = await read("theme.properties");
const script = await read("resources/js/login-shell.js");
const css = await read("resources/css/enterprise-ai.css");
const messages = await read("messages/messages_zh_CN.properties");
const fallbackMessages = await read("messages/messages_en.properties");
const registry = await readFile(
  path.join(root, "src/main/resources/META-INF/keycloak-themes.json"),
  "utf8",
);

assert.match(template, /class="xz-showcase"/);
assert.match(template, /class="xz-bento"/);
assert.match(template, /src="\/branding\/company-logo\.webp"/);
assert.match(template, /src="\/branding\/portal-logo\.webp"/);
assert.equal(
  (template.match(/class="xz-bento-card /g) ?? []).length,
  4,
  "Bento must contain exactly four capability cards",
);
for (const label of ["应用中心", "知识中心", "数据中心", "AI工作台"]) {
  assert.match(template, new RegExp(label));
}
assert.match(template, /data-xz-auth-tabs/);
assert.match(template, /data-xz-auth-tab="account"/);
assert.match(template, /data-xz-auth-tab="qr"/);
assert.match(template, /扫码登录功能尚未启用/);
assert.match(template, /data-xz-account-return/);
assert.doesNotMatch(template + script, /drawQR|qrSvg|qrTimer|wecom|dingtalk|feishu/);
assert.doesNotMatch(template, /slide-a\.webp|slide-d\.webp|slide-goal\.webp/);
assert.doesNotMatch(template, /data-xz-carousel/);

assert.match(css, /max-width: 1080px/);
assert.match(css, /min-height: 620px/);
assert.match(css, /grid-template-columns: minmax\(0, 1\.06fr\) minmax\(0, 0\.94fr\)/);
assert.match(css, /linear-gradient\(132deg, #eaf1fe 0%, #eff3fc 46%, #f4f6f3 100%\)/);
assert.match(css, /@media \(max-width: 1000px\)/);
assert.match(css, /@media \(max-width: 560px\)/);
assert.match(css, /:where\(input, select\):focus-visible[\s\S]*outline: none/);
assert.match(css, /\.pf-v5-c-input-group \{/);
assert.match(css, /\.pf-v5-c-input-group__item:not\(\.pf-m-fill\)/);
assert.match(css, /\.pf-v5-c-button\.pf-m-control[\s\S]*border: 0/);
assert.match(css, /\.pf-v5-c-input-group:focus-within/);

assert.match(script, /activate\("account"\)/);
assert.match(script, /username\.setAttribute\("placeholder", "请输入登录账号"\)/);
assert.match(script, /password\.setAttribute\("placeholder", "请输入登录密码"\)/);
assert.match(script, /ArrowLeft/);
assert.match(script, /ArrowRight/);
assert.doesNotMatch(script, /preventDefault\(\)[\s\S]*requestSubmit|submit["']/);
assert.doesNotMatch(script, /localStorage|sessionStorage|eval\s*\(|fetch\s*\(/);
assert.doesNotMatch(css, /url\(\s*["']?https?:\/\//);
assert.doesNotMatch(template, /(?:src|href)=["']https?:\/\//);

assert.match(template, /<form id="kc-select-try-another-way-form"/);
assert.match(template, /<#nested "form">/);
assert.match(template, /<#nested "socialProviders">/);
assert.match(template, /<#nested "info">/);
assert.match(template, /<@loginFooter\.content\/>/);
assert.match(properties, /^parent=keycloak\.v2$/m);
assert.match(properties, /^scripts=js\/login-shell\.js$/m);
assert.match(properties, /^darkMode=false$/m);
assert.match(messages, /^loginAccountTitle=登录企业AI中台$/m);
assert.match(fallbackMessages, /^loginAccountTitle=登录企业AI中台$/m);
assert.deepEqual(JSON.parse(registry), {
  themes: [{ name: "enterprise-ai", types: ["login"] }],
});

console.log("theme static checks: PASS");
