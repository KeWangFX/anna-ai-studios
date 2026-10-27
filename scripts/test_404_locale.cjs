const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");

const html = fs.readFileSync(path.join(__dirname, "..", "404.html"), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
// Both hosts must allow the exact shipped recovery script; stale CSP silently breaks it.
const hash = "sha256-" + crypto.createHash("sha256").update(script.replace(/\r\n/g, "\n")).digest("base64");
assert.ok(html.includes(hash), "404 meta CSP must match the script");
assert.ok(fs.readFileSync(path.join(__dirname, "..", "_headers"), "utf8").includes(hash), "Cloudflare CSP must match the script");

// Execute the shipped inline script: path tests catch regressions on both hosting roots.
const cases = [
  ["anna-ai-studios.pages.dev", "/zh/missing/page/", "zh-Hans", "/zh/"],
  ["anna-ai-studios.pages.dev", "/zh", "zh-Hans", "/zh/"],
  ["anna-ai-studios.pages.dev", "/zh/", "zh-Hans", "/zh/"],
  ["anna-ai-studios.pages.dev", "/missing/page/", "en", "/"],
  ["anna-ai-studios.pages.dev", "/zh-other/missing/", "en", "/"],
  ["kewangfx.github.io", "/anna-ai-studios/zh/missing/page/", "zh-Hans", "/anna-ai-studios/zh/"],
  ["kewangfx.github.io", "/anna-ai-studios/zh", "zh-Hans", "/anna-ai-studios/zh/"],
  ["kewangfx.github.io", "/anna-ai-studios/zh/", "zh-Hans", "/anna-ai-studios/zh/"],
  ["kewangfx.github.io", "/anna-ai-studios/missing/page/", "en", "/anna-ai-studios/"]
];

for (const [hostname, pathname, language, homeHref] of cases) {
  const elements = new Map();
  const assets = [];
  const handlers = new Map();
  const document = {
    documentElement: {},
    head: { append(element) { assets.push(element); } },
    createElement() { return {}; },
    querySelector(selector) {
      assert.ok(html.includes(selector.slice(1, -1)), `Missing real DOM target: ${selector}`);
      if (!elements.has(selector)) elements.set(selector, {
        style: {},
        setAttribute(name, value) { this[name] = value; }
      });
      return elements.get(selector);
    }
  };
  vm.runInNewContext(script, {
    document,
    location: { hostname, pathname },
    window: { addEventListener(name, callback) { handlers.set(name, callback); } }
  });
  handlers.get("DOMContentLoaded")();
  assert.equal(document.documentElement.lang, language, pathname);
  assert.equal(elements.get("[data-home-link]").href, homeHref, pathname);
  assert.equal(document.title, language === "zh-Hans" ? "页面未找到 | Anna AI Studios" : "Not found | Anna AI Studios");
  assert.equal(elements.get("[data-home-link]").textContent, language === "zh-Hans" ? "返回 Anna AI Studios 中文首页" : "Back to Anna AI Studios");
  assert.equal(elements.get("[data-error-first-line]").textContent, language === "zh-Hans" ? "这个页面" : "This route");
  assert.equal(elements.get("[data-error-second-line]").textContent, language === "zh-Hans" ? "暂时找不到。" : "ends here.");
  assert.equal(elements.get("[data-error-description]").textContent, language === "zh-Hans" ? "返回工作室，继续查看服务与案例。" : "Return to the production path.");
  if (language === "zh-Hans") {
    assert.equal(elements.get("[data-error-heading]").style.fontSize, "clamp(40px,9vw,132px)");
    assert.equal(elements.get("[data-error-heading]").style.lineHeight, "1.12");
  } else {
    assert.equal(elements.has("[data-error-heading]"), false, "English heading must retain its original styles");
  }
  const assetBase = hostname === "kewangfx.github.io" ? "/anna-ai-studios/" : "/";
  assert.equal(assets[0].href, `${assetBase}favicon-v1.svg`);
  assert.equal(assets[1].href, `${assetBase}styles.css?v=20261027a`);
}

console.log(`404 locale and recovery: ${cases.length} route cases passed.`);
