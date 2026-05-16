// frontend/src/types/index.ts

// ===== PAGINATION =====
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Тип, который может быть либо массивом, либо пагинированным ответом
export type ApiListResponse<T> = T[] | PaginatedResponse<T>;

// ===== EXISTING TYPES =====
export interface User {
  id: number;
  username: string;
  email: string;
  date_joined?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface MailAccount {
  id: number;
  email: string;
  password?: string;
  imap_host: string;
  imap_port: number;
  smtp_host: string;
  smtp_port: number;
  use_ssl: boolean;
  is_active: boolean;
  last_sync?: string;
}

export interface Attachment {
  name: string;
  size: number;
  content_type: string;
}

export interface EmailMessage {
  id: number;
  account: number;
  uid: string;
  message_id: string;
  subject: string;
  sender: string;
  recipients: string[];
  date: string;
  body_text: string;
  body_html: string;
  is_read: boolean;
  folder: string;
  attachments: Attachment[];
}

export interface ApiError {
  detail?: string;
  [key: string]: any;
}