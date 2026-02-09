import { apiClient } from '@/src/infrastructure/api/api.client';

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyId?: string | null;
}

export interface VerifyPayload {
  email: string;
  code: string;
}

export interface ResendPayload {
  email: string;
}

export const RegistrationService = {
  async register(payload: RegisterPayload): Promise<any> {
    const response = await apiClient.post('/security/auth/register', payload, { skipAuth: true });
    return response;
  },
  async verifyEmail(payload: VerifyPayload): Promise<any> {
    const response = await apiClient.post('/security/auth/verify-email', payload, { skipAuth: true });
    return response;
  },
  async resendCode(payload: ResendPayload): Promise<any> {
    const response = await apiClient.post('/security/auth/resend-code', payload, { skipAuth: true });
    return response;
  },
};
