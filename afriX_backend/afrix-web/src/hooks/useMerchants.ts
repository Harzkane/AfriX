"use client";

import { useState, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

export interface Merchant {
    id: string;
    business_name: string;
    display_name?: string;
    business_email: string;
    business_phone: string;
    verification_status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    payment_fee_percent?: number;
    default_token_type?: string;
    settlement_wallet_id?: string;
    webhook_url?: string | null;
    api_key_configured?: boolean;
    kyc?: {
        status: string;
        registration_number: string;
        tax_id: string;
        document_url?: string;
        business_certificate_url?: string;
        id_document_url?: string;
        proof_of_address_url?: string;
        submitted_at: string;
        rejection_reason?: string;
    };
    owner?: {
        id?: string;
        full_name: string;
        email?: string;
        phone_number?: string;
    };
    user?: {
        full_name: string;
    };
    wallet?: {
        id: string;
        token_type: string;
        balance: number | string;
        pending_balance: number | string;
        blockchain_address?: string;
        transaction_count?: number;
        last_synced_at?: string;
        updated_at?: string;
    };
}

export interface MerchantFinancialSummary {
    merchant: {
        id: string;
        business_name: string;
        display_name?: string;
        verification_status: string;
        payment_fee_percent: number;
        default_token_type: string;
        settlement_wallet_id: string;
        webhook_url?: string | null;
        api_key_configured: boolean;
        integration_health?: {
            last_webhook_attempt_at?: string | null;
            last_webhook_event?: string | null;
            last_webhook_reference?: string | null;
            last_webhook_status?: string | null;
            last_webhook_http_status?: number | null;
            last_webhook_error?: string | null;
        } | null;
    };
    owner?: {
        id?: string;
        full_name: string;
        email?: string;
        phone_number?: string;
    } | null;
    settlement_wallet?: {
        id: string;
        token_type: string;
        balance: number;
        pending_balance: number;
        available_balance: number;
        blockchain_address?: string;
        transaction_count?: number;
        last_synced_at?: string;
        updated_at?: string;
    } | null;
    summary: {
        total_volume: Record<string, number>;
        total_fees: Record<string, number>;
        average_payment_size: Record<string, number>;
        successful_collections_count: number;
        failed_collections_count: number;
        pending_collections_count: number;
        processing_collections_count: number;
    };
    recent_collections: Array<{
        id: string;
        reference: string;
        status: string;
        amount: number;
        fee: number;
        token_type: string;
        created_at: string;
        processed_at?: string | null;
        net_settlement: number;
        source: string;
        tx_hash?: string;
        description?: string;
        payer?: {
            id?: string;
            full_name?: string;
            email?: string;
        } | null;
        settlement_wallet?: {
            id: string;
            token_type: string;
        } | null;
        metadata?: any;
    }>;
    notes?: {
        fee_scope?: string;
    };
}

export interface WebhookHealthSummary {
    summary: {
        healthy: number;
        degraded: number;
        failing: number;
        unconfigured: number;
    };
    total: number;
    merchants: Array<{
        id: string;
        business_name: string;
        owner_email: string | null;
        webhook_url: string | null;
        health_status: 'healthy' | 'degraded' | 'failing' | 'unconfigured';
        last_attempt_at: string | null;
        last_status: string | null;
        last_http_status: number | null;
        last_error: string | null;
        consecutive_failures: number;
        total_attempts: number;
        verification_status: string;
    }>;
}

export function useMerchants() {
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [pagination, setPagination] = useState({ total: 0, limit: 15, offset: 0, has_more: false });
    const [currentMerchant, setCurrentMerchant] = useState<Merchant | null>(null);
    const [currentMerchantFinancials, setCurrentMerchantFinancials] = useState<MerchantFinancialSummary | null>(null);
    const [webhookHealth, setWebhookHealth] = useState<WebhookHealthSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMerchants = useCallback(async (params: any = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/admin/merchants", { params });
            setMerchants(res.data.data);
            setPagination({
                total: res.data.count || res.data.pagination?.total || 0,
                limit: params.limit || 15,
                offset: params.offset || 0,
                has_more: false
            });
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to load merchants");
            toast.error("Failed to load merchants");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchMerchant = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get(`/admin/merchants/${id}`);
            setCurrentMerchant(res.data.data);
            return res.data.data;
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to load merchant");
            toast.error("Failed to load merchant details");
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchMerchantFinancialSummary = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get(`/admin/merchants/${id}/financial-summary`);
            setCurrentMerchantFinancials(res.data.data);
            return res.data.data as MerchantFinancialSummary;
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to load merchant financials");
            toast.error("Failed to load merchant financial summary");
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchWebhookHealth = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get(`/admin/merchants/webhook-health`);
            setWebhookHealth(res.data.data);
            return res.data.data as WebhookHealthSummary;
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to load webhook health");
            toast.error("Failed to load webhook health summary");
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const approveMerchant = async (id: string) => {
        try {
            await api.post(`/admin/merchants/${id}/approve`);
            toast.success("Merchant application approved");
            await fetchMerchant(id);
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to approve merchant");
            throw err;
        }
    };

    const rejectMerchant = async (id: string, reason: string) => {
        try {
            await api.post(`/admin/merchants/${id}/reject`, { reason });
            toast.success("Merchant application rejected");
            await fetchMerchant(id);
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to reject merchant");
            throw err;
        }
    };

    return {
        merchants,
        pagination,
        currentMerchant,
        currentMerchantFinancials,
        webhookHealth,
        isLoading,
        error,
        fetchMerchants,
        fetchMerchant,
        fetchMerchantFinancialSummary,
        fetchWebhookHealth,
        approveMerchant,
        rejectMerchant
    };
}
