import { Options as ChromeOptions } from "chrome-launcher";
import { Browser, Page, ConnectOptions } from "rebrowser-puppeteer-core";
import { PuppeteerExtraPlugin } from "puppeteer-extra";
export interface ProxyOptions {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
}
export interface ConnectParams {
    args?: string[];
    headless?: boolean | "auto";
    customConfig?: ChromeOptions;
    proxy?: ProxyOptions;
    turnstile?: boolean;
    connectOption?: ConnectOptions;
    disableXvfb?: boolean;
    plugins?: PuppeteerExtraPlugin[];
    ignoreAllFlags?: boolean;
}
export interface ConnectResult {
    browser: Browser;
    page: Page;
}
export declare function connect(options?: ConnectParams): Promise<ConnectResult>;
