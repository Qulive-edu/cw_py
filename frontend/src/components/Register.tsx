// frontend/src/components/Register.tsx
import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
  });
  const [loading, setLoading] = useState(false);
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Простая валидация на клиенте
    if (formData.password !== formData.password_confirm) {
      alert('Пароли не совпадают');
      return;
    }
    if (formData.password.length < 8) {
      alert('Пароль должен содержать минимум 8 символов');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      navigate('/');
    } catch {
      // Ошибка уже обработана в useAuth
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="register-form">
        <h2>📝 Регистрация</h2>
        
        {error && <p className="error">{error}</p>}
        
        <div className="form-group">
          <label>Имя пользователя *</label>
          <input
            type="text"
            name="username"
            placeholder="username"
            value={formData.username}
            onChange={handleChange}
            required
            minLength={3}
            maxLength={150}
          />
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Пароль *</label>
          <input
            type="password"
            name="password"
            placeholder="Минимум 8 символов"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
          />
        </div>

        <div className="form-group">
          <label>Подтвердите пароль *</label>
          <input
            type="password"
            name="password_confirm"
            placeholder="Повторите пароль"
            value={formData.password_confirm}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>

        <p className="switch-auth">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </form>
    </div>
  );
}