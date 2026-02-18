// src/stores/types/agent.types.ts

export interface AgentStats {
    pending_requests: number;
    total_earnings: number;
    total_minted: number;
    total_burned: number;
    total_reviews?: number;
    available_capacity: number;
}

export interface AgentRequest {
    id: string;
    type: "mint" | "burn";
    status: string;
    amount: string;
    token_type: string;
    created_at: string;
    user: {
        full_name: string;
        email: string;
    };
    // Mint specific
    payment_proof_url?: string;
    // Burn specific
    bank_account?: {
        bank_name: string;
        account_number: string;
        account_name: string;
    };
    fiat_proof_url?: string;
}

// Agent Registration Types
export enum AgentStatus {
    PENDING = "pending",
    UNDER_REVIEW = "under_review",
    APPROVED = "approved",
    ACTIVE = "active",
    SUSPENDED = "suspended",
}

export enum KycStatus {
    NOT_SUBMITTED = "not_submitted",
    UNDER_REVIEW = "under_review",
    APPROVED = "approved",
    REJECTED = "rejected",
}

export interface AgentRegistrationData {
    country: string;
    currency: string;
    withdrawal_address: string;
}

export interface KycPersonalInfo {
    full_legal_name: string;
    date_of_birth: string;
    id_document_type: string;
    id_document_number: string;
    nationality: string;
    residential_address: string;
}

export interface KycDocuments {
    id_document: {
        uri: string;
        name: string;
        type: string;
    } | null;
    selfie: {
        uri: string;
        name: string;
        type: string;
    } | null;
    proof_of_address: {
        uri: string;
        name: string;
        type: string;
    } | null;
    business_registration?: {
        uri: string;
        name: string;
        type: string;
    } | null;
}

export interface AgentKycStatus {
    status: KycStatus;
    submitted_at?: string;
    reviewed_at?: string;
    rejection_reason?: string;
}

export interface AgentProfileUpdate {
    phone_number?: string;
    whatsapp_number?: string;
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    withdrawal_address?: string;
}

export interface WithdrawalRequest {
    id: string;
    agent_id: string;
    amount_usd: string;
    status: "pending" | "approved" | "rejected" | "paid";
    admin_notes?: string;
    paid_tx_hash?: string;
    paid_at?: string;
    created_at: string;
}

export interface DepositTransaction {
    id: string;
    amount: string;
    created_at: string;
    metadata?: any;
    status?: string;
}

export interface AgentReview {
    id: string;
    user_id: string;
    agent_id: string;
    transaction_id: string;
    rating: number;
    review_text?: string;
    agent_response?: string;
    agent_response_at?: string;
    created_at: string;
    user?: {
        full_name: string;
    };
    transaction?: {
        type: string;
        amount: string;
        token_type: string;
    };
}

export interface AgentState {
    stats: AgentStats | null;
    pendingRequests: AgentRequest[];
    withdrawalRequests: WithdrawalRequest[];
    depositHistory: DepositTransaction[];
    reviews: AgentReview[];
    history: AgentRequest[];
    dashboardData: any | null;
    loading: boolean;
    error: string | null;

    // Registration state
    kycStatus: AgentKycStatus | null;
    agentStatus: AgentStatus | null;

    // Actions
    fetchAgentStats: () => Promise<void>;
    fetchDashboard: () => Promise<void>;
    fetchPendingRequests: () => Promise<void>;
    fetchWithdrawalRequests: () => Promise<void>;
    fetchDepositHistory: () => Promise<void>;
    fetchReviews: (agentId: string) => Promise<void>;
    respondToReview: (reviewId: string, response: string) => Promise<void>;
    submitReview: (payload: { transaction_id: string; rating: number; review_text?: string }) => Promise<void>;
    fetchHistory: () => Promise<void>;

    // Agent Selection (User View)
    agents: any[];
    selectedAgent: any | null;
    fetchAgents: (country: string, sort?: "rating" | "fastest" | "capacity") => Promise<void>;
    selectAgent: (agent: any) => void;

    // Request Actions
    confirmMintRequest: (requestId: string) => Promise<void>;
    confirmBurnPayment: (requestId: string, proof: any) => Promise<void>;
    rejectRequest: (requestId: string, reason: string, type: "mint" | "burn") => Promise<void>;

    // Registration Actions
    registerAsAgent: (data: AgentRegistrationData) => Promise<void>;
    uploadKyc: (personalInfo: KycPersonalInfo, documents: KycDocuments) => Promise<void>;
    checkKycStatus: () => Promise<AgentKycStatus>;
    resubmitKyc: (personalInfo: KycPersonalInfo, documents: KycDocuments) => Promise<void>;
    submitDeposit: (amount: number, txHash: string) => Promise<void>;
    updateProfile: (updates: AgentProfileUpdate) => Promise<any>;
    createWithdrawalRequest: (amountUsd: number) => Promise<any>;
}
