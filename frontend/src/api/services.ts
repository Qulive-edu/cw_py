// frontend/src/api/services.ts
import api from './client';
import { MailAccount, EmailMessage, ApiListResponse } from '@/types';

// Хелпер для извлечения массива из ответа (пагинированного или нет)
export const extractResults = <T>(response: { data: ApiListResponse<T> }): T[] => {
  const { data } = response;
  if (Array.isArray(data)) {
    return data;
  }
  return (data as { results: T[] }).results;
};

export const accountService = {
  // 🔑 Убрали префикс /api — он уже есть в baseURL axios
  list: () => api.get<ApiListResponse<MailAccount>>('/accounts/'),
  create: (data: Omit<MailAccount, 'id'>) => api.post<MailAccount>('/accounts/', data),
  update: (id: number, data: Partial<MailAccount>) => 
    api.patch<MailAccount>(`/accounts/${id}/`, data),
  delete: (id: number) => api.delete(`/accounts/${id}/`),
  sync: (id: number) => api.post(`/accounts/${id}/sync/`),
};

export const emailService = {
  list: (params?: { folder?: string }) => 
    api.get<ApiListResponse<EmailMessage>>('/emails/', { params }),
  get: (id: number) => api.get<EmailMessage>(`/emails/${id}/`),
  markRead: (id: number) => api.post(`/emails/${id}/mark_read/`),
  send: (data: {
    account_id: number;
    to: string[];
    subject: string;
    body: string;
    html?: string;
    attachments?: string[];
  }) => api.post('/emails/send/', data),
};