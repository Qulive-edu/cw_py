import { useState, FormEvent, ChangeEvent } from 'react';
import { accountService } from '@/api/services';
import { MailAccount } from '@/types';

type FormData = Omit<MailAccount, 'id'>;

interface AccountFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AccountForm({ onSuccess, onCancel }: AccountFormProps) {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    imap_host: 'imap.gmail.com',
    imap_port: 993,
    smtp_host: 'smtp.gmail.com',
    smtp_port: 465,
    use_ssl: true,
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await accountService.create(formData);
      onSuccess();
    } catch (err: any) {
      // Пытаемся получить понятное сообщение об ошибке от DRF
      const backendError = err.response?.data;
      const msg = backendError?.detail 
        || backendError?.email?.[0] 
        || backendError?.password?.[0]
        || 'Ошибка при создании аккаунта. Проверьте данные и подключение.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-form-wrapper">
      <form onSubmit={handleSubmit} className="account-form">
        <h3>📮 Добавить почтовый аккаунт</h3>
        
        {error && <div className="error-alert">{error}</div>}

        <div className="form-group">
          <label>Email</label>
          <input
            name="email"
            type="email"
            placeholder="example@gmail.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Пароль приложения</label>
          <input
            name="password"
            type="password"
            placeholder="Не основной пароль, а app-password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <small>Для Gmail/Yandex используйте пароль приложения</small>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>IMAP Хост</label>
            <input name="imap_host" type="text" value={formData.imap_host} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>IMAP Порт</label>
            <input name="imap_port" type="number" value={formData.imap_port} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>SMTP Хост</label>
            <input name="smtp_host" type="text" value={formData.smtp_host} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>SMTP Порт</label>
            <input name="smtp_port" type="number" value={formData.smtp_port} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input name="use_ssl" type="checkbox" checked={formData.use_ssl} onChange={handleChange} />
            Использовать SSL/TLS
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}