import { useState, useEffect } from 'react';
import { usersApi } from '../services/api';

export default function Profile() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    avatarUrl: '',
  });
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Загрузить текущий профиль при монтировании
  useEffect(() => {
    usersApi.getMe()
      .then((user) => {
        setEmail(user.email);
        setForm({
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone ?? '',
          avatarUrl: user.avatarUrl ?? '',
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      await usersApi.updateMe({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || null,
         avatarUrl: form.avatarUrl || null, 
      });
      setSuccess('Профиль обновлён!');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Загрузка...</p>;

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Мой профиль</h2>

      <p style={{ color: '#666' }}>{email}</p>

      <form onSubmit={handleSubmit}>
        <label>
          Имя
          <input
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </label>

        <label>
          Фамилия
          <input
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </label>

        {/* Превью аватарки */}
{form.avatarUrl && (
  <img
    src={form.avatarUrl}
    alt="Аватар"
    style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: 16 }}
    onError={e => e.target.style.display = 'none'}
  />
)}

<label>
  Ссылка на аватарку
  <input
    name="avatarUrl"
    value={form.avatarUrl}
    onChange={handleChange}
    placeholder="https://example.com/avatar.jpg"
    style={inputStyle}
  />
</label>

        <label>
          Телефон
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+7..."
            style={inputStyle}
          />
        </label>

        {error   && <p style={{ color: 'red'   }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}

        <button type="submit" disabled={saving} style={btnStyle}>
          {saving ? 'Сохраняем...' : 'Сохранить'}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '8px',
  marginBottom: 16,
  borderRadius: 6,
  border: '1px solid #ccc',
};

const btnStyle = {
  width: '100%',
  padding: '10px',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 15,
};
