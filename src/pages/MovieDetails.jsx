import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { movies as moviesApi, sessions as sessionsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [sessionsList, setSessionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    Promise.all([
      moviesApi.getById(id),
      sessionsApi.getAll({ movieId: id })
    ]).then(([m, s]) => {
      setMovie(m);
      setSessionsList(s);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const dates = [...new Set(sessionsList.map(s =>
    new Date(s.startTime).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  ))];

  const filtered = selectedDate
    ? sessionsList.filter(s =>
        new Date(s.startTime).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) === selectedDate)
    : sessionsList;

  if (loading) return <div className="loading">Загрузка...</div>;
  if (!movie) return <div className="error">Фильм не найден</div>;

  return (
    <div className="page">
      <div className="movie-detail">
        <div className="movie-detail-poster">
          {movie.posterUrl
            ? <img src={movie.posterUrl} alt={movie.title} />
            : <div className="poster-placeholder-lg">🎬</div>
          }
        </div>
        <div className="movie-detail-info">
          <h1>{movie.title}</h1>
          <div className="movie-meta">
            <span>⭐ {movie.rating}</span>
            <span>🕐 {movie.durationMinutes} мин</span>
            <span>🎭 {movie.genre}</span>
            <span>📅 {new Date(movie.releaseDate).getFullYear()}</span>
          </div>
          <p className="movie-description">{movie.description}</p>
        </div>
      </div>

      <div className="sessions-section">
        <h2>Расписание сеансов</h2>

        {dates.length > 0 && (
          <div className="date-tabs">
            <button
              className={`date-tab ${!selectedDate ? 'active' : ''}`}
              onClick={() => setSelectedDate('')}
            >Все даты</button>
            {dates.map(d => (
              <button
                key={d}
                className={`date-tab ${selectedDate === d ? 'active' : ''}`}
                onClick={() => setSelectedDate(d)}
              >{d}</button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="empty">Нет доступных сеансов</p>
        ) : (
          <div className="sessions-list">
            {filtered.map(session => (
              <div key={session.id} className="session-card">
                <div className="session-time">
                  {new Date(session.startTime).toLocaleTimeString('ru-RU', {
                    hour: '2-digit', minute: '2-digit'
                  })}
                </div>
                <div className="session-details">
                  <span>🏛 {session.hallName}</span>
                  <span>💺 {session.availableSeats} мест</span>
                </div>
                <div className="session-price">{session.price} ₽</div>
                <button
                  className="btn btn-primary"
                  disabled={session.availableSeats === 0}
                  onClick={() => user ? navigate(`/sessions/${session.id}`) : navigate('/login')}
                >
                  {session.availableSeats === 0 ? 'Мест нет' : 'Выбрать места'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
