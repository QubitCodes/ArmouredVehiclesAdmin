"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import api from "@/lib/api";
import { authService } from "@/services/admin/auth.service";
import { vendorAuthService } from "@/services/vendor/auth.service";

function AdminLoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Detect Magic Link URL immediately
    const isMagicLinkRedirect = searchParams.get('mode') === 'signIn' && !!searchParams.get('oobCode');

    const [identifier, setIdentifier] = useState("");
    const [stage, setStage] = useState<"start" | "verify" | "magic_link_sent">("start");
    const [loading, setLoading] = useState(isMagicLinkRedirect);
    const [isVerifyingLink, setIsVerifyingLink] = useState(isMagicLinkRedirect);
    const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Firebase Hook
    const { sendPhoneOtp, verifyPhoneOtp, sendMagicLink, verifyMagicLink, isMagicLink } = useFirebaseAuth();
    const [confirmationResult, setConfirmationResult] = useState<any>(null);

    const isEmail = (value: string) => value.includes("@");

    // Magic Link Verification Effect
    const processingRef = useRef(false);

    useEffect(() => {
        const checkMagicLink = async () => {
            if (processingRef.current) return;

            // Use the hook or our derived state? Hook is safer for parsing details
            if (isMagicLink(window.location.href)) {
                processingRef.current = true;
                setLoading(true);
                setIsVerifyingLink(true);

                try {
                    // Try to get email from storage
                    let email = window.localStorage.getItem('emailForSignIn');
                    if (!email) {
                        email = window.prompt('Please provide your email for confirmation');
                    }
                    if (!email) {
                        setLoading(false);
                        setIsVerifyingLink(false);
                        processingRef.current = false;
                        return;
                    }

                    const credential = await verifyMagicLink(email);
                    const idToken = await credential.user.getIdToken();
                    await completeLogin(idToken);
                } catch (err: any) {
                    console.error(err);
                    if (err.code !== 'auth/invalid-action-code') {
                        toast.error(err.message || "Failed to verify magic link");
                    }
                    setLoading(false);
                    setIsVerifyingLink(false);
                }
            }
        };
        checkMagicLink();
    }, [isMagicLink, verifyMagicLink]);

    const completeLogin = async (idToken: string) => {
        try {
            const response = await api.post("/auth/firebase/verify", { idToken });
            const { status, data, message } = response.data;

            if (status && data) {
                // Verify user type is admin or super_admin
                const userType = data.user?.userType;
                if (!['admin', 'super_admin'].includes(userType)) {
                    throw new Error("Unauthorized: Admin access only");
                }

                if (data.accessToken) {
                    // Clear conflicting vendor sessions
                    vendorAuthService.clearTokens();
                    authService.setTokens(data.accessToken, data.refreshToken || "");
                }

                if (data.user) {
                    authService.setUserDetails(data.user);
                    toast.success("Login Successful!");
                    router.push("/admin");
                } else {
                    router.push("/admin");
                }
            } else {
                throw new Error(message || "Login failed");
            }

        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || err.message || "Login failed on server");
            setIsVerifyingLink(false); // Show login form on failure
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = async (e: React.FormEvent) => {
        e.preventDefault();
        let input = identifier.trim();
        if (!input) {
            toast.error("Please enter your email or phone number.");
            return;
        }

        try {
            setLoading(true);

            // 1. Check if user exists & get formatted identifier
            let cleanIdentifier = input;
            try {
                const checkRes = await api.post("/auth/user-exists", { identifier: input, userType: 'admin' });

                // DEV BACKDOOR
                if (checkRes.data?.data?.bypass) {
                    const { user, accessToken, refreshToken } = checkRes.data.data;
                    console.log('[DEV-AUTH] Backdoor triggered for:', user.email);

                    authService.setTokens(accessToken, refreshToken);
                    authService.setUserDetails(user);
                    toast.success("Dev Login Successful!");
                    router.push("/admin");
                    return;
                }

                if (checkRes.data?.data) {
                    const { identifier: id, userType } = checkRes.data.data;
                    cleanIdentifier = id;

                    // Pre-check if Admin
                    if (!['admin', 'super_admin'].includes(userType)) {
                        throw new Error("This account is not an Admin.");
                    }
                }
            } catch (e: any) {
                if (e.message === "This account is not an Admin.") {
                    throw e;
                }
                if (e.response?.status === 404) {
                    toast.error("Admin account not found.");
                    setLoading(false);
                    return;
                }
                console.warn("User check failed, proceeding with raw input", e);
            }

            // 2. Trigger Firebase Auth
            if (isEmail(cleanIdentifier)) {
                await sendMagicLink(cleanIdentifier, window.location.href);
                setStage("magic_link_sent");
                toast.success(`Magic link sent to ${cleanIdentifier}.`);
            } else {
                const phoneToUse = cleanIdentifier.startsWith('+') ? cleanIdentifier : `+${cleanIdentifier.replace(/\D/g, '')}`;
                const res = await sendPhoneOtp(phoneToUse, 'recaptcha-container');
                setConfirmationResult(res);
                setStage("verify");
                toast.success("OTP Sent!");
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to start login");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const code = otp.join("");
        if (code.length !== 6) {
            toast.error("Please enter the 6-digit OTP");
            return;
        }

        if (!confirmationResult) {
            toast.error("Session expired.");
            setStage('start');
            return;
        }

        try {
            setLoading(true);
            const credential = await verifyPhoneOtp(confirmationResult, code);
            const idToken = await credential.user.getIdToken();
            await completeLogin(idToken);
        } catch (err: any) {
            toast.error(err.message || "Invalid Code");
            setLoading(false);
        }
    };

    // OTP Helpers
    const handleOtpChange = (index: number, value: string) => {
        const val = value.replace(/[^0-9]/g, "").slice(0, 1);
        const updated = [...otp];
        updated[index] = val;
        setOtp(updated);
        if (val && index < 5) inputRefs.current[index + 1]?.focus();
    };
    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
    };


    return (
        <div
            className="min-h-screen flex items-center justify-start relative overflow-hidden bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage: "url('/images/army.jpg')",
            }}
        >
            {/* Background Overlay */}
            <div className="absolute inset-0 z-0 bg-black/30" />

            <div className="relative z-10 w-full max-w-md p-4 md:ml-8 lg:ml-16">
                <Card className="bg-card border-2 border-border shadow-2xl overflow-hidden px-2">
                    <CardHeader className="pb-4 pt-6 gap-0">
                        <h1 className="text-2xl font-bold text-foreground uppercase tracking-wide text-center">
                            Admin Login
                        </h1>
                        <p className=" text-muted-foreground text-center">
                            {isVerifyingLink ? "Authenticating..." :
                                stage === 'start' ? "Enter your credentials" :
                                    stage === 'verify' ? "Enter the secure code" :
                                        "Check your inbox"}
                        </p>
                    </CardHeader>

                    <CardContent className="px-6 pb-6">

                        {/* Hidden Recaptcha */}
                        <div id="recaptcha-container"></div>

                        {isVerifyingLink ? (
                            <div className="flex flex-col items-center justify-center py-10 space-y-6">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <div className="text-center space-y-2">
                                    <p className="font-medium text-lg">Verifying Access</p>
                                    <p className="text-sm text-muted-foreground">Please wait while we log you in...</p>
                                </div>
                            </div>
                        ) : stage === 'magic_link_sent' ? (
                            <div className="text-center space-y-4">
                                <div className="p-4 bg-green-50 text-green-700 rounded-md text-sm">
                                    We sent a login link to <strong>{identifier}</strong>.<br />
                                    Click the link in the email to sign in.
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => setStage('start')}
                                    className="w-full"
                                >
                                    Back to Login
                                </Button>
                            </div>
                        ) : stage === 'verify' ? (
                            <div className="space-y-4">
                                <div className="flex justify-center gap-2">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => { inputRefs.current[index] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            className="w-12 h-12 border border-gray-400 text-center text-lg font-bold rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
                                        />
                                    ))}
                                </div>
                                <Button
                                    onClick={() => handleVerifyOtp()}
                                    disabled={loading}
                                    className="w-full font-bold uppercase py-3"
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                                    {loading ? "Verifying..." : "Verify"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setStage('start')}
                                    className="w-full"
                                >
                                    Back
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleContinue} className="space-y-4">
                                <Input
                                    type="text"
                                    placeholder="Email or Phone"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="h-11"
                                    autoFocus
                                />
                                <Button
                                    type="submit"
                                    className="w-full font-bold uppercase py-3"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                                    {loading ? "Checking..." : "Login"}
                                </Button>
                            </form>
                        )}

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function AdminLoginPage() {
    return (
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center">Loading...</div>}>
            <AdminLoginContent />
        </Suspense>
    );
}
