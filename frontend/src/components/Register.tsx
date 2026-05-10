import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/api/auth';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Очищаем ошибку при вводе
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await authApi.register(
        formData.username,
        formData.email,
        formData.password,
        formData.password_confirm
      );
      // После успешной регистрации — на страницу входа
      navigate('/login', { state: { message: 'Регистрация успешна! Войдите в систему.' } });
    } catch (err: any) {
      const backendErrors = err.response?.data;
      if (backendErrors) {
        // Преобразуем ошибки DRF в удобный формат
        const formatted: Record<string, string> = {};
        Object.entries(backendErrors).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            formatted[key] = value[0];
          } else if (typeof value === 'string') {
            formatted[key] = value;
          }
        });
        setErrors(formatted);
      } else {
        setErrors({ non_field_errors: 'Ошибка при регистрации. Попробуйте позже.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="register-form">
        <h2>📝 Регистрация</h2>
        
        {errors.non_field_errors && (
          <div className="error-alert">{errors.non_field_errors}</div>
        )}

        <div className="form-group">
          <label>Имя пользователя</label>
          <input
            name="username"
            type="text"
            placeholder="admin"
            value={formData.username}
            onChange={handleChange}
            required
            minLength={3}
          />
          {errors.username && <small className="error">{errors.username}</small>}
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
          {errors.email && <small className="error">{errors.email}</small>}
        </div>

        <div className="form-group">
          <label>Пароль</label>
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
          />
          {errors.password && <small className="error">{errors.password}</small>}
        </div>

        <div className="form-group">
          <label>Подтвердите пароль</label>
          <input
            name="password_confirm"
            type="password"
            placeholder="••••••••"
            value={formData.password_confirm}
            onChange={handleChange}
            required
          />
          {errors.password_confirm && <small className="error">{errors.password_confirm}</small>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
        
        <p className="form-footer">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </form>
    </div>
  );
}