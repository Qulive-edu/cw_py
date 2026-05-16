// frontend/src/components/ComposeEmail.tsx
import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { emailService, accountService, extractResults } from '@/api/services';
import { MailAccount } from '@/types';

interface DraftData {
  account_id: string;
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
  saved_at?: string;
}

const DRAFT_KEY = 'email_compose_draft';

export default function ComposeEmail() {
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  
  const [formData, setFormData] = useState({
    account_id: '',
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
  });
  
  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Загрузка аккаунтов
  const loadAccounts = async () => {
    try {
      const response = await accountService.list();
      const data = extractResults(response);
      setAccounts(data);
      const active = data.find((a: MailAccount) => a.is_active);
      if (active) {
        setFormData(prev => ({ ...prev, account_id: String(active.id) }));
      }
    } catch (err) {
      console.error('Failed to load accounts', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Загрузка черновика при монтировании
  useEffect(() => {
    loadAccounts();
    
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const draft: DraftData = JSON.parse(saved);
        setFormData({
          account_id: draft.account_id || '',
          to: draft.to || '',
          cc: draft.cc || '',
          bcc: draft.bcc || '',
          subject: draft.subject || '',
          body: draft.body || '',
        });
        setLastSaved(draft.saved_at || null);
      } catch {
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  }, []);

  // Автосохранение черновика при изменении
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.subject || formData.body || formData.to) {
        saveDraftSilent();
      }
    }, 2000); // Сохраняем через 2 секунды после последнего изменения
    
    return () => clearTimeout(timer);
  }, [formData]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error || success) {
      setError('');
      setSuccess('');
    }
  };

  // Сохранение черновика (тихое, для автосохранения)
  const saveDraftSilent = () => {
    const draft: DraftData = {
      ...formData,
      saved_at: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setLastSaved(draft.saved_at ?? null);;
  };

  // Сохранение черновика с уведомлением
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      saveDraftSilent();
      setSuccess('💾 Черновик сохранён локально');
      setTimeout(() => setSuccess(''), 3000);
    } finally {
      setSavingDraft(false);
    }
  };

  // Очистка черновика
  const handleClearDraft = () => {
    if (confirm('Удалить черновик?')) {
      localStorage.removeItem(DRAFT_KEY);
      setFormData({
        account_id: formData.account_id,
        to: '', cc: '', bcc: '', subject: '', body: ''
      });
      setLastSaved(null);
      setSuccess('🗑️ Черновик удалён');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.account_id) {
      setError('Выберите аккаунт для отправки');
      return;
    }
    if (!formData.to.trim()) {
      setError('Укажите получателя');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');
    
    try {
      await emailService.send({
        account_id: Number(formData.account_id),
        to: formData.to.split(',').map(s => s.trim()).filter(Boolean),
        subject: formData.subject,
        body: formData.body,
      });
      
      setSuccess('✅ Письмо отправлено!');
      
      // Очищаем черновик после успешной отправки
      localStorage.removeItem(DRAFT_KEY);
      setLastSaved(null);
      
      // Сброс формы
      setFormData(prev => ({
        ...prev,
        to: '', cc: '', bcc: '', subject: '', body: '',
      }));
      
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Ошибка отправки письма');
    } finally {
      setSending(false);
    }
  };

  // Форматирование времени последнего сохранения
  const formatLastSaved = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <form onSubmit={handleSubmit} className="compose-form">
      <div className="compose-header">
        <h2>✉️ Новое письмо</h2>
        <div className="compose-status">
          {lastSaved && (
            <small className="draft-indicator">
              🕐 Сохранено: {formatLastSaved(lastSaved)}
            </small>
          )}
          {success && <span className="success-badge">{success}</span>}
        </div>
      </div>
      
      {error && <div className="error-alert">{error}</div>}

      {/* Выбор аккаунта */}
      <div className="form-group">
        <label>Отправить с *</label>
        {loadingAccounts ? (
          <div className="loading-small">Загрузка аккаунтов...</div>
        ) : (
          <select
            name="account_id"
            value={formData.account_id}
            onChange={handleChange}
            required
            disabled={accounts.length === 0}
          >
            <option value="">Выберите аккаунт</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id} disabled={!acc.is_active}>
                {acc.email} {!acc.is_active && '(неактивен)'}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Получатели */}
      <div className="form-group">
        <label>Кому *</label>
        <input
          type="text"
          name="to"
          placeholder="email@example.com"
          value={formData.to}
          onChange={handleChange}
          required
          autoComplete="email"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Копия (CC)</label>
          <input
            type="text"
            name="cc"
            placeholder="cc@example.com"
            value={formData.cc}
            onChange={handleChange}
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label>Скрытая копия (BCC)</label>
          <input
            type="text"
            name="bcc"
            placeholder="bcc@example.com"
            value={formData.bcc}
            onChange={handleChange}
            autoComplete="email"
          />
        </div>
      </div>

      {/* Тема */}
      <div className="form-group">
        <label>Тема</label>
        <input
          type="text"
          name="subject"
          placeholder="Тема письма"
          value={formData.subject}
          onChange={handleChange}
        />
      </div>

      {/* Тело письма */}
      <div className="form-group">
        <label>Текст письма</label>
        <textarea
          name="body"
          placeholder="Напишите ваше сообщение здесь..."
          value={formData.body}
          onChange={handleChange}
          rows={15}
        />
      </div>

      {/* Кнопки */}
      <div className="form-actions">
        <button type="submit" disabled={sending || loadingAccounts} className="btn-primary">
          {sending ? '📤 Отправка...' : '📤 Отправить'}
        </button>
        <button 
          type="button" 
          onClick={handleSaveDraft}
          disabled={savingDraft}
          className="btn-secondary"
        >
          {savingDraft ? 'Сохранение...' : '💾 Сохранить черновик'}
        </button>
        <button 
          type="button" 
          onClick={handleClearDraft}
          className="btn-danger"
        >
          🗑️ Удалить черновик
        </button>
      </div>
      
      <p className="draft-hint">
        💡 Черновики сохраняются локально в браузере. 
        Очистка кэша браузера удалит несохранённые черновики.
      </p>
    </form>
  );
}