import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '', phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }
    setLoading(true);
    try {
      const data = await auth.register(form);
      login(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Регистрация</h1>
        <p className="auth-subtitle">Создайте аккаунт для онлайн-бронирования</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Имя</label>
              <input value={form.firstName} onChange={set('firstName')} placeholder="Иван" required />
            </div>
            <div className="form-group">
              <label>Фамилия</label>
              <input value={form.lastName} onChange={set('lastName')} placeholder="Иванов" required />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={set('email')}
              placeholder="your@email.com" required />
          </div>

          <div className="form-group">
            <label>Телефон (необязательно)</label>
            <input type="tel" value={form.phone} onChange={set('phone')}
              placeholder="+7 (999) 000-00-00" />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input type="password" value={form.password} onChange={set('password')}
              placeholder="Минимум 6 символов" required />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Регистрация...' : 'Создать аккаунт'}
          </button>
        </form>

        <p className="auth-footer">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}
