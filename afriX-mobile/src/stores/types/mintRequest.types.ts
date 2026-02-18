// src/stores/types/mintRequest.types.ts
export interface MintRequest {
  id: string;
  user_id: string;
  agent_id: string;
  amount: string;
  token_type: string;
  status: string;
  payment_proof_url?: string;
  user_bank_reference?: string;
  escrow_id?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  agent?: {
    id: string;
    tier: string;
    rating: number;
    phone_number: string;
    user?: {
      full_name: string;
      email: string;
    };
  };
  transaction?: {
    id: string;
    reference: string;
    type: string;
    status: string;
    amount: string;
    token_type: string;
  };
}

export interface MintRequestState {
  currentRequest: MintRequest | null;
  loading: boolean;
  error: string | null;
  createMintRequest: (
    agentId: string,
    amount: number,
    tokenType: string
  ) => Promise<MintRequest>;
  uploadProof: (requestId: string, imageUri: string) => Promise<void>;
  cancelMintRequest: (requestId: string) => Promise<void>;
  checkStatus: (requestId: string) => Promise<void>;
  fetchCurrentRequest: () => Promise<void>;
  openDispute: (requestId: string, reason: string, details: string) => Promise<void>;
  clearRequest: () => void;
  clearError: () => void;
}
