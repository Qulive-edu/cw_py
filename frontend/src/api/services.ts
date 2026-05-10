import api from './client';
import { MailAccount, EmailMessage } from '@/types';

export const accountService = {
  list: () => api.get<MailAccount[]>('/accounts/'),
  create: (data: Omit<MailAccount, 'id'>) => api.post<MailAccount>('/accounts/', data),
  update: (id: number, data: Partial<MailAccount>) => api.patch<MailAccount>(`/accounts/${id}/`, data),
  delete: (id: number) => api.delete(`/accounts/${id}/`),
  sync: (id: number) => api.post(`/accounts/${id}/sync/`),
};

export const emailService = {
  list: (params?: { folder?: string }) => 
    api.get<EmailMessage[]>('/emails/', { params }),
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