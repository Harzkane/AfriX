"use client";

import { useState, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

export interface Merchant {
    id: string;
    business_name: string;
    business_email: string;
    business_phone: string;
    verification_status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    kyc?: {
        status: string;
        registration_number: string;
        tax_id: string;
        document_url: string;
        submitted_at: string;
        rejection_reason?: string;
    };
    user?: {
        full_name: string;
    }
}

export function useMerchants() {
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [pagination, setPagination] = useState({ total: 0, limit: 15, offset: 0, has_more: false });
    const [currentMerchant, setCurrentMerchant] = useState<Merchant | null>(null);
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
        isLoading,
        error,
        fetchMerchants,
        fetchMerchant,
        approveMerchant,
        rejectMerchant
    };
}
