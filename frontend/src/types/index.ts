export interface User {
  id: number;
  username: string;
  email: string;
}

export interface MailAccount {
  id: number;
  email: string;
  password: string; // только для записи
  imap_host: string;
  imap_port: number;
  smtp_host: string;
  smtp_port: number;
  use_ssl: boolean;
  is_active: boolean;
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