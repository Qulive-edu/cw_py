import { useEffect, useState } from 'react';
import { emailService } from '@/api/services';
import { EmailMessage } from '@/types';
import { ru } from 'date-fns/locale';
import { format } from 'date-fns';

export default function EmailList() {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [folder, setFolder] = useState('INBOX');
  const [loading, setLoading] = useState(true);

  const fetchEmails = async () => {
    try {
      const { data } = await emailService.list({ folder });
      setEmails(data);
    } catch (err) {
      console.error('Failed to fetch emails', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmails(); }, [folder]);

  const handleMarkRead = async (id: number) => {
    await emailService.markRead(id);
    setEmails(emails.map(e => 
      e.id === id ? { ...e, is_read: true } : e
    ));
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div>
      <select value={folder} onChange={(e) => setFolder(e.target.value)}>
        <option value="INBOX">Входящие</option>
        <option value="Sent">Отправленные</option>
        <option value="Drafts">Черновики</option>
      </select>

      <table>
        <thead>
          <tr>
            <th>Прочитано</th>
            <th>Отправитель</th>
            <th>Тема</th>
            <th>Дата</th>
          </tr>
        </thead>
        <tbody>
          {emails.map(email => (
            <tr key={email.id} className={!email.is_read ? 'unread' : ''}>
              <td>
                {!email.is_read && (
                  <button onClick={() => handleMarkRead(email.id)}>✓</button>
                )}
              </td>
              <td>{email.sender}</td>
              <td>{email.subject}</td>
              <td>{format(new Date(email.date), 'dd.MM.yyyy HH:mm', { locale: ru })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}