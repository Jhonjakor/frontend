import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookings as bookingsApi, payments as paymentsApi } from '../services/api';

export default function BookingDetails() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payMethod, setPayMethod] = useState('Card');
  const [error, setError] = useState('');

  useEffect(() => {
    bookingsApi.getById(id)
      .then(setBooking)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handlePay = async () => {
    setPaying(true);
    setError('');
    try {
      await paymentsApi.pay({ bookingId: id, method: payMethod });
      const updated = await bookingsApi.getById(id);
      setBooking(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setPaying(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Отменить бронирование?')) return;
    try {
      await bookingsApi.cancel(id);
      const updated = await bookingsApi.getById(id);
      setBooking(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (!booking) return <div className="error">Бронирование не найдено</div>;

  const statusColors = {
    Pending: '#f59e0b',
    Paid: '#10b981',
    Cancelled: '#ef4444',
  };

  return (
    <div className="page">
      <div className="booking-detail-card">
        <div className="booking-status" style={{ color: statusColors[booking.status] }}>
          {booking.status === 'Paid' ? '✅ Оплачено' :
           booking.status === 'Cancelled' ? '❌ Отменено' : '⏳ Ожидает оплаты'}
        </div>

        <h1>{booking.movieTitle}</h1>
        <p className="booking-meta">
          {new Date(booking.sessionTime).toLocaleString('ru-RU', {
            day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
          })} · {booking.hallName}
        </p>

        <div className="booking-seats">
          <h3>Места:</h3>
          <div className="seats-tags">
            {booking.seats.map(seat => (
              <span key={seat.id} className={`seat-tag ${seat.type === 'VIP' ? 'seat-tag-vip' : ''}`}>
                Ряд {seat.row}, место {seat.number}
                {seat.type === 'VIP' && ' ★'}
              </span>
            ))}
          </div>
        </div>

        <div className="booking-total">
          Итого: <strong>{booking.totalPrice} ₽</strong>
        </div>

        {booking.qrCode && booking.status === 'Paid' && (
          <div className="qr-section">
            <p>Код билета:</p>
            <div className="qr-code">{booking.qrCode}</div>
            <p className="qr-hint">Покажите код на входе</p>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {booking.status === 'Pending' && (
          <div className="payment-section">
            <h3>Оплата</h3>
            <div className="payment-methods">
              <label>
                <input
                  type="radio" value="Card"
                  checked={payMethod === 'Card'}
                  onChange={e => setPayMethod(e.target.value)}
                /> 💳 Банковская карта
              </label>
              <label>
                <input
                  type="radio" value="Cash"
                  checked={payMethod === 'Cash'}
                  onChange={e => setPayMethod(e.target.value)}
                /> 💵 Наличные в кассе
              </label>
            </div>
            <div className="payment-actions">
              <button className="btn btn-primary" onClick={handlePay} disabled={paying}>
                {paying ? 'Обработка...' : `Оплатить ${booking.totalPrice} ₽`}
              </button>
              <button className="btn btn-danger" onClick={handleCancel}>
                Отменить бронирование
              </button>
            </div>
          </div>
        )}

        <Link to="/profile" className="btn btn-secondary">← Мои бронирования</Link>
      </div>
    </div>
  );
}
