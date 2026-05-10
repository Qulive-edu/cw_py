import { useEffect, useState } from 'react';
import { accountService } from '@/api/services';
import { MailAccount } from '@/types';
import AccountForm from './AccountForm';

export default function AccountList() {
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchAccounts = async () => {
    try {
      const { data } = await accountService.list();
      setAccounts(data);
    } catch (err) {
      console.error('Failed to fetch accounts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleSync = async (id: number) => {
    await accountService.sync(id);
    alert('Синхронизация запущена');
  };

  const handleDelete = async (id: number) => {
    if (confirm('Удалить аккаунт?')) {
      await accountService.delete(id);
      setAccounts(accounts.filter(a => a.id !== id));
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div>
      <div className="header">
        <h2>Почтовые аккаунты</h2>
        <button onClick={() => setShowForm(true)}>+ Добавить</button>
      </div>

      {showForm && (
        <AccountForm
          onSuccess={() => {
            setShowForm(false);
            fetchAccounts();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <ul>
        {accounts.map(acc => (
          <li key={acc.id}>
            <strong>{acc.email}</strong>
            <span>{acc.is_active ? 'yes' : 'no'}</span>
            <button onClick={() => handleSync(acc.id)}>Синхронизировать</button>
            <button onClick={() => handleDelete(acc.id)}>Удалить</button>
          </li>
        ))}
      </ul>
    </div>
  );
}