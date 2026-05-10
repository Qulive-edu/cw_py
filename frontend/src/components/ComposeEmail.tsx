import { useState, FormEvent, useEffect } from 'react';
import { emailService } from '@/api/services';
import { accountService } from '@/api/services';
import { MailAccount } from '@/types';

export default function ComposeEmail() {
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [formData, setFormData] = useState({
    account_id: '',
    to: '',
    subject: '',
    body: '',
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    accountService.list().then(({ data }) => setAccounts(data));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await emailService.send({
        account_id: Number(formData.account_id),
        to: formData.to.split(',').map(s => s.trim()),
        subject: formData.subject,
        body: formData.body,
      });
      alert('Письмо отправлено в очередь');
      setFormData({ account_id: '', to: '', subject: '', body: '' });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка отправки');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Новое письмо</h2>
      
      <select
        value={formData.account_id}
        onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
        required
      >
        <option value="">Выберите аккаунт</option>
        {accounts.map(acc => (
          <option key={acc.id} value={acc.id}>{acc.email}</option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Кому (через запятую)"
        value={formData.to}
        onChange={(e) => setFormData({ ...formData, to: e.target.value })}
        required
      />

      <input
        type="text"
        placeholder="Тема"
        value={formData.subject}
        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
        required
      />

      <textarea
        placeholder="Текст письма"
        value={formData.body}
        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
        rows={10}
        required
      />

      <button type="submit" disabled={sending}>
        {sending ? 'Отправка...' : 'Отправить'}
      </button>
    </form>
  );
}