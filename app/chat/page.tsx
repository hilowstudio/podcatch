import { auth } from '@/auth';
import { getUserSubscriptionPlan } from '@/lib/subscription';
import { GatedFeature } from '@/components/gated-feature';
import { ChatView } from '@/components/chat-view';
import { redirect } from 'next/navigation';

export default async function ChatPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/auth/signin');
    }

    const subscription = await getUserSubscriptionPlan();

    if (!subscription.canChatWithLibrary) {
        return (
            <GatedFeature
                title="Chat with Library Locked"
                description="Chatting with your entire podcast library involves complex AI processing. Upgrade to Pro to unlock this feature."
                requiredTier="PRO"
            />
        );
    }

    return <ChatView />;
}
