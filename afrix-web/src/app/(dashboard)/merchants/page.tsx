"use client";

import { useMerchants } from "@/hooks/useMerchants";
import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Loader2,
    Store,
    Clock,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Pagination } from "@/components/ui/pagination";

export default function MerchantsPage() {
    const {
        merchants,
        pagination,
        isLoading,
        fetchMerchants
    } = useMerchants();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 15;

    // Derived stats
    const totalMerchants = pagination?.total || 0;
    // Note: These derived stats might be inaccurate with pagination if not returned by API
    // We'll rely on API count for total, but for pending/approved we might need separate API calls or rely on what's loaded if small
    // For now, let's keep them as is but acknowledge limitation or if API returns summary stats
    const pendingMerchants = merchants.filter(m => m.verification_status === 'pending').length;
    const approvedMerchants = merchants.filter(m => m.verification_status === 'approved').length;

    useEffect(() => {
        const params: any = {
            limit,
            offset: (currentPage - 1) * limit
        };
        if (activeTab === "pending") {
            params.status = "pending";
        }
        fetchMerchants(params);
    }, [activeTab, currentPage, fetchMerchants]);

    // Reset to page 1 when tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Merchant Partners</h1>
                    <p className="text-sm text-muted-foreground">Onboard and manage merchant businesses</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalMerchants}</div>
                        <p className="text-xs text-muted-foreground">Registered businesses</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingMerchants}</div>
                        <p className="text-xs text-muted-foreground">Applications waiting</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Merchants</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{approvedMerchants}</div>
                        <p className="text-xs text-muted-foreground">Verified and operating</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="all" onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">All Merchants</TabsTrigger>
                    <TabsTrigger value="pending">Pending Review</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Business Name</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                                                Loading merchants...
                                            </TableCell>
                                        </TableRow>
                                    ) : merchants.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                No merchants found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        merchants.map((merchant) => (
                                            <TableRow key={merchant.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{merchant.business_name}</span>
                                                        <span className="text-xs text-muted-foreground">ID: {merchant.kyc?.registration_number || "N/A"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm">{merchant.business_email}</span>
                                                        <span className="text-xs text-muted-foreground">{merchant.business_phone}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {merchant.verification_status === 'approved' && <Badge className="bg-green-600">Approved</Badge>}
                                                    {merchant.verification_status === 'pending' && <Badge variant="secondary">Pending Review</Badge>}
                                                    {merchant.verification_status === 'rejected' && <Badge variant="destructive">Rejected</Badge>}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {format(new Date(merchant.created_at), "MMM d, yyyy")}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => router.push(`/merchants/${merchant.id}`)}>
                                                        Review
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <Pagination
                        currentPage={currentPage}
                        totalCount={pagination?.total || 0}
                        limit={limit}
                        onPageChange={setCurrentPage}
                        isLoading={isLoading}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
