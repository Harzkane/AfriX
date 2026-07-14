"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Verifying your email address...");
    const hasRequested = useRef(false);

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Verification token is missing. Please check your link.");
            return;
        }

        if (hasRequested.current) return;
        hasRequested.current = true;

        const verify = async () => {
            try {
                const response = await api.post("/auth/verify-email", { token });
                if (response.data.success) {
                    setStatus("success");
                    setMessage("Email verified successfully! You can now log into your account on the AfriX app.");
                } else {
                    throw new Error(response.data.message || "Failed to verify email.");
                }
            } catch (err: any) {
                console.error("Verification error:", err);
                setStatus("error");
                setMessage(
                    err.response?.data?.message || 
                    err.message || 
                    "Invalid or expired verification token. Please request a new code in the app."
                );
            }
        };

        verify();
    }, [token]);

    return (
        <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-6">
            {status === "loading" && (
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-4 border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-medium">
                        {message}
                    </p>
                </div>
            )}

            {status === "success" && (
                <div className="flex flex-col items-center space-y-4 w-full">
                    <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                        {message}
                    </p>
                    <div className="w-full pt-4 space-y-2">
                        <Button className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-medium shadow-md shadow-emerald-500/20" asChild>
                            <Link href="/login">
                                Go to Portal Login
                            </Link>
                        </Button>
                    </div>
                </div>
            )}

            {status === "error" && (
                <div className="flex flex-col items-center space-y-4 w-full">
                    <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                        <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                        {message}
                    </p>
                    <div className="w-full pt-4">
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/login">
                                Back to Login
                            </Link>
                        </Button>
                    </div>
                </div>
            )}
        </CardContent>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
            <Card className="w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-green-600" />
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                        Email Verification
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                        AfriX Peer-to-Peer Token Exchange
                    </CardDescription>
                </CardHeader>
                <Suspense fallback={
                    <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                        <p className="text-slate-600 font-medium">Loading verification context...</p>
                    </CardContent>
                }>
                    <VerifyEmailContent />
                </Suspense>
            </Card>
        </div>
    );
}
