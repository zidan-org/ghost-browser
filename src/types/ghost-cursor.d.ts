declare module "ghost-cursor" {
  import { Page } from "rebrowser-puppeteer-core";

  interface Cursor {
    click(...args: any[]): Promise<void>;
    [key: string]: any;
  }

  export function createCursor(page: Page): Cursor;
}

