import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AdminImportClient } from './admin-import-client';

export default async function AdminImportPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/auth/signin');
    }

    const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean);
    if (!session.user.email || !adminEmails.includes(session.user.email)) {
        redirect('/');
    }

    return <AdminImportClient />;
}
