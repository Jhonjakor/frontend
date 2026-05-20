import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessions as sessionsApi, bookings as bookingsApi } from '../services/api';

export default function SeatSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      sessionsApi.getById(id),
      sessionsApi.getSeats(id)
    ]).then(([s, seatsData]) => {
      setSession(s);
      setSeats(seatsData);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const toggleSeat = (seat) => {
    if (seat.isBooked) return;
    setSelected(prev =>
      prev.find(s => s.id === seat.id)
        ? prev.filter(s => s.id !== seat.id)
        : [...prev, seat]
    );
  };

  const handleBook = async () => {
    if (selected.length === 0) return;
    setBooking(true);
    setError('');
    try {
      const result = await bookingsApi.create({
        sessionId: id,
        seatIds: selected.map(s => s.id)
      });
      navigate(`/bookings/${result.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (!session) return <div className="error">Сеанс не найден</div>;

  // Группируем места по рядам
  const rows = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  const totalPrice = selected.length * session.price;

  return (
    <div className="page">
      <div className="booking-header">
        <h1>{session.movieTitle}</h1>
        <p>
          {new Date(session.startTime).toLocaleString('ru-RU', {
            day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
          })} · {session.hallName}
        </p>
      </div>

      <div className="screen-label">ЭКРАН</div>
      <div className="screen" />

      <div className="seats-map">
        {Object.entries(rows).map(([row, rowSeats]) => (
          <div key={row} className="seat-row">
            <span className="row-label">{row}</span>
            {rowSeats.map(seat => (
              <button
                key={seat.id}
                className={`seat
                  ${seat.isBooked ? 'seat-booked' : ''}
                  ${seat.type === 'VIP' ? 'seat-vip' : ''}
                  ${selected.find(s => s.id === seat.id) ? 'seat-selected' : ''}
                `}
                onClick={() => toggleSeat(seat)}
                disabled={seat.isBooked}
                title={`Ряд ${seat.row}, место ${seat.number}${seat.type === 'VIP' ? ' (VIP)' : ''}`}
              >
                {seat.number}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="seat-legend">
        <span><span className="legend-box seat-free" /> Свободно</span>
        <span><span className="legend-box seat-selected-demo" /> Выбрано</span>
        <span><span className="legend-box seat-vip-demo" /> VIP</span>
        <span><span className="legend-box seat-booked-demo" /> Занято</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {selected.length > 0 && (
        <div className="booking-summary">
          <div className="summary-info">
            <span>Выбрано мест: {selected.length}</span>
            <span>Итого: <strong>{totalPrice} ₽</strong></span>
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleBook}
            disabled={booking}
          >
            {booking ? 'Бронируем...' : `Забронировать за ${totalPrice} ₽`}
          </button>
        </div>
      )}
    </div>
  );
}
