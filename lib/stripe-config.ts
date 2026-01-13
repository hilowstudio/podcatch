export const PLANS = {
    free: {
        name: 'Free',
        label: 'Free',
        priceId: 'price_1SorsuICURxkmpICuXXJgIBC',
        productId: 'prod_TmNSuTaiiK90ZS',
        amount: 0,
        marketingFeatures: ['3 Episodes/mo', 'Basic AI Summary', 'Web Access'],
        features: {
            monthlyEpisodeLimit: 3,
            canChatLibrary: false,
            canUseGraph: false,
            canIntegrate: false,
            canUseCustomPrompts: false,
            canChatEpisode: false,
            canUseStudio: false,
        }
    },
    basic: {
        name: 'Basic',
        label: 'Basic',
        monthly: {
            priceId: 'price_1Sooj4ICURxkmpIC3UUNol3d',
            productId: 'prod_TmNUFfU80Fft29',
            amount: 12,
        },
        annual: {
            priceId: 'price_1SookNICURxkmpICMltKy12s',
            productId: 'prod_TmNVxilCkGOuEo',
            amount: 120,
        },
        marketingFeatures: ['20 Episodes/mo', 'Deep Discovery', 'Email Support'],
        features: {
            monthlyEpisodeLimit: 20,
            canChatLibrary: false,
            canUseGraph: true,
            canIntegrate: true,
            canUseCustomPrompts: false,
            canChatEpisode: false,
            canUseStudio: true,
        }
    },
    pro: {
        name: 'Pro',
        label: 'Pro',
        monthly: {
            priceId: 'price_1SoojiICURxkmpIC4Zi7i5tp',
            productId: 'prod_TmNUKvZMhGcGJ3',
            amount: 29,
        },
        annual: {
            priceId: 'price_1SoolAICURxkmpIC8CYTE57A',
            productId: 'prod_TmNW2KWFOI84Ec',
            amount: 290,
        },
        marketingFeatures: ['200 Episodes/mo', 'Priority AI Processing', 'Integration Sync (Notion/Claude)'],
        features: {
            monthlyEpisodeLimit: 200, // Effectively unlimited for normal use
            canChatLibrary: true,
            canUseGraph: true,
            canIntegrate: true,
            canUseCustomPrompts: true,
            canChatEpisode: true,
            canUseStudio: true,
        }
    }
} as const;

export const TRIAL_DAYS = 3;

export type PlanType = keyof typeof PLANS;
