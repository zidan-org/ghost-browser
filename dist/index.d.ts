import * as rebrowser_puppeteer_core from 'rebrowser-puppeteer-core';
import { ConnectOptions, Browser, Page } from 'rebrowser-puppeteer-core';
export { Browser, Page } from 'rebrowser-puppeteer-core';
import * as puppeteer_extra from 'puppeteer-extra';
import { PuppeteerExtraPlugin } from 'puppeteer-extra';
import * as chrome_launcher from 'chrome-launcher';

interface ProxyOptions$1 {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
}
interface ConnectParams {
    args?: string[];
    headless?: boolean | "auto";
    customConfig?: any;
    proxy?: ProxyOptions$1;
    turnstile?: boolean;
    connectOption?: ConnectOptions;
    disableXvfb?: boolean;
    plugins?: PuppeteerExtraPlugin[];
    ignoreAllFlags?: boolean;
}
interface ConnectResult$1 {
    browser: Browser;
    page: Page;
}
declare function pageController({ browser, page, proxy, turnstile, xvfbsession, pid, plugins, killProcess, chrome }: {
    browser: Browser;
    page: Page;
    proxy?: ProxyOptions$1;
    turnstile?: boolean;
    xvfbsession?: any;
    pid?: number;
    plugins?: PuppeteerExtraPlugin[];
    killProcess?: boolean;
    chrome?: {
        kill?: () => void;
    } | null;
}): Promise<Page>;
declare function connect(options?: ConnectParams): Promise<ConnectResult$1>;

declare const checkTurnstile: ({ page }: {
    page: Page;
}) => Promise<boolean>;

interface Options {
    args?: string[];
    headless?: boolean | "auto";
    customConfig?: chrome_launcher.Options;
    proxy?: ProxyOptions;
    turnstile?: boolean;
    connectOption?: rebrowser_puppeteer_core.ConnectOptions;
    disableXvfb?: boolean;
    plugins?: puppeteer_extra.PuppeteerExtraPlugin[];
    ignoreAllFlags?: boolean;
}
interface ProxyOptions {
    host: string;
    port: number;
    username?: string;
    password?: string;
}
interface ConnectResult {
    browser: Browser;
    page: Page;
}

export { type ConnectResult, type Options, checkTurnstile, connect, pageController };
