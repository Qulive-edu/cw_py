// frontend/src/components/EmailList.tsx
import { useEffect, useState } from 'react';
import { emailService, extractResults } from '@/api/services';
import { EmailMessage } from '@/types';
import { ru } from 'date-fns/locale';
import { format } from 'date-fns';

export default function EmailList() {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [folder, setFolder] = useState('INBOX');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = async () => {
    try {
      const response = await emailService.list({ folder });
      // 🔑 Используем хелпер для извлечения массива из пагинированного ответа
      const data = extractResults(response);
      setEmails(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch emails', err);
      setError(err.response?.data?.detail || 'Не удалось загрузить письма');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchEmails(); 
  }, [folder]);

  const handleMarkRead = async (id: number) => {
    try {
      await emailService.markRead(id);
      // Обновляем локально, чтобы не перезагружать весь список
      setEmails(emails.map(e => 
        e.id === id ? { ...e, is_read: true } : e
      ));
    } catch {
      // Можно показать уведомление об ошибке
    }
  };

  if (loading) return <div className="loading">Загрузка писем...</div>;
  if (error) return <div className="error-alert">{error}</div>;

  return (
    <div>
      <div className="email-header">
        <select 
          value={folder} 
          onChange={(e) => setFolder(e.target.value)}
          className="folder-select"
        >
          <option value="INBOX">📥 Входящие</option>
          <option value="Sent">📤 Отправленные</option>
          <option value="Drafts">📝 Черновики</option>
          <option value="Trash">🗑️ Корзина</option>
        </select>
        
        <button onClick={fetchEmails} className="btn-secondary" title="Обновить">
          🔄
        </button>
      </div>

      {emails.length === 0 ? (
        <p className="empty-state">
          {folder === 'INBOX' ? 'Входящие пустые 🎉' : `В папке "${folder}" нет писем`}
        </p>
      ) : (
        <div className="email-table-wrapper">
          <table className="email-table">
            <thead>
              <tr>
                <th className="col-read"></th>
                <th className="col-sender">Отправитель</th>
                <th className="col-subject">Тема</th>
                <th className="col-date">Дата</th>
              </tr>
            </thead>
            <tbody>
              {emails.map(email => (
                <tr 
                  key={email.id} 
                  className={`email-row ${!email.is_read ? 'unread' : ''}`}
                  title={email.subject}
                >
                  <td className="col-read">
                    {!email.is_read && (
                      <button 
                        onClick={() => handleMarkRead(email.id)} 
                        className="btn-mark-read"
                        title="Отметить как прочитанное"
                      >
                        ●
                      </button>
                    )}
                  </td>
                  <td className="col-sender">{email.sender}</td>
                  <td className="col-subject">
                    <span className="subject-text">{email.subject}</span>
                    {email.attachments?.length > 0 && (
                      <span className="attachment-badge">📎</span>
                    )}
                  </td>
                  <td className="col-date">
                    {format(new Date(email.date), 'dd.MM HH:mm', { locale: ru })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}