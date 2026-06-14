import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { bookings as bookingsApi, sessions as sessionsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SeatSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  const loadSeats = useCallback(async () => {
    const [sessionData, seatsData] = await Promise.all([
      sessionsApi.getById(id),
      sessionsApi.getSeats(id),
    ]);
    setSession(sessionData);
    setSeats(seatsData);
    setSelected((prev) => prev.filter((seat) => {
      const fresh = seatsData.find((item) => getSeatId(item) === getSeatId(seat));
      return fresh && !isOccupied(fresh);
    }));
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setError('');
    loadSeats()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [loadSeats]);

  const rows = useMemo(() => seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {}), [seats]);

  const totalPrice = selected.reduce((sum, seat) => sum + Number(seat.price ?? session?.price ?? 0), 0);

  const toggleSeat = (seat) => {
    if (isOccupied(seat)) return;
    const seatId = getSeatId(seat);
    setSelected((prev) =>
      prev.some((item) => getSeatId(item) === seatId)
        ? prev.filter((item) => getSeatId(item) !== seatId)
        : [...prev, seat]
    );
  };

  const handleBook = async () => {
    if (!user && !localStorage.getItem('token')) {
      navigate('/login');
      return;
    }

    if (selected.length === 0) {
      setError('Выберите хотя бы одно место');
      return;
    }

    setBooking(true);
    setError('');

    try {
      const result = await bookingsApi.create({
        sessionId: id,
        seatIds: selected.map(getSeatId),
      });
      navigate(`/bookings/${result.id}`);
    } catch (err) {
      if (err.status === 401) {
        navigate('/login');
        return;
      }

      if (err.status === 409) {
        setError('Выбранные места уже заняты. Обновите схему зала');
        await loadSeats();
      } else {
        setError(err.message);
      }
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (!session) return <div className="error">{error || 'Сеанс не найден'}</div>;

  return (
    <div className="page">
      <div className="booking-header">
        <h1>{session.movieTitle}</h1>
        <p>
          {new Date(session.startTime).toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          })} · {session.hallName}
        </p>
      </div>

      <div className="screen-label">ЭКРАН</div>
      <div className="screen" />

      <div className="seats-map">
        {Object.entries(rows).map(([row, rowSeats]) => (
          <div key={row} className="seat-row">
            <span className="row-label">{row}</span>
            {rowSeats.map((seat) => {
              const seatId = getSeatId(seat);
              const occupied = isOccupied(seat);
              const isSelected = selected.some((item) => getSeatId(item) === seatId);

              return (
                <button
                  key={seatId}
                  className={`seat ${occupied ? 'seat-booked' : ''} ${seat.type === 'VIP' ? 'seat-vip' : ''} ${isSelected ? 'seat-selected' : ''}`}
                  onClick={() => toggleSeat(seat)}
                  disabled={occupied}
                  title={`Ряд ${seat.row}, место ${seat.number}${seat.type === 'VIP' ? ' (VIP)' : ''}`}
                >
                  {seat.number}
                </button>
              );
            })}
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
            <span>Итого: <strong>{formatRub(totalPrice)}</strong></span>
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleBook}
            disabled={booking}
          >
            {booking ? 'Бронируем...' : `Забронировать за ${formatRub(totalPrice)}`}
          </button>
        </div>
      )}
    </div>
  );
}

function getSeatId(seat) {
  return seat.seatId ?? seat.id;
}

function isOccupied(seat) {
  return Boolean(seat.isOccupied ?? seat.isBooked);
}

function formatRub(value) {
  return `${Number(value).toLocaleString('ru-RU')} ₽`;
}
