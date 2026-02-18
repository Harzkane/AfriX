"use client";

import { useUsers } from "@/hooks/useUsers";
import { useFinancials } from "@/hooks/useFinancials";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Loader2,
    ArrowLeft,
    CheckCircle,
    XCircle,
    Shield,
    Mail,
    Phone,
    MapPin,
    Lock,
    Unlock,
    Wallet,
    AlertTriangle,
    Clock,
    Globe,
    Bell,
    BookOpen,
    UserCheck,
    Briefcase,
    Store,
    KeyRound,
    Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function UserDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const {
        currentUser,
        isLoading,
        fetchUser,
        suspendUser,
        unsuspendUser,
        verifyEmail,
        creditWallet,
        debitWallet,
        freezeWallet,
        unfreezeWallet
    } = useUsers();
    const { fetchTransactions, transactions: userTransactions, isLoading: isTxLoading } = useFinancials();

    // Action Dialogs
    const [suspendDialog, setSuspendDialog] = useState(false);
    const [suspensionReason, setSuspensionReason] = useState("");

    // Wallet Action Dialog
    const [walletDialog, setWalletDialog] = useState<{
        type: 'credit' | 'debit' | 'freeze' | 'unfreeze' | null;
        tokenType: string;
        open: boolean;
    }>({ type: null, tokenType: '', open: false });

    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
        if (id) {
            fetchUser(id as string);
            fetchTransactions({ user_id: id });
        }
    }, [id, fetchUser, fetchTransactions]);

    if (isLoading || !currentUser) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const handleSuspend = async () => {
        setIsActionLoading(true);
        try {
            await suspendUser(currentUser.id, suspensionReason);
            setSuspendDialog(false);
            setSuspensionReason("");
        } catch (error) {
            // Handled
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleWalletAction = async () => {
        setIsActionLoading(true);
        try {
            const { type, tokenType } = walletDialog;
            if (type === 'credit') {
                await creditWallet(currentUser.id, { amount: parseFloat(amount), token_type: tokenType, description });
            } else if (type === 'debit') {
                await debitWallet(currentUser.id, { amount: parseFloat(amount), token_type: tokenType, description });
            } else if (type === 'freeze') {
                await freezeWallet(currentUser.id, tokenType, description); // description used as reason
            } else if (type === 'unfreeze') {
                await unfreezeWallet(currentUser.id, tokenType);
            }
            setWalletDialog({ type: null, tokenType: '', open: false });
            setAmount("");
            setDescription("");
            await fetchUser(currentUser.id); // Refresh data
        } catch (error) {
            // Handled
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{currentUser.full_name}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" /> {currentUser.email}
                        <span>•</span>
                        <Badge variant="outline">{currentUser.role.toUpperCase()}</Badge>
                    </div>
                </div>
                <div className="ml-auto flex gap-2">
                    {currentUser.is_suspended ? (
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => unsuspendUser(currentUser.id)}
                        >
                            <Unlock className="mr-2 h-4 w-4" /> Unsuspend Account
                        </Button>
                    ) : (
                        <Button
                            variant="destructive"
                            onClick={() => setSuspendDialog(true)}
                        >
                            <Lock className="mr-2 h-4 w-4" /> Suspend Account
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="wallets">Wallets & Finance</TabsTrigger>
                    <TabsTrigger value="activity">Activity Log</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    {/* Profile & Contact */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserCheck className="h-5 w-5" /> Profile & Contact
                            </CardTitle>
                            <CardDescription>Basic profile and contact information.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="font-medium">{currentUser.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Phone</p>
                                        <p className="font-medium">{currentUser.phone_number || "—"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Country</p>
                                        <p className="font-medium">{(currentUser.country ?? currentUser.country_code) || "—"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Joined</p>
                                        <p className="font-medium">{format(new Date(currentUser.created_at), "MMM d, yyyy")}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Last Login</p>
                                        <p className="font-medium">{currentUser.last_login_at ? format(new Date(currentUser.last_login_at), "MMM d, yyyy HH:mm") : "Never"}</p>
                                    </div>
                                </div>
                                {currentUser.last_login_ip && (
                                    <div className="flex items-center gap-3">
                                        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Last Login IP</p>
                                            <p className="font-mono text-sm">{currentUser.last_login_ip}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Verification Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" /> Verification Status
                                </CardTitle>
                                <CardDescription>Email, phone, and identity verification.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Email</span>
                                    {currentUser.email_verified ? (
                                        <Badge variant="outline" className="text-green-600 bg-green-50 dark:bg-green-950/30 dark:border-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Verified</Badge>
                                    ) : (
                                        <Button variant="link" size="sm" className="h-auto p-0" onClick={() => verifyEmail(currentUser.id)}>Verify Now</Button>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Phone</span>
                                    {currentUser.phone_verified ? (
                                        <Badge variant="outline" className="text-green-600 bg-green-50 dark:bg-green-950/30"><CheckCircle className="w-3 h-3 mr-1" /> Verified</Badge>
                                    ) : (
                                        <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" /> Unverified</Badge>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Identity (KYC)</span>
                                    {currentUser.identity_verified ? (
                                        <Badge variant="outline" className="text-green-600 bg-green-50 dark:bg-green-950/30"><Shield className="w-3 h-3 mr-1" /> Level {currentUser.verification_level}</Badge>
                                    ) : (
                                        <Badge variant="secondary">Unverified</Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground pt-1">Verification level: 0=None, 1=Email, 2=Phone, 3=Identity</p>
                            </CardContent>
                        </Card>

                        {/* Account & Security */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <KeyRound className="h-5 w-5" /> Account & Security
                                </CardTitle>
                                <CardDescription>Status, 2FA, and security flags.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Account</span>
                                    {currentUser.is_suspended ? (
                                        <Badge variant="destructive"><Lock className="w-3 h-3 mr-1" /> Suspended</Badge>
                                    ) : currentUser.is_active ? (
                                        <Badge variant="outline" className="text-green-600 bg-green-50 dark:bg-green-950/30"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>
                                    ) : (
                                        <Badge variant="secondary">Inactive</Badge>
                                    )}
                                </div>
                                {currentUser.is_suspended && (currentUser.suspension_reason || currentUser.suspended_until) && (
                                    <div className="rounded-md border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800 p-3 text-sm">
                                        {currentUser.suspension_reason && <p><strong>Reason:</strong> {currentUser.suspension_reason}</p>}
                                        {currentUser.suspended_until && <p className="text-muted-foreground">Until: {format(new Date(currentUser.suspended_until), "MMM d, yyyy")}</p>}
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">2FA</span>
                                    {currentUser.two_factor_enabled ? (
                                        <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Enabled</Badge>
                                    ) : (
                                        <Badge variant="secondary">Disabled</Badge>
                                    )}
                                </div>
                                {currentUser.locked_until && new Date(currentUser.locked_until) > new Date() && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Locked until</span>
                                        <span className="text-sm text-amber-600">{format(new Date(currentUser.locked_until), "MMM d, HH:mm")}</span>
                                    </div>
                                )}
                                {(currentUser.login_attempts ?? 0) > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Failed login attempts</span>
                                        <span className="font-mono">{currentUser.login_attempts}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Education Progress */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" /> Education Progress
                            </CardTitle>
                            <CardDescription>Completed platform education modules (required for mint/burn).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {[
                                    { key: "education_what_are_tokens", label: "What Are Tokens?", value: currentUser.education_what_are_tokens },
                                    { key: "education_how_agents_work", label: "How Agents Work", value: currentUser.education_how_agents_work },
                                    { key: "education_understanding_value", label: "Understanding Value", value: currentUser.education_understanding_value },
                                    { key: "education_safety_security", label: "Safety & Security", value: currentUser.education_safety_security },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex items-center justify-between rounded-lg border p-3">
                                        <span className="text-sm">{label}</span>
                                        {value ? <CheckCircle className="h-5 w-5 text-green-600 shrink-0" /> : <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

<div className="grid gap-6 md:grid-cols-2">
                    {/* Preferences & Referral */}
                    <div className="">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5" /> Preferences
                                </CardTitle>
                                <CardDescription>Language, theme, and notifications.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">Language</span><span className="capitalize">{currentUser.language || "—"}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Theme</span><span className="capitalize">{currentUser.theme || "—"}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Push notifications</span><span>{currentUser.push_notifications_enabled !== false ? "On" : "Off"}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Email notifications</span><span>{currentUser.email_notifications_enabled !== false ? "On" : "Off"}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">SMS notifications</span><span>{currentUser.sms_notifications_enabled ? "On" : "Off"}</span></div>
                            </CardContent>
                        </Card>

                        {(currentUser.referral_code || currentUser.referred_by) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Link2 className="h-5 w-5" /> Referral
                                    </CardTitle>
                                    <CardDescription>Referral code and referrer.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    {currentUser.referral_code && <div className="flex justify-between"><span className="text-muted-foreground">Referral code</span><span className="font-mono">{currentUser.referral_code}</span></div>}
                                    {currentUser.referred_by && <div className="flex justify-between"><span className="text-muted-foreground">Referred by</span><span className="font-mono text-xs">{currentUser.referred_by}</span></div>}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Agent / Merchant summary */}
                    {(currentUser.agent || currentUser.merchant) && (
                        <div className=" gap-6">
                            {currentUser.agent && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Briefcase className="h-5 w-5" /> Agent Profile
                                        </CardTitle>
                                        <CardDescription>This user is also an agent.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status</span><Badge variant="outline" className="capitalize">{currentUser.agent.status}</Badge></div>
                                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tier</span><span className="capitalize">{currentUser.agent.tier}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Deposit</span><span className="font-mono">{Number(currentUser.agent.deposit_usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">KYC</span>{currentUser.agent.is_verified ? <Badge className="bg-green-600">Verified</Badge> : <Badge variant="secondary">Unverified</Badge>}</div>
                                        <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                                            <Link href={`/agents/${currentUser.agent.id}`}>View Agent Details</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                            {currentUser.merchant && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Store className="h-5 w-5" /> Merchant Profile
                                        </CardTitle>
                                        <CardDescription>This user is also a merchant.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Business</span><span className="font-medium">{currentUser.merchant.business_name}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Verification</span><Badge variant="outline" className="capitalize">{currentUser.merchant.verification_status}</Badge></div>
                                        <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                                            <Link href={`/merchants/${currentUser.merchant.id}`}>View Merchant Details</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    </div>
                    {/* Transaction Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction Summary</CardTitle>
                            <CardDescription>Lifetime activity for this user.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="rounded-lg border bg-muted/40 p-4">
                                    <p className="text-xs text-muted-foreground uppercase">Total Transactions</p>
                                    <p className="text-2xl font-bold">{currentUser.transaction_summary?.total_transactions ?? 0}</p>
                                </div>
                                <div className="rounded-lg border bg-muted/40 p-4">
                                    <p className="text-xs text-muted-foreground uppercase">Total Sent</p>
                                    <p className="text-2xl font-bold text-red-500 font-mono">-{(currentUser.transaction_summary?.total_sent ?? 0).toFixed(2)}</p>
                                </div>
                                <div className="rounded-lg border bg-muted/40 p-4">
                                    <p className="text-xs text-muted-foreground uppercase">Total Received</p>
                                    <p className="text-2xl font-bold text-green-600 font-mono">+{(currentUser.transaction_summary?.total_received ?? 0).toFixed(2)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Wallets Tab */}
                <TabsContent value="wallets" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="h-5 w-5" /> User Wallets
                            </CardTitle>
                            <CardDescription>Token balances, activity, and admin actions (credit, debit, freeze).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!currentUser.wallets?.length ? (
                                <div className="text-center py-8 text-muted-foreground">No wallets found for this user.</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Token</TableHead>
                                            <TableHead>Balance</TableHead>
                                            <TableHead>Pending</TableHead>
                                            <TableHead>Received / Sent</TableHead>
                                            <TableHead>Tx Count</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentUser.wallets.map((wallet) => (
                                            <TableRow key={wallet.id}>
                                                <TableCell className="font-bold">{wallet.token_type}</TableCell>
                                                <TableCell className="font-mono">
                                                    <span className="text-lg">{parseFloat(wallet.balance).toLocaleString()}</span>
                                                    <span className="text-xs text-muted-foreground ml-1">{wallet.token_type}</span>
                                                </TableCell>
                                                <TableCell className="font-mono text-muted-foreground">
                                                    {wallet.pending_balance != null ? parseFloat(wallet.pending_balance).toLocaleString() : "—"}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {wallet.total_received != null || wallet.total_sent != null ? (
                                                        <span><span className="text-green-600">+{wallet.total_received != null ? parseFloat(wallet.total_received).toLocaleString() : "0"}</span> / <span className="text-red-500">-{wallet.total_sent != null ? parseFloat(wallet.total_sent).toLocaleString() : "0"}</span></span>
                                                    ) : "—"}
                                                </TableCell>
                                                <TableCell>{wallet.transaction_count != null ? wallet.transaction_count : "—"}</TableCell>
                                                <TableCell>
                                                    {wallet.is_frozen ? (
                                                        <div className="space-y-0.5">
                                                            <Badge variant="destructive" className="flex items-center w-fit">
                                                                <Lock className="w-3 h-3 mr-1" /> Frozen
                                                            </Badge>
                                                            {wallet.frozen_reason && <p className="text-xs text-muted-foreground max-w-[140px] truncate" title={wallet.frozen_reason}>{wallet.frozen_reason}</p>}
                                                        </div>
                                                    ) : (
                                                        <Badge variant="outline" className="flex items-center w-fit text-green-600 bg-green-50 dark:bg-green-950/30">
                                                            <CheckCircle className="w-3 h-3 mr-1" /> Active
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button size="sm" variant="outline" onClick={() => setWalletDialog({ type: 'credit', tokenType: wallet.token_type, open: true })}>
                                                        Credit
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => setWalletDialog({ type: 'debit', tokenType: wallet.token_type, open: true })}>
                                                        Debit
                                                    </Button>
                                                    {wallet.is_frozen ? (
                                                        <Button size="sm" variant="default" className="bg-green-600" onClick={() => setWalletDialog({ type: 'unfreeze', tokenType: wallet.token_type, open: true })}>
                                                            Unfreeze
                                                        </Button>
                                                    ) : (
                                                        <Button size="sm" variant="destructive" onClick={() => setWalletDialog({ type: 'freeze', tokenType: wallet.token_type, open: true })}>
                                                            Freeze
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Latest transactions for this user.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isTxLoading ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : userTransactions.length === 0 ? (
                                <div className="text-center p-8 text-muted-foreground">
                                    No transactions found for this user.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Reference</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {userTransactions.map((tx) => (
                                            <TableRow key={tx.id}>
                                                <TableCell className="text-sm">
                                                    {format(new Date(tx.created_at), "MMM d, HH:mm")}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{tx.reference}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">
                                                        {tx.type.toLowerCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={tx.fromUser?.id === id ? "text-red-500" : "text-green-600"}>
                                                        {tx.fromUser?.id === id ? "-" : "+"}
                                                        {parseFloat(tx.amount).toLocaleString()} {tx.token_type}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={tx.status === 'completed' ? 'default' : tx.status === 'pending' ? 'secondary' : 'destructive'}
                                                        className={tx.status === 'completed' ? "bg-green-600" : ""}
                                                    >
                                                        {tx.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Suspend Dialog */}
            <Dialog open={suspendDialog} onOpenChange={setSuspendDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Suspend User Account</DialogTitle>
                        <DialogDescription>
                            This will prevent <strong>{currentUser.full_name}</strong> from logging in or performing any actions.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Reason for Suspension</Label>
                            <Input
                                placeholder="e.g. Violation of Terms of Service"
                                value={suspensionReason}
                                onChange={(e) => setSuspensionReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSuspendDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleSuspend} disabled={!suspensionReason || isActionLoading}>
                            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Suspend User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Wallet Action Dialog */}
            <Dialog open={walletDialog.open} onOpenChange={(open) => setWalletDialog(prev => ({ ...prev, open }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="capitalize">
                            {walletDialog.type} {walletDialog.tokenType} Wallet
                        </DialogTitle>
                        <DialogDescription>
                            {walletDialog.type === 'freeze' ? 'This will prevent any outgoing transactions from this wallet.' :
                                walletDialog.type === 'unfreeze' ? 'This will restore full access to this wallet.' :
                                    `Manually adjust the ${walletDialog.tokenType} balance for this user.`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {(walletDialog.type === 'credit' || walletDialog.type === 'debit') && (
                            <div className="space-y-2">
                                <Label>Amount</Label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>{walletDialog.type === 'freeze' ? 'Reason' : 'Description/Note'}</Label>
                            <Input
                                placeholder={walletDialog.type === 'freeze' ? 'e.g. Suspicious activity' : 'e.g. Admin correction'}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setWalletDialog({ type: null, tokenType: '', open: false })}>Cancel</Button>
                        <Button
                            variant={walletDialog.type === 'debit' || walletDialog.type === 'freeze' ? 'destructive' : 'default'}
                            onClick={handleWalletAction}
                            disabled={isActionLoading || ((walletDialog.type === 'credit' || walletDialog.type === 'debit') && !amount)}
                        >
                            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm {walletDialog.type}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
