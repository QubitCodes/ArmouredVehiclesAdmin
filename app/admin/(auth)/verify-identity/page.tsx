'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Public gateway to handle Firebase Magic Link verification
 * This avoids middleware redirects by being whitelisted as a public route.
 * Once verified, it sets a secure flag and redirects back to the protected profile page.
 */
export default function VerifyIdentityPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { verifyMagicLink, isMagicLink } = useFirebaseAuth();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleVerification = async () => {
            // Firebase magic links need the email
            // We first check the URL (manually appended by sendMagicLink), then localStorage (set by Firebase)
            const email = searchParams.get('email') || window.localStorage.getItem('emailForSignIn');
            const currentUrl = window.location.href;

            if (!isMagicLink(currentUrl)) {
                setStatus('error');
                setError('This does not appear to be a valid verification link.');
                return;
            }

            if (!email) {
                setStatus('error');
                setError('We need your email address to complete verification. Please try clicking the link again from your original device/browser.');
                return;
            }

            try {
                // Verify with Firebase
                await verifyMagicLink(email, currentUrl);

                setStatus('success');

                // If this was a re-authentication flow (for security verification)
                if (searchParams.get('reauth') === 'true') {
                    localStorage.setItem('reauth_verified', 'true');
                    localStorage.setItem('reauth_verified_at', Date.now().toString());
                }

                // If this was an email update flow
                if (searchParams.get('email_verified') === 'true') {
                    // Firebase already updated the email if verifyBeforeUpdateEmail was used
                    // We just pass the flag back so the profile page can sync to DB
                    localStorage.setItem('email_update_verified', 'true');
                    localStorage.setItem('new_email_pending', searchParams.get('new_email') || '');
                }

                // Determine redirect path
                // We default to '/admin/profile' if returnUrl is missing, assuming 'admin' domain
                const returnUrl = searchParams.get('returnUrl') || '/admin/profile';

                // Small delay to show success state
                setTimeout(() => {
                    router.push(returnUrl);
                }, 1500);
            } catch (err: any) {
                console.error('Verification error:', err);
                setStatus('error');
                setError(err.message || 'Identity verification failed. The link may have expired or been already used.');
            }
        };

        handleVerification();
    }, [searchParams, verifyMagicLink, isMagicLink, router]);

    return (
        <div className="flex items-center justify-center min-h-[80vh] bg-slate-50 dark:bg-slate-950 p-4">
            <Card className="w-full max-w-md shadow-xl border-primary/20">
                <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                    {status === 'verifying' && (
                        <>
                            <div className="relative mb-6">
                                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
                                <Loader2 className="h-16 w-16 text-primary animate-spin relative z-10" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">Verifying Identity</h2>
                            <p className="text-muted-foreground mt-3 max-w-xs mx-auto">
                                We're securely confirming your identity with Firebase. Just a moment...
                            </p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                                <CheckCircle className="h-12 w-12 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-green-600 dark:text-green-500">Verified Successfully</h2>
                            <p className="text-muted-foreground mt-3">
                                Your identity has been confirmed. Redirecting you back to your account...
                            </p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                                <XCircle className="h-12 w-12 text-red-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-red-600 dark:text-red-500">Verification Failed</h2>
                            <p className="text-muted-foreground mt-3 px-4">
                                {error}
                            </p>
                            <div className="flex flex-col gap-3 mt-8 w-full">
                                <button
                                    onClick={() => router.push('/admin/login')}
                                    className="w-full py-2.5 bg-primary text-primary-foreground font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-all active:scale-[0.98]"
                                >
                                    Login to Admin Panel
                                </button>
                                <button
                                    onClick={() => router.refresh()}
                                    className="w-full py-2.5 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary/80 transition-all"
                                >
                                    Retry Verification
                                </button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
