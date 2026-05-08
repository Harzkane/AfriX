"use client";

import { useOperations, MintRequest } from "@/hooks/useOperations";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    Loader2,
    ArrowLeft,
    Coins,
    User,
    Briefcase,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function MintRequestDetailPage() {
    const { id } = useParams();
    const { fetchMintRequest } = useOperations();
    const [request, setRequest] = useState<MintRequest | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            setLoading(true);
            fetchMintRequest(id as string).then((r) => {
                setRequest(r);
                setLoading(false);
            });
        }
    }, [id, fetchMintRequest]);

    const getStatusBadge = (status: string) => {
        const map: Record<string, string> = {
            pending: "bg-yellow-500/10 text-yellow-600",
            proof_submitted: "bg-blue-500/10 text-blue-600",
            confirmed: "bg-green-600",
            cancelled: "bg-destructive/10 text-destructive",
        };
        return <Badge className={map[status] || ""}>{status.replace("_", " ").toUpperCase()}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!request) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/operations/requests">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Requests
                    </Link>
                </Button>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground">Mint request not found.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Button variant="ghost" size="sm" asChild>
                <Link href="/operations/requests">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Requests
                </Link>
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Coins className="h-5 w-5" />
                        Mint Request
                    </CardTitle>
                    <CardDescription>ID: {request.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <div className="mt-1">{getStatusBadge(request.status)}</div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Amount</p>
                            <p className="font-mono font-bold text-lg">
                                {parseFloat(request.amount).toLocaleString()} {request.token_type}
                            </p>
                        </div>
                        {request.expires_at && (
                            <div>
                                <p className="text-sm text-muted-foreground">Expires</p>
                                <p className="text-sm">{format(new Date(request.expires_at), "PPp")}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-muted-foreground">Created</p>
                            <p className="text-sm">{format(new Date(request.created_at), "PPp")}</p>
                        </div>
                        {request.user_bank_reference && (
                            <div className="sm:col-span-2">
                                <p className="text-sm text-muted-foreground">User bank reference</p>
                                <p className="font-mono text-sm">{request.user_bank_reference}</p>
                            </div>
                        )}
                        {request.payment_proof_url && (
                            <div className="sm:col-span-2">
                                <p className="text-sm text-muted-foreground">Payment proof</p>
                                <Button variant="outline" size="sm" asChild>
                                    <a
                                        href={request.payment_proof_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        View proof
                                    </a>
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <User className="h-4 w-4" />
                            User
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {request.user ? (
                            <>
                                <p className="font-medium">{request.user.full_name}</p>
                                <p className="text-sm text-muted-foreground">{request.user.email}</p>
                                {request.user.phone_number && (
                                    <p className="text-sm text-muted-foreground">{request.user.phone_number}</p>
                                )}
                                <Button variant="link" className="px-0 mt-2" asChild>
                                    <Link href={`/users/${request.user.id}`}>View user</Link>
                                </Button>
                            </>
                        ) : (
                            <p className="text-muted-foreground text-sm">User not loaded</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Agent
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {request.agent ? (
                            <>
                                <p className="font-medium">Tier: {request.agent.tier}</p>
                                <p className="text-sm text-muted-foreground">Rating: {request.agent.rating}</p>
                                {request.agent.deposit_usd != null && (
                                    <p className="text-sm text-muted-foreground">Deposit: ${request.agent.deposit_usd}</p>
                                )}
                                <Button variant="link" className="px-0 mt-2" asChild>
                                    <Link href={`/agents/${request.agent.id}`}>View agent</Link>
                                </Button>
                            </>
                        ) : (
                            <p className="text-muted-foreground text-sm">Agent not loaded</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
