import type { Browser, ContinueRequestOverrides, ElementHandle, Frame, GoToOptions, HTTPResponse, Page, WaitForOptions, WaitForSelectorOptions } from "rebrowser-puppeteer-core";
export type { Browser, Page, ElementHandle, Frame, GoToOptions, HTTPResponse, WaitForOptions, WaitForSelectorOptions, ContinueRequestOverrides };
export interface Options {
    args?: string[];
    headless?: boolean | "auto";
    customConfig?: import("chrome-launcher").Options;
    proxy?: ProxyOptions;
    turnstile?: boolean;
    connectOption?: import("rebrowser-puppeteer-core").ConnectOptions;
    disableXvfb?: boolean;
    plugins?: import("puppeteer-extra").PuppeteerExtraPlugin[];
    ignoreAllFlags?: boolean;
}
export interface ProxyOptions {
    host: string;
    port: number;
    username?: string;
    password?: string;
}
export interface ConnectResult {
    browser: Browser;
    page: Page;
}
