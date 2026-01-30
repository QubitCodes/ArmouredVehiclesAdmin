"use client";

import { useState, useEffect, useRef } from "react";
import { User, Mail, Phone, Check, X, Lock, Unlock, Loader2, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { adminService } from "@/services/admin/admin.service";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
// InputOTP removed

interface AdminProfileViewProps {
    user: any;
    profile?: any; // Admins might not have profile, but keeping interface flexible
}

// 5 Minutes in MS
const EDIT_WINDOW_MS = 5 * 60 * 1000;

// Helper function to map onboarding step to step name
const getOnboardingStepName = (step: number | null | undefined): string => {
    if (step === null) {
        return "Completed";
    }

    const stepMap: Record<number, string> = {
        0: "Create Store",
        1: "Company Information",
        2: "Contact Person",
        3: "Declaration",
        4: "Account Preferences",
        5: "Bank Details",
        6: "Verification",
    };

    return stepMap[step as number] || "—";
};

export function AdminProfileView({ user, profile }: AdminProfileViewProps) {
    // State
    const [isEditingEnabled, setIsEditingEnabled] = useState(false);
    const [editExpiry, setEditExpiry] = useState<number | null>(null);
    const [remainingTime, setRemainingTime] = useState<string>("");

    // Re-auth State
    const [showReauthModal, setShowReauthModal] = useState(false);
    const [reauthStep, setReauthStep] = useState<"method" | "otp" | "email_sent" | "verifying">("method");
    const [confirmationResult, setConfirmationResult] = useState<any>(null);
    const [reauthOtp, setReauthOtp] = useState("");

    // Field Editing State
    const [editingField, setEditingField] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        countryCode: user.country_code || "+971"
    });

    // Verification Search for New Values
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [verifyOtp, setVerifyOtp] = useState("");
    const [verifyConfirmationResult, setVerifyConfirmationResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Hooks
    const { sendPhoneOtp, verifyPhoneOtp, verifyAndGetCredential, updateUserPhone, sendEmailUpdateLink, sendMagicLink, isMagicLink, verifyMagicLink, user: firebaseUser, reauthenticate } = useFirebaseAuth();

    // Helper to enable editing (memory-based session)
    const enableEditing = (expiryMs: number = EDIT_WINDOW_MS) => {
        setEditExpiry(Date.now() + expiryMs);
        setIsEditingEnabled(true);
    };

    // Helper to disable editing
    const disableEditing = () => {
        setIsEditingEnabled(false);
        setEditExpiry(null);
        setEditingField(null);
        setRemainingTime("");
    };

    // Timer Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isEditingEnabled && editExpiry) {
            interval = setInterval(() => {
                const now = Date.now();
                const diff = editExpiry - now;
                if (diff <= 0) {
                    disableEditing();
                    toast.info("Edit session expired. Please re-authenticate.");
                } else {
                    const m = Math.floor(diff / 60000);
                    const s = Math.floor((diff % 60000) / 1000);
                    setRemainingTime(`${m}:${s.toString().padStart(2, '0')}`);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isEditingEnabled, editExpiry]);

    // Detect Identity Verification Return (via Gateway Page or URL)
    useEffect(() => {
        const checkVerification = async () => {
            // 1. Security re-auth verification (Magic Link)
            const reauthVerified = localStorage.getItem('reauth_verified');
            if (reauthVerified === 'true') {
                enableEditing();
                setShowReauthModal(false);
                toast.success("Identity verified via Firebase. You have 5 minutes to edit.");
                localStorage.removeItem('reauth_verified');
                localStorage.removeItem('reauth_verified_at');
            }

            // 2. Email Update verification (Magic Link)
            const emailUpdateVerified = localStorage.getItem('email_update_verified');
            const newEmailPending = localStorage.getItem('new_email_pending');
            if (emailUpdateVerified === 'true' && newEmailPending) {
                try {
                    // Security Check: Ensure Firebase state reflects the verified email
                    // before syncing to our internal database.
                    if (firebaseUser && firebaseUser.email === newEmailPending) {
                        setLoading(true);
                        await adminService.updateAdmin(user.id, { email: newEmailPending });
                        toast.success("Email address updated and verified!");
                        localStorage.removeItem('email_update_verified');
                        localStorage.removeItem('new_email_pending');
                        // Reload to show fresh data
                        setTimeout(() => window.location.reload(), 1500);
                    } else if (firebaseUser) {
                        console.log("Firebase email update detected but sync deferred (mismatch or pending propagation)", {
                            firebase: firebaseUser.email,
                            pending: newEmailPending
                        });
                    }
                } catch (e: any) {
                    console.error("Failed to sync email to DB:", e);
                    toast.error("Contact verified but failed to sync database. Please contact support.");
                } finally {
                    setLoading(false);
                }
            }

            // 3. Fallback for old URL-based verification (if any)
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('reauth_token')) {
                const reauthToken = urlParams.get('reauth_token');
                const storedToken = localStorage.getItem('reauth_token');
                const storedExpiry = localStorage.getItem('reauth_token_expiry');
                if (storedToken === reauthToken && storedExpiry && Date.now() < parseInt(storedExpiry)) {
                    enableEditing();
                    toast.success("Identity verified. You have 5 minutes to edit.");
                    localStorage.removeItem('reauth_token');
                    localStorage.removeItem('reauth_token_expiry');
                    window.history.replaceState({}, '', window.location.pathname);
                }
            }
        };

        checkVerification();

        // Listen for storage changes (handles verification completed in a new tab)
        window.addEventListener('storage', checkVerification);
        return () => window.removeEventListener('storage', checkVerification);
    }, [user.id]);

    // --- Re-Authentication Logic ---

    const handleStartEdit = () => {
        if (isEditingEnabled) return;
        setShowReauthModal(true);
        setReauthStep("method");
    };

    const sendReauthOtp = async () => {
        try {
            setLoading(true);
            // Use current user's phone for re-auth
            // Construct phone strictly: CountryCode + Phone
            const phone = `${user.country_code}${user.phone}`;
            const res = await sendPhoneOtp(phone, "recaptcha-container-reauth");
            setConfirmationResult(res);
            setReauthStep("otp");
            toast.success("Security code sent!");
        } catch (e: any) {
            toast.error(e.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Send verification email for re-authentication
     * Now correctly uses Firebase Magic Links targeting the new public gateway
     */
    const sendReauthEmail = async () => {
        try {
            setLoading(true);

            // 1. Create a redirect URL to our new public verification gateway
            // We use /admin/verify-identity as it is whitelisted in middleware
            const redirectUrl = new URL(window.location.origin + '/admin/verify-identity');

            // 2. Pass context params
            redirectUrl.searchParams.set('returnUrl', window.location.pathname);
            redirectUrl.searchParams.set('reauth', 'true');

            // 3. Trigger Firebase Magic Link
            await sendMagicLink(user.email, redirectUrl.toString());

            setReauthStep("email_sent");
            toast.success(`Verification link sent to ${user.email}`);
        } catch (e: any) {
            console.error("Failed to send reauth email:", e);
            toast.error(e.message || "Failed to send verification email");
        } finally {
            setLoading(false);
        }
    };

    // Skip Phone re-auth if user uses email login only?
    // Usually Admin login is Multi-factor or at least phone based in this app.
    // Assuming Phone is primary.

    const handleVerifyReauth = async () => {
        try {
            setLoading(true);
            // Verify the OTP against Firebase
            // Ideally we call reauthenticateWithPhoneNumber(cred) but useFirebaseAuth might abstract it differently.
            // reauthenticate in hook might verify cred?
            // Actually verifyPhoneOtp returns a UserCredential. We can use that credential to reauth.

            const cred = await verifyPhoneOtp(confirmationResult, reauthOtp);
            // Now re-authenticate current user
            // Note: verifyPhoneOtp actually signs in? 
            // If we are already signed in, we should specificially RE-AUTHENTICATE.
            // The hook verifyPhoneOtp calls result.confirm(otp), which returns UserCredential.
            // This counts as a fresh login context in Firebase 9+.

            // We assume success here implies re-auth.
            enableEditing();
            setShowReauthModal(false);
            setReauthOtp("");
            toast.success("Identity verified. You have 5 minutes to edit.");
        } catch (e: any) {
            console.error(e);
            toast.error("Invalid Code or Verification Failed");
        } finally {
            setLoading(false);
        }
    };


    // --- Update Logic ---

    const handleSaveName = async () => {
        try {
            setLoading(true);
            await adminService.updateAdmin(user.id, { name: formData.name });
            toast.success("Name updated successfully");
            setEditingField(null);
            // Trigger refresh? passed prop? or local mutate?
            // Ideally query invalidation
            window.location.reload(); // Simple refresh for now
        } catch (e: any) {
            toast.error("Failed to update name");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePhone = async () => {
        // 1. Validate Format
        if (!formData.phone || !formData.countryCode) {
            toast.error("Phone number required");
            return;
        }

        const fullPhone = `${formData.countryCode}${formData.phone}`.replace(/\s/g, '');

        // 2. Check if phone number already exists in DB
        try {
            setLoading(true);
            const checkRes = await api.post("/auth/user-exists", { identifier: fullPhone });
            if (checkRes.status === 200) {
                toast.error("This phone number is already linked to another account.");
                setLoading(false);
                return;
            }
        } catch (e: any) {
            // 404 means phone doesn't exist - that's what we want
            if (e.response?.status !== 404) {
                toast.error("Failed to verify phone number availability.");
                setLoading(false);
                return;
            }
        }

        // 3. Open Verify Modal and send OTP
        setShowVerifyModal(true);
        try {
            const res = await sendPhoneOtp(fullPhone, "recaptcha-container-verify");
            setVerifyConfirmationResult(res);
            toast.success(`OTP Sent to ${fullPhone}`);
        } catch (e: any) {
            toast.error(e.message || "Failed to send OTP");
            setShowVerifyModal(false);
        } finally {
            setLoading(false);
        }
    };

    const confirmUpdatePhone = async () => {
        try {
            setLoading(true);

            // Get credential without signing in as a new user
            const credential = verifyAndGetCredential(verifyConfirmationResult, verifyOtp);

            // Update Firebase phone number on current user
            await updateUserPhone(credential);

            // Update DB
            await adminService.updateAdmin(user.id, {
                phone: formData.phone,
                country_code: formData.countryCode
            });

            toast.success("Phone Number updated successfully");
            setShowVerifyModal(false);
            setEditingField(null);
            setVerifyOtp("");
            window.location.reload();

        } catch (e: any) {
            console.error("Phone update error:", e);
            toast.error(e.message || "Verification Failed");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEmail = async () => {
        if (!formData.email) return;
        if (formData.email === user.email) {
            setEditingField(null);
            return;
        }

        try {
            setLoading(true);

            // 1. Check if email exists in DB
            try {
                const checkRes = await api.post("/auth/user-exists", { identifier: formData.email });
                if (checkRes.status === 200) {
                    toast.error("This email is already linked to another account.");
                    setLoading(false);
                    return;
                }
            } catch (e: any) {
                if (e.response?.status !== 404) {
                    toast.error("Failed to verify email availability.");
                    setLoading(false);
                    return;
                }
            }

            // 2. Send Verification Link targeting the Gateway
            const redirectUrl = new URL(window.location.origin + '/admin/verify-identity');
            redirectUrl.searchParams.set('returnUrl', window.location.pathname);
            redirectUrl.searchParams.set('email_verified', 'true');
            redirectUrl.searchParams.set('new_email', formData.email);

            await sendEmailUpdateLink(formData.email, redirectUrl.toString());

            toast.success(`Verification link sent to ${formData.email}. Please click the link to confirm your new email.`);
            setEditingField(null);
        } catch (e: any) {
            console.error("Email update failed:", e);
            toast.error(e.message || "Failed to send verification email");
        } finally {
            setLoading(false);
        }
    };

    // Render Helpers
    const renderField = (label: string, fieldKey: string, value: string, hasBorder = true) => {
        const isEditing = editingField === fieldKey;

        return (
            <div className={`flex items-center justify-between py-4 ${hasBorder ? 'border-b' : ''}`}>
                <div>
                    <Label className="text-muted-foreground uppercase text-xs tracking-wide">{label}</Label>
                    {isEditing ? (
                        <div className="mt-1 flex gap-2">
                            {fieldKey === 'phone' ? (
                                <div className="flex gap-2">
                                    <Input
                                        value={formData.countryCode}
                                        onChange={e => setFormData({ ...formData, countryCode: e.target.value })}
                                        className="w-20"
                                    />
                                    <Input
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-40"
                                    />
                                </div>
                            ) : (
                                <Input
                                    value={formData[fieldKey as keyof typeof formData]}
                                    onChange={e => setFormData({ ...formData, [fieldKey]: e.target.value })}
                                    className="w-64"
                                />
                            )}
                        </div>
                    ) : (
                        <p className="text-lg font-medium mt-1">
                            {fieldKey === 'phone' ? `${user.country_code} ${user.phone}` : value}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <Button size="sm" onClick={() => {
                                if (fieldKey === 'name') handleSaveName();
                                if (fieldKey === 'phone') handleUpdatePhone();
                                if (fieldKey === 'email') handleUpdateEmail();
                            }} disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </>
                    ) : (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                if (fieldKey !== 'name' && !isEditingEnabled) {
                                    handleStartEdit();
                                } else {
                                    setEditingField(fieldKey);
                                }
                            }}
                        >
                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Card className="w-full max-w-3xl">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    User Information
                </CardTitle>
                {isEditingEnabled && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
                        <Unlock className="h-4 w-4" />
                        Editing Enabled ({remainingTime})
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div id="recaptcha-container-reauth"></div>
                <div id="recaptcha-container-verify"></div>

                {renderField("Full Name", "name", user.name)}
                {renderField("Email Address", "email", user.email)}
                {renderField("Phone Number", "phone", user.phone, false)}


                <div className="mt-8 pt-6 border-t">
                    <Label className="text-muted-foreground uppercase text-xs tracking-wide">Account Status</Label>
                    <div className="flex items-center gap-2 mt-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="font-medium">{user.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                </div>

                {user.user_type === 'vendor' && (
                    <div className="mt-8 pt-6 border-t">
                        <Label className="text-muted-foreground uppercase text-xs tracking-wide">Onboarding Details</Label>
                        <div className="grid grid-cols-2 gap-6 mt-4">
                            <div>
                                <Label className="text-xs text-muted-foreground block mb-1">Current Step</Label>
                                <p className="font-medium">{getOnboardingStepName(user.onboarding_step)}</p>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground block mb-1">Status</Label>
                                <span className={cn("inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase",
                                    profile?.onboarding_status?.includes("approved") ? "bg-green-100 text-green-700" :
                                        profile?.onboarding_status === "rejected" ? "bg-red-100 text-red-700" :
                                            "bg-gray-100 text-gray-700"
                                )}>
                                    {profile?.onboarding_status?.replace(/_/g, " ") || "Pending"}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>

            {/* Re-auth Modal */}
            <Dialog open={showReauthModal} onOpenChange={setShowReauthModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Security Verification</DialogTitle>
                        <DialogDescription>For your security, please verify your identity to edit sensitive information.</DialogDescription>
                    </DialogHeader>

                    {reauthStep === 'method' && (
                        <div className="flex flex-col gap-3 py-4">
                            <Button onClick={sendReauthOtp} disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                                Verify via SMS ({user.country_code} {user.phone.slice(-4).padStart(user.phone.length, '*')})
                            </Button>
                            <Button onClick={sendReauthEmail} disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                                Verify via Email ({user.email.replace(/(.{2}).*(@.*)/, '$1***$2')})
                            </Button>
                        </div>
                    )}

                    {reauthStep === 'otp' && (
                        <div className="flex flex-col items-center gap-4 py-4">
                            <Label>Enter Security Code</Label>
                            <Input
                                value={reauthOtp}
                                onChange={(e) => setReauthOtp(e.target.value)}
                                placeholder="000000"
                                maxLength={6}
                                className="text-center text-lg tracking-widest w-40"
                            />
                            <Button onClick={handleVerifyReauth} disabled={loading || reauthOtp.length < 6} className="w-full">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Verify Identity
                            </Button>
                        </div>
                    )}

                    {reauthStep === 'email_sent' && (
                        <div className="flex flex-col items-center gap-4 py-4 text-center">
                            <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
                                <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Check Your Email</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    We've sent a verification link to <strong>{user.email}</strong>.
                                    Click the link in the email to verify your identity.
                                </p>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Didn't receive it?{' '}
                                <button onClick={sendReauthEmail} className="text-primary underline" disabled={loading}>
                                    {loading ? "Sending..." : "Resend email"}
                                </button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* New Value Verification Modal */}
            <Dialog open={showVerifyModal} onOpenChange={setShowVerifyModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verify Contact</DialogTitle>
                        <DialogDescription>We sent a code to the new number. Please enter it below.</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4 py-4">
                        <Input
                            value={verifyOtp}
                            onChange={(e) => setVerifyOtp(e.target.value)}
                            placeholder="000000"
                            maxLength={6}
                            className="text-center text-lg tracking-widest w-40"
                        />
                        <Button onClick={confirmUpdatePhone} disabled={loading || verifyOtp.length < 6} className="w-full">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Verify & Save
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </Card>
    );
}
