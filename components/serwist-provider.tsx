"use client";

import { SerwistProvider as Provider } from "@serwist/next/react";

export function SerwistProvider({ children }: { children: React.ReactNode }) {
    return (
        <Provider
            swUrl="/sw.js"
            register={true}
            reloadOnOnline={true}
        >
            {children}
        </Provider>
    );
}
