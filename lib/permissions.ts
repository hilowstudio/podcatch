import { PLANS, PlanType } from './stripe-config';

type UserPlan = PlanType | 'free'; // Default to free if unknown

export type Permission =
    | 'canChatLibrary'
    | 'canUseGraph'
    | 'canIntegrate'
    | 'canUseCustomPrompts'
    | 'canChatEpisode'
    | 'canUseStudio'
    | 'canIngestYouTube';

/** How a plan reads a YouTube video. See PLANS for what each value means. */
export type YouTubeUnderstanding = 'none' | 'audio' | 'video';

export function getYouTubeUnderstanding(plan: string | null | undefined): YouTubeUnderstanding {
    return getPlanFeatures(plan).youtubeUnderstanding as YouTubeUnderstanding;
}

export function getPlanFeatures(plan: string | null | undefined) {
    // Normalize plan string to PlanType
    const normalizedPlan = (plan?.toLowerCase() || 'free') as PlanType;

    // Fallback to free if plan is invalid
    const planConfig = PLANS[normalizedPlan] || PLANS.free;

    return planConfig.features;
}

export function checkPermission(plan: string | null | undefined, permission: Permission): boolean {
    const features = getPlanFeatures(plan);
    return features[permission] || false;
}

export function getEpisodeLimit(plan: string | null | undefined): number {
    const features = getPlanFeatures(plan);
    return features.monthlyEpisodeLimit;
}
