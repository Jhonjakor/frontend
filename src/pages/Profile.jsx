import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookings as bookingsApi, usersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    avatarUrl: '',
  });
  const [email, setEmail] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const loadProfile = async () => {
    const [user, bookingItems] = await Promise.all([
      usersApi.getMe(),
      bookingsApi.getMyBookings(),
    ]);

    setEmail(user.email);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? '',
      avatarUrl: user.avatarUrl ?? '',
    });
    setBookings(bookingItems);
  };

  useEffect(() => {
    setLoading(true);
    loadProfile()
      .catch((err) => setError(err.message))
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
      refreshUser();
      setSuccess('Профиль обновлён');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!confirm('Отменить бронирование?')) return;

    try {
      await bookingsApi.cancel(bookingId);
      const updated = await bookingsApi.getMyBookings();
      setBookings(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="page">
      <div className="profile-header">
        <div className="avatar">
          {form.avatarUrl ? (
            <img src={form.avatarUrl} alt="Аватар" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            `${form.firstName?.[0] ?? ''}${form.lastName?.[0] ?? ''}`
          )}
        </div>
        <div>
          <h1>Мой профиль</h1>
          <p>{email}</p>
        </div>
      </div>

      <div className="profile-layout">
        <form className="profile-card" onSubmit={handleSubmit}>
          <h2>Данные аккаунта</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Имя</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Фамилия</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label>Ссылка на аватар</label>
            <input
              name="avatarUrl"
              value={form.avatarUrl}
              onChange={handleChange}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
          <div className="form-group">
            <label>Телефон</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="+7..." />
          </div>

          {success && <div className="alert alert-success">{success}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </form>

        <section className="profile-card profile-history">
          <h2>История бронирований</h2>
          {bookings.length === 0 ? (
            <div className="empty">Бронирований пока нет</div>
          ) : (
            <div className="bookings-list">
              {bookings.map((booking) => (
                <div key={booking.id} className="booking-item">
                  <Link to={`/bookings/${booking.id}`} className="booking-item-link">
                    <span className="booking-item-movie">{booking.movieTitle}</span>
                    <span className="booking-item-time">
                      {new Date(booking.sessionTime).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })} · {booking.hallName}
                    </span>
                    <span className="booking-item-seats">{formatSeats(booking.seats)}</span>
                    <span className="booking-item-price">{formatRub(booking.totalPrice)}</span>
                    <span className={`booking-item-status status-${booking.status.toLowerCase()}`}>
                      {statusLabel(booking.status)}
                    </span>
                  </Link>
                  {booking.status === 'Pending' && (
                    <button className="btn-sm btn-danger" onClick={() => handleCancel(booking.id)}>
                      Отменить
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function formatSeats(seats) {
  return seats
    .map((seat) => `${seat.row}-${seat.number}`)
    .join(', ');
}

function statusLabel(status) {
  if (status === 'Paid') return 'Оплачено';
  if (status === 'Cancelled') return 'Отменено';
  return 'Ожидает оплаты';
}

function formatRub(value) {
  return `${Number(value).toLocaleString('ru-RU')} ₽`;
}
