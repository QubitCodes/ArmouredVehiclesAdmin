"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Shield, User, Store } from "lucide-react";
import { x_useLoginStart } from "@/hooks/admin/(auth)/x_use-login";
import { x_useVerifyOtp } from "@/hooks/admin/(auth)/x_use-verify-otp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const QUICK_USERS = [
  { label: "Super Admin", email: "sa@demo.com", icon: Shield, role: "super_admin" },
  { label: "Admin", email: "admin@demo.com", icon: Shield, role: "admin" },
  { label: "Vendor", email: "vendor@demo.com", icon: Store, role: "vendor" },
  { label: "Customer", email: "customer@demo.com", icon: User, role: "customer" },
];

export function QuickLoginBox() {
  const router = useRouter();
  const [loadingUser, setLoadingUser] = useState<string | null>(null);

  const loginMutation = x_useLoginStart();
  const verifyMutation = x_useVerifyOtp();

  const handleQuickLogin = async (email: string) => {
    try {
      setLoadingUser(email);

      // 1. Request OTP
      toast.info(`Requesting OTP for ${email}...`);
      await loginMutation.mutateAsync({ identifier: email });

      // 2. Verify OTP (Hardcoded 123456)
      toast.info("Verifying OTP...");
      const verifyResponse = await verifyMutation.mutateAsync({
        identifier: email,
        code: "123456",
      });

      toast.success(`Welcome back, ${verifyResponse.data?.user?.name || "User"}!`);

      // 3. Redirect
      router.push("/admin");

    } catch (error: any) {
      console.error("Quick Login Failed:", error);
      toast.error(error.message || "Quick login failed");
    } finally {
      setLoadingUser(null);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Card className="w-64 border-2 border-primary/20 shadow-2xl bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Quick Login</span>
            <span className="text-[10px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded">DEBUG</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pb-4">
          {QUICK_USERS.map((user) => {
            const Icon = user.icon;
            const isLoading = loadingUser === user.email;

            return (
              <Button
                key={user.email}
                variant="outline"
                className="w-full justify-start relative h-10 hover:bg-secondary/5 hover:border-secondary/30 transition-all font-medium"
                onClick={() => handleQuickLogin(user.email)}
                disabled={!!loadingUser}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin text-secondary" />
                ) : (
                  <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                )}
                <span className="flex-1 text-left">{user.label}</span>
                {isLoading && <span className="text-[10px] text-muted-foreground animate-pulse">Processing...</span>}
              </Button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
