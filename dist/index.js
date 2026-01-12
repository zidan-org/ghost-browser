// src/core/launch.ts
import puppeteer from "rebrowser-puppeteer-core";
import { createCursor } from "ghost-cursor";
import kill from "tree-kill";

// src/core/turnstile.ts
var checkTurnstile = async ({ page }) => {
  return new Promise(async (resolve) => {
    const timeout = setTimeout(() => {
      clearTimeout(timeout);
      resolve(false);
    }, 5e3);
    try {
      const elements = await page.$$('[name="cf-turnstile-response"]');
      if (elements.length <= 0) {
        const coordinates = await page.evaluate(() => {
          const coordinates2 = [];
          document.querySelectorAll("div").forEach((item) => {
            try {
              const rect = item.getBoundingClientRect();
              const style = window.getComputedStyle(item);
              if (style.margin === "0px" && style.padding === "0px" && rect.width > 290 && rect.width <= 310 && !item.querySelector("*")) {
                coordinates2.push({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
              }
            } catch {
            }
          });
          if (coordinates2.length <= 0) {
            document.querySelectorAll("div").forEach((item) => {
              try {
                const rect = item.getBoundingClientRect();
                if (rect.width > 290 && rect.width <= 310 && !item.querySelector("*")) {
                  coordinates2.push({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
                }
              } catch {
              }
            });
          }
          return coordinates2;
        });
        for (const item of coordinates) {
          try {
            const x = item.x + 30;
            const y = item.y + item.h / 2;
            await page.mouse.click(x, y);
          } catch {
          }
        }
        clearTimeout(timeout);
        return resolve(true);
      }
      for (const element of elements) {
        try {
          const parentElement = await element.evaluateHandle((el) => el.parentElement);
          const box = await parentElement.boundingBox();
          if (box) {
            const x = box.x + 30;
            const y = box.y + box.height / 2;
            await page.mouse.click(x, y);
          }
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
  chrome = null
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
  void (async function turnstileSolver() {
    while (solveStatus) {
      try {
        await checkTurnstile({ page });
      } catch {
      }
      await new Promise((r) => setTimeout(r, 1e3));
    }
  })();
  if (proxy.username && proxy.password) {
    await page.authenticate({ username: proxy.username, password: proxy.password });
  }
  if (plugins.length > 0) {
    for (const plugin of plugins) {
      plugin.onPageCreated?.(page);
    }
  }
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(MouseEvent.prototype, "screenX", {
      get() {
        return this.clientX + window.screenX;
      }
    });
    Object.defineProperty(MouseEvent.prototype, "screenY", {
      get() {
        return this.clientY + window.screenY;
      }
    });
  });
  const cursor = createCursor(page);
  page.realCursor = cursor;
  page.realClick = cursor.click.bind(cursor);
  return page;
}
async function connect(options = {}) {
  const { launch, Launcher } = await import("chrome-launcher");
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
  let chrome = null;
  if (!options.connectOption || !options.connectOption.browserWSEndpoint) {
    chrome = await launch({ ignoreDefaultFlags: true, chromeFlags, ...customConfig });
  }
  let puppeteerInstance = puppeteer;
  if (plugins.length > 0) {
    const pextra = addExtra(puppeteer);
    for (const plugin of plugins) pextra.use(plugin);
    puppeteerInstance = pextra;
  }
  if (chrome) {
    connectOption.browserURL = `http://127.0.0.1:${chrome.port}`;
  }
  const browser = await puppeteerInstance.connect(connectOption);
  let [page] = await browser.pages();
  page = await pageController({
    browser,
    page,
    proxy,
    turnstile,
    xvfbsession,
    pid: chrome?.pid,
    plugins,
    chrome,
    killProcess: true
  });
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
        pid: chrome?.pid,
        plugins,
        chrome
      });
    }
  });
  return { browser, page };
}
export {
  checkTurnstile,
  connect,
  pageController
};
