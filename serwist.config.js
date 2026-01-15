// @ts-check
import { serwist } from "@serwist/next/config";

export default serwist({
    swSrc: "app/sw.ts",
    swDest: "public/sw.js",
    additionalPrecacheEntries: [
        { url: "/offline", revision: "offline-v1" },
    ],
    // Exclude Next.js error pages that may return 500 during build
    exclude: [
        /_global-error/,
        /_error/,
        /_not-found/,
    ],
});
