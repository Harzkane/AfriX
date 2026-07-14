"use client";

import { useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2, KeyRound, Smartphone } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import api from "@/lib/api";
import Link from "next/link";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    if (!token) {
        return (
            <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-6">
                <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                </div>
                <div className="space-y-2">
                    <p className="text-slate-700 dark:text-slate-200 font-medium">
                        Reset token is missing or invalid.
                    </p>
                    <p className="text-slate-500 text-sm">
                        Please request a new password reset link from the AfriX app.
                    </p>
                </div>
                <div className="w-full pt-4">
                    <Button variant="outline" className="w-full" asChild>
                        <Link href="/login">
                            Back to Login
                        </Link>
                    </Button>
                </div>
            </CardContent>
        );
    }

    if (success) {
        return (
            <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-6">
                <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="space-y-2">
                    <p className="text-slate-700 dark:text-slate-200 font-medium">
                        Password Reset Successful!
                    </p>
                    <p className="text-slate-500 text-sm">
                        Your password has been updated. You can now log into your account using your new password.
                    </p>
                </div>
                <div className="w-full pt-4 space-y-2">
                    <Button className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-medium shadow-md shadow-emerald-500/20" asChild>
                        <Link href="/login">
                            Go to Portal Login
                        </Link>
                    </Button>
                </div>
            </CardContent>
        );
    }

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        try {
            const response = await api.post("/auth/reset-password", {
                token,
                new_password: password,
            });

            if (response.data.success) {
                setSuccess(true);
            } else {
                throw new Error(response.data.message || "Failed to reset password.");
            }
        } catch (err: any) {
            console.error("Reset password error:", err);
            setError(
                err.response?.data?.message || 
                err.message || 
                "Failed to reset password. The link may have expired or is invalid."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleReset}>
            <CardContent className="grid gap-4 pt-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                
                <div className="rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-3 text-xs flex gap-3 text-emerald-800 dark:text-emerald-300">
                    <Smartphone className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <div>
                        <span className="font-semibold">On a mobile device?</span> You can reset directly in the app.{" "}
                        <a href={`afrix://reset-password?token=${token}`} className="underline font-semibold hover:text-emerald-900 dark:hover:text-emerald-100">
                            Open in AfriX App
                        </a>
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        placeholder="••••••••"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        required
                        value={confirmPassword}
                        placeholder="••••••••"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-medium" type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reset Password
                </Button>
            </CardFooter>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
            <Card className="w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-green-600" />
                <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-2">
                        <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30">
                            <KeyRound className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                        Choose New Password
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                        Enter your new password below to reset your credentials.
                    </CardDescription>
                </CardHeader>
                <Suspense fallback={
                    <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                        <p className="text-slate-600 font-medium">Loading reset context...</p>
                    </CardContent>
                }>
                    <ResetPasswordContent />
                </Suspense>
            </Card>
        </div>
    );
}
