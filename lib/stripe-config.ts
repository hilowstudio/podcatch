export const PLANS = {
    free: {
        name: 'Free',
        label: 'Free',
        priceId: 'price_1SorsuICURxkmpICuXXJgIBC', // Monthly (Free doesn't strictly need intervals but good for schema)
        productId: 'prod_TmNSuTaiiK90ZS',
        amount: 0,
        marketingFeatures: ['3 Episodes/mo', 'Basic AI Summary', 'Web Access']
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
        marketingFeatures: ['10 Episodes/mo', 'Deep Discovery', 'Email Support']
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
        marketingFeatures: ['Unlimited Episodes', 'Priority AI Processing', 'Integration Sync (Notion/Claude)']
    }
} as const;

export const TRIAL_DAYS = 3;

export type PlanType = keyof typeof PLANS;
