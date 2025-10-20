import type { Page } from "rebrowser-puppeteer-core";

export const checkTurnstile = async ({ page }: { page: Page }): Promise<boolean> => {
  return new Promise(async (resolve) => {
    const timeout = setTimeout(() => resolve(false), 5000);

    try {
      const elements = await page.$$('[name="cf-turnstile-response"]');
      if (elements.length <= 0) {
        const coordinates = await page.evaluate(() => {
          const coords: any[] = [];
          document.querySelectorAll('div').forEach((el) => {
            try {
              const rect = el.getBoundingClientRect();
              const style = window.getComputedStyle(el);
              if (style.margin === "0px" && style.padding === "0px" && rect.width > 290 && rect.width <= 310 && !el.querySelector("*")) {
                coords.push({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
              }
            } catch {}
          });
          return coords;
        });

        for (const c of coordinates) {
          try {
            await page.mouse.click(c.x + 30, c.y + c.h / 2);
          } catch {}
        }
        clearTimeout(timeout);
        return resolve(true);
      }

      for (const el of elements) {
        try {
          const parent = await el.evaluateHandle((e) => e.parentElement);
          const box = await (parent as any).boundingBox();
          await page.mouse.click(box.x + 30, box.y + box.height / 2);
        } catch {}
      }

      clearTimeout(timeout);
      resolve(true);
    } catch {
      clearTimeout(timeout);
      resolve(false);
    }
  });
};
