import type { Page } from "rebrowser-puppeteer-core";

export const checkTurnstile = async ({ page }: { page: Page }): Promise<boolean> => {
  return new Promise(async (resolve) => {
    const timeout = setTimeout(() => {
      clearTimeout(timeout);
      resolve(false);
    }, 5000);

    try {
      const elements = await page.$$('[name="cf-turnstile-response"]');

      if (elements.length <= 0) {
        const coordinates = await page.evaluate(() => {
          const coordinates: { x: number; y: number; w: number; h: number }[] = [];

          document.querySelectorAll("div").forEach((item) => {
            try {
              const rect = item.getBoundingClientRect();
              const style = window.getComputedStyle(item);

              if (
                style.margin === "0px" &&
                style.padding === "0px" &&
                rect.width > 290 &&
                rect.width <= 310 &&
                !item.querySelector("*")
              ) {
                coordinates.push({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
              }
            } catch {
              //
            }
          });

          //Try again
          if (coordinates.length <= 0) {
            document.querySelectorAll("div").forEach((item) => {
              try {
                const rect = item.getBoundingClientRect();
                if (rect.width > 290 && rect.width <= 310 && !item.querySelector("*")) {
                  coordinates.push({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
                }
              } catch {
                //
              }
            });
          }

          return coordinates;
        });

        for (const item of coordinates) {
          try {
            const x = item.x + 30;
            const y = item.y + item.h / 2;
            await page.mouse.click(x, y);
          } catch {
            //
          }
        }

        clearTimeout(timeout);
        return resolve(true);
      }

      for (const element of elements) {
        try {
          const parentElement = await element.evaluateHandle((el) => el.parentElement);
          const box = await (parentElement as any).boundingBox();
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