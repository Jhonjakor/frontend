import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookings as bookingsApi, users as usersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsApi.getAll()
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusLabel = {
    Pending: { text: '⏳ Ожидает', color: '#f59e0b' },
    Paid: { text: '✅ Оплачено', color: '#10b981' },
    Cancelled: { text: '❌ Отменено', color: '#ef4444' },
  };

  return (
    <div className="page">
      <div className="profile-header">
        <div className="avatar">{user?.fullName?.[0] || user?.email?.[0] || '?'}</div>
        <div>
          <h1>{user?.fullName || user?.email}</h1>
          <p>{user?.email}</p>
          <span className="role-badge">{user?.role === 'Admin' ? '👑 Администратор' : '🎟 Пользователь'}</span>
        </div>
      </div>

      <h2>Мои бронирования</h2>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : bookings.length === 0 ? (
        <div className="empty">
          <p>У вас пока нет бронирований</p>
          <Link to="/" className="btn btn-primary">Выбрать фильм</Link>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map(b => (
            <Link to={`/bookings/${b.id}`} key={b.id} className="booking-item">
              <div className="booking-item-movie">{b.movieTitle}</div>
              <div className="booking-item-time">
                {new Date(b.sessionTime).toLocaleString('ru-RU', {
                  day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                })}
              </div>
              <div className="booking-item-seats">
                {b.seats.length} {b.seats.length === 1 ? 'место' : 'мест'}
              </div>
              <div className="booking-item-price">{b.totalPrice} ₽</div>
              <div className="booking-item-status"
                style={{ color: statusLabel[b.status]?.color }}>
                {statusLabel[b.status]?.text}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
