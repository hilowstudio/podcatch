/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

// This declares the types for the service worker global scope
declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

// Filter out Next.js error pages that can return 500 during precaching
const excludePatterns = [/_global-error/, /_error/, /_not-found/];

const filteredManifest = self.__SW_MANIFEST?.filter((entry) => {
    const url = typeof entry === "string" ? entry : entry.url;
    return !excludePatterns.some((pattern) => pattern.test(url));
});

const serwist = new Serwist({
    precacheEntries: filteredManifest,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: defaultCache,
    fallbacks: {
        entries: [
            {
                url: "/offline",
                matcher({ request }) {
                    return request.destination === "document";
                },
            },
        ],
    },
});

serwist.addEventListeners();

