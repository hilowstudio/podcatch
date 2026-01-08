'use server';

import { signIn } from '@/auth';

export async function signInWithEmail(formData: FormData) {
    await signIn('resend', {
        email: formData.get('email'),
        redirectTo: '/'
    });
}

export async function signInWithGoogle(_formData?: FormData) {
    await signIn('google', {
        redirectTo: '/'
    });
}
