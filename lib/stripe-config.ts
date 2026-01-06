export const PLANS = {
    monthly: {
        name: 'Monthly',
        priceId: 'price_1Smd4XICURxkmpICcEwPSOlr',
        amount: 49,
        interval: 'month',
        label: '$49/month'
    },
    annual: {
        name: 'Annual',
        priceId: 'price_1Smd5KICURxkmpICLbi7p5hq',
        amount: 499,
        interval: 'year',
        label: '$499/year (Save ~15%)'
    }
} as const;

export const TRIAL_DAYS = 3;

export type PlanType = keyof typeof PLANS;
