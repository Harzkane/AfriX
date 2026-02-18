// src/stores/types/burn.types.ts

export enum BurnRequestStatus {
    PENDING = "pending",
    ESCROWED = "escrowed",
    FIAT_SENT = "fiat_sent",
    CONFIRMED = "confirmed",
    REJECTED = "rejected",
    EXPIRED = "expired",
    DISPUTED = "disputed",
}

export type BankAccount =
    | {
        type: "bank";
        bank_name: string;
        account_number: string;
        account_name: string;
    }
    | {
        type: "mobile_money";
        provider: string;
        phone_number: string;
        account_name: string;
    };

export interface BurnRequest {
    id: string;
    user_id: string;
    agent_id: string;
    amount: string;
    token_type: "NT" | "CT" | "USDT";
    status: BurnRequestStatus;
    escrow_id?: string;
    fiat_proof_url?: string;
    agent_bank_reference?: string;
    user_bank_account: BankAccount; // API may return either shape
    created_at: string;
    expires_at: string;
    agent?: {
        id: string;
        user?: {
            full_name: string;
        };
    };
}

export interface BurnState {
    requests: BurnRequest[];
    currentRequest: BurnRequest | null;
    loading: boolean;
    error: string | null;

    // Actions
    createBurnRequest: (data: {
        agent_id: string;
        amount: string;
        token_type: string;
        bank_account: BankAccount;
    }) => Promise<BurnRequest>;

    fetchBurnRequests: () => Promise<void>;
    fetchCurrentBurnRequest: (requestId?: string) => Promise<void>;
    /** Fetches user requests and sets currentRequest to active burn or null (for dashboard). */
    fetchCurrentBurnRequestForUser: () => Promise<void>;
    confirmFiatReceipt: (requestId: string) => Promise<void>;
    openDispute: (requestId: string, reason: string, details?: string) => Promise<void>;
    clearError: () => void;
    resetCurrentRequest: () => void;
}
