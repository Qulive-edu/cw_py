// frontend/src/components/AccountList.tsx
import { useEffect, useState } from 'react';
import { accountService, extractResults } from '@/api/services';
import { MailAccount } from '@/types';
import AccountForm from './AccountForm';

export default function AccountList() {
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      const response = await accountService.list();
      const data = extractResults(response);
      setAccounts(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch accounts', err);
      setError(err.response?.data?.detail || err.response?.statusText || 'Не удалось загрузить аккаунты');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleSync = async (id: number) => {
    try {
      await accountService.sync(id);
      alert('✅ Синхронизация запущена');
    } catch {
      alert('❌ Ошибка синхронизации');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Удалить аккаунт?')) {
      try {
        await accountService.delete(id);
        setAccounts(accounts.filter(a => a.id !== id));
      } catch {
        alert('Ошибка удаления');
      }
    }
  };

  return (
    <div>
      <div className="header">
        <h2>📮 Почтовые аккаунты</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Добавить
        </button>
      </div>

      {error && (
        <div className="error-alert" style={{ marginBottom: '1rem' }}>
          ⚠️ {error} 
          <button onClick={fetchAccounts} style={{ marginLeft: '10px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}>
            Повторить
          </button>
        </div>
      )}

      {showForm && (
        <AccountForm
          onSuccess={() => { setShowForm(false); fetchAccounts(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading ? (
        <div className="loading">Загрузка аккаунтов...</div>
      ) : accounts.length === 0 ? (
        <p className="empty-state">Нет добавленных аккаунтов. Нажмите "+ Добавить", чтобы начать.</p>
      ) : (
        <ul>
          {accounts.map(acc => (
            <li key={acc.id}>
              <div className="account-info">
                <strong>{acc.email}</strong>
                <span className={`status ${acc.is_active ? 'active' : 'inactive'}`}>
                  {acc.is_active ? '● Активен' : '○ Неактивен'}
                </span>
              </div>
              <div className="account-actions">
                <button onClick={() => handleSync(acc.id)} className="btn-secondary">🔄</button>
                <button onClick={() => handleDelete(acc.id)} className="btn-danger">🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}