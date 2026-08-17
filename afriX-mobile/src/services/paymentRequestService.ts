import apiClient from "@/services/apiClient";

export async function fetchPaymentRequest(reqId: string) {
  try {
    return await apiClient.get(`/requests/payment-request/${reqId}`);
  } catch {
    return await apiClient.get(`/merchants/payment-request/${reqId}`);
  }
}
