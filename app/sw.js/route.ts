import { createSerwistRoute } from "@serwist/turbopack";

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
    swSrc: "app/sw.ts",
    additionalPrecacheEntries: [
        { url: "/offline", revision: "offline-v1" },
    ],
    nextConfig: {},
});
