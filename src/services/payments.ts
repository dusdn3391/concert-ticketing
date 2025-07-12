import { createBaseApiService, apiRequest } from './base';
import {
  Payment,
  UpdatePaymentRequest,
  GetPaymentsParams,
  PaymentDetail,
  PaymentStats,
  RefundPaymentRequest,
  RefundPaymentResponse,
  ApiResponse,
} from '@/types';

// 결제 기본 CRUD
export const paymentService = createBaseApiService<
  Payment,
  never,
  UpdatePaymentRequest,
  GetPaymentsParams
>('/payments');

// 결제 상세 정보
export async function getPaymentDetail(
  paymentId: number,
): Promise<ApiResponse<PaymentDetail>> {
  return apiRequest<PaymentDetail>(`/payments/${paymentId}/detail`);
}

// 결제 통계
export async function getPaymentStats(): Promise<ApiResponse<PaymentStats>> {
  return apiRequest<PaymentStats>('/payments/stats');
}

// 환불 처리
export async function refundPayment(
  paymentId: number,
  data: RefundPaymentRequest,
): Promise<ApiResponse<RefundPaymentResponse>> {
  return apiRequest<RefundPaymentResponse>(`/payments/${paymentId}/refund`, {
    method: 'POST',
    body: data,
  });
}
