// src/core/launch.ts
import { launch, Launcher } from "chrome-launcher";
import puppeteer from "rebrowser-puppeteer-core";
import { createCursor } from "ghost-cursor";
import kill from "tree-kill";

// src/core/turnstile.ts
var checkTurnstile = async ({ page }) => {
  return new Promise(async (resolve) => {
    const timeout = setTimeout(() => resolve(false), 5e3);
    try {
      const elements = await page.$$('[name="cf-turnstile-response"]');
      if (elements.length <= 0) {
        const coordinates = await page.evaluate(() => {
          const coords = [];
          document.querySelectorAll("div").forEach((el) => {
            try {
              const rect = el.getBoundingClientRect();
              const style = window.getComputedStyle(el);
              if (style.margin === "0px" && style.padding === "0px" && rect.width > 290 && rect.width <= 310 && !el.querySelector("*")) {
                coords.push({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
              }
            } catch {
            }
          });
          return coords;
        });
        for (const c of coordinates) {
          try {
            await page.mouse.click(c.x + 30, c.y + c.h / 2);
          } catch {
          }
        }
        clearTimeout(timeout);
        return resolve(true);
      }
      for (const el of elements) {
        try {
          const parent = await el.evaluateHandle((e) => e.parentElement);
          const box = await parent.boundingBox();
          await page.mouse.click(box.x + 30, box.y + box.height / 2);
        } catch {
        }
      }
      clearTimeout(timeout);
      resolve(true);
    } catch {
      clearTimeout(timeout);
      resolve(false);
    }
  });
};

// src/core/launch.ts
import { addExtra } from "puppeteer-extra";
async function pageController({
  browser,
  page,
  proxy = {},
  turnstile = false,
  xvfbsession,
  pid,
  plugins = [],
  killProcess = false,
  chrome
}) {
  let solveStatus = turnstile;
  page.on("close", () => {
    solveStatus = false;
  });
  browser.on("disconnected", async () => {
    solveStatus = false;
    if (killProcess) {
      if (xvfbsession) try {
        xvfbsession.stopSync();
      } catch {
      }
      if (chrome) try {
        chrome.kill?.();
      } catch {
      }
      if (pid) try {
        kill(pid, "SIGKILL", () => {
        });
      } catch {
      }
    }
  });
  if (turnstile) {
    void (async function solver() {
      while (solveStatus) {
        await checkTurnstile({ page }).catch(() => {
        });
        await new Promise((r) => setTimeout(r, 1e3));
      }
    })();
  }
  if (proxy.username && proxy.password) {
    await page.authenticate({ username: proxy.username, password: proxy.password });
  }
  if (plugins.length > 0) {
    for (const plugin of plugins) {
      plugin.onPageCreated?.(page);
    }
  }
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(MouseEvent.prototype, "screenX", { get() {
      return this.clientX + window.screenX;
    } });
    Object.defineProperty(MouseEvent.prototype, "screenY", { get() {
      return this.clientY + window.screenY;
    } });
  });
  const cursor = createCursor(page);
  page.realCursor = cursor;
  page.realClick = cursor.click.bind(cursor);
  return page;
}
async function connect(options = {}) {
  let {
    args = [],
    headless = false,
    customConfig = {},
    proxy = {},
    turnstile = false,
    connectOption = {},
    disableXvfb = false,
    plugins = [],
    ignoreAllFlags = false
  } = options;
  let xvfbsession = null;
  if (headless === "auto") headless = false;
  if (process.platform === "linux" && !disableXvfb) {
    try {
      const { default: Xvfb } = await import("xvfb");
      xvfbsession = new Xvfb({ silent: true, xvfb_args: ["-screen", "0", "1920x1080x24", "-ac"] });
      xvfbsession.startSync();
    } catch (err) {
      console.warn("\u26A0\uFE0F Linux xvfb not installed. Install: sudo apt-get install xvfb\n" + err.message);
    }
  }
  let chromeFlags;
  if (ignoreAllFlags) {
    chromeFlags = [
      ...args,
      ...headless ? [`--headless=${headless}`] : [],
      ...proxy.host && proxy.port ? [`--proxy-server=${proxy.host}:${proxy.port}`] : []
    ];
  } else {
    const flags = Launcher.defaultFlags();
    const disableIndex = flags.findIndex((f) => f.startsWith("--disable-features"));
    if (disableIndex !== -1) flags[disableIndex] += ",AutomationControlled";
    const compIndex = flags.findIndex((f) => f.startsWith("--disable-component-update"));
    if (compIndex !== -1) flags.splice(compIndex, 1);
    chromeFlags = [
      ...flags,
      ...args,
      ...headless ? [`--headless=${headless}`] : [],
      ...proxy.host && proxy.port ? [`--proxy-server=${proxy.host}:${proxy.port}`] : [],
      "--no-sandbox",
      "--disable-dev-shm-usage"
    ];
  }
  const chrome = await launch({ ignoreDefaultFlags: true, chromeFlags, ...customConfig });
  let puppeteerInstance = puppeteer;
  if (plugins.length > 0) {
    const pextra = addExtra(puppeteer);
    for (const plugin of plugins) pextra.use(plugin);
    puppeteerInstance = pextra;
  }
  const browser = await puppeteerInstance.connect({ browserURL: `http://127.0.0.1:${chrome.port}`, ...connectOption });
  let [page] = await browser.pages();
  page = await pageController({ browser, page, proxy, turnstile, xvfbsession, pid: chrome.pid, plugins, chrome, killProcess: true });
  browser.on("targetcreated", async (target) => {
    if (target.type() === "page") {
      const newPage = await target.page();
      if (!newPage) return;
      await pageController({
        browser,
        page: newPage,
        proxy,
        turnstile,
        xvfbsession,
        pid: chrome.pid,
        plugins,
        chrome
      });
    }
  });
  return { browser, page };
}
export {
  checkTurnstile,
  connect
};
