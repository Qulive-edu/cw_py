// frontend/src/components/AccountForm.tsx
import { useState, FormEvent, ChangeEvent } from 'react';
import { accountService } from '@/api/services';
import { MailAccount } from '@/types';

type FormData = Omit<MailAccount, 'id'>;

interface AccountFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

// Предустановки для популярных провайдеров
const PROVIDER_PRESETS = {
  gmail: {
    imap_host: 'imap.gmail.com',
    imap_port: 993,
    smtp_host: 'smtp.gmail.com',
    smtp_port: 465,
    use_ssl: true,
  },
  yandex: {
    imap_host: 'imap.yandex.ru',
    imap_port: 993,
    smtp_host: 'smtp.yandex.ru',
    smtp_port: 465,
    use_ssl: true,
  },
  mailru: {
    imap_host: 'imap.mail.ru',
    imap_port: 993,
    smtp_host: 'smtp.mail.ru',
    smtp_port: 465,
    use_ssl: true,
  },
  outlook: {
    imap_host: 'outlook.office365.com',
    imap_port: 993,
    smtp_host: 'smtp.office365.com',
    smtp_port: 587,
    use_ssl: false,
  },
};

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
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  // Применение пресета провайдера
  const applyPreset = (provider: keyof typeof PROVIDER_PRESETS) => {
    const preset = PROVIDER_PRESETS[provider];
    setFormData(prev => ({ ...prev, ...preset }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await accountService.create(formData);
      onSuccess();
    } catch (err: any) {
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
        <div className="form-header">
          <h3>📮 Добавить почтовый аккаунт</h3>
          
          {/* Быстрый выбор провайдера */}
          <div className="provider-presets">
            <span>Быстрая настройка:</span>
            {Object.keys(PROVIDER_PRESETS).map(provider => (
              <button
                key={provider}
                type="button"
                className={`preset-btn ${formData.imap_host === PROVIDER_PRESETS[provider as keyof typeof PROVIDER_PRESETS].imap_host ? 'active' : ''}`}
                onClick={() => applyPreset(provider as keyof typeof PROVIDER_PRESETS)}
              >
                {provider}
              </button>
            ))}
          </div>
        </div>
        
        {error && <div className="error-alert">{error}</div>}

        <div className="form-group">
          <label>Email *</label>
          <input
            name="email"
            type="email"
            placeholder="example@gmail.com"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label>Пароль приложения *</label>
          <div className="password-input-wrapper">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Не основной пароль, а app-password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <small>
            Для Gmail/Yandex используйте <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener">пароль приложения</a>
          </small>
        </div>

        <fieldset className="form-section">
          <legend>📥 IMAP (входящие)</legend>
          <div className="form-row">
            <div className="form-group">
              <label>IMAP Хост</label>
              <input 
                name="imap_host" 
                type="text" 
                value={formData.imap_host} 
                onChange={handleChange} 
                required 
                placeholder="imap.example.com"
              />
            </div>
            <div className="form-group">
              <label>IMAP Порт</label>
              <input 
                name="imap_port" 
                type="number" 
                value={formData.imap_port} 
                onChange={handleChange} 
                required 
                min="1" 
                max="65535"
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>📤 SMTP (исходящие)</legend>
          <div className="form-row">
            <div className="form-group">
              <label>SMTP Хост</label>
              <input 
                name="smtp_host" 
                type="text" 
                value={formData.smtp_host} 
                onChange={handleChange} 
                required 
                placeholder="smtp.example.com"
              />
            </div>
            <div className="form-group">
              <label>SMTP Порт</label>
              <input 
                name="smtp_port" 
                type="number" 
                value={formData.smtp_port} 
                onChange={handleChange} 
                required 
                min="1" 
                max="65535"
              />
            </div>
          </div>
        </fieldset>

        <div className="form-group checkbox-group">
          <label>
            <input 
              name="use_ssl" 
              type="checkbox" 
              checked={formData.use_ssl} 
              onChange={handleChange} 
            />
            Использовать SSL/TLS шифрование
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Сохранение...' : '💾 Сохранить аккаунт'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            ✕ Отмена
          </button>
        </div>
      </form>
    </div>
  );
}