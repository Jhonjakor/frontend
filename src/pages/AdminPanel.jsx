import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  movies as moviesApi,
  halls as hallsApi,
  sessions as sessionsApi,
  users as usersApi
} from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('movies');
  const [movies, setMovies] = useState([]);
  const [halls, setHalls] = useState([]);
  const [sessionsList, setSessionsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editMovie, setEditMovie] = useState(null);

  // Формы
  const [movieForm, setMovieForm] = useState({
    title: '', description: '', genre: '', durationMinutes: 90,
    rating: 7.0, posterUrl: '', releaseDate: ''
  });
  const [hallForm, setHallForm] = useState({ name: '', rows: 8, seatsPerRow: 12 });
  const [sessionForm, setSessionForm] = useState({
    movieId: '', hallId: '', startTime: '', price: 350
  });

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    loadAll();
  }, [isAdmin]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [m, h, s, u] = await Promise.all([
        moviesApi.getAll(true),
        hallsApi.getAll(),
        sessionsApi.getAll(),
        usersApi.getAll(),
      ]);
      setMovies(m); setHalls(h); setSessionsList(s); setUsersList(u);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  // ── Создание фильма ──
  const createMovie = async (e) => {
    e.preventDefault();
    try {
      await moviesApi.create({
        ...movieForm,
        durationMinutes: +movieForm.durationMinutes,
        rating: +movieForm.rating,
        releaseDate: movieForm.releaseDate
      });
      await loadAll();
      setMovieForm({ title: '', description: '', genre: '', durationMinutes: 90, rating: 7.0, posterUrl: '', releaseDate: '' });
    } catch (e) { setError(e.message); }
  };

  const deleteMovie = async (id) => {
    if (!confirm('Деактивировать фильм?')) return;
    try { await moviesApi.delete(id); await loadAll(); }
    catch (e) { setError(e.message); }
  };

  // ── Создание зала ──
  const createHall = async (e) => {
    e.preventDefault();
    try {
      await hallsApi.create({ ...hallForm, rows: +hallForm.rows, seatsPerRow: +hallForm.seatsPerRow });
      await loadAll();
      setHallForm({ name: '', rows: 8, seatsPerRow: 12 });
    } catch (e) { setError(e.message); }
  };

  const deleteHall = async (id) => {
    if (!confirm('Удалить зал? Все места будут удалены.')) return;
    try { await hallsApi.delete(id); await loadAll(); }
    catch (e) { setError(e.message); }
  };

  // ── Создание сеанса ──
  const createSession = async (e) => {
    e.preventDefault();
    try {
      await sessionsApi.create({
        ...sessionForm,
        startTime: new Date(sessionForm.startTime).toISOString(),
        price: +sessionForm.price
      });
      await loadAll();
      setSessionForm({ movieId: '', hallId: '', startTime: '', price: 350 });
    } catch (e) { setError(e.message); }
  };

  const deleteSession = async (id) => {
    if (!confirm('Отменить сеанс?')) return;
    try { await sessionsApi.delete(id); await loadAll(); }
    catch (e) { setError(e.message); }
  };

  // ── Роль пользователя ──
  const toggleRole = async (user) => {
    const newRole = user.role === 'Admin' ? 'User' : 'Admin';
    if (!confirm(`Изменить роль ${user.email} на ${newRole}?`)) return;
    try { await usersApi.setRole(user.id, newRole); await loadAll(); }
    catch (e) { setError(e.message); }
  };

  const tabs = [
    { id: 'movies', label: '🎬 Фильмы' },
    { id: 'halls', label: '🏛 Залы' },
    { id: 'sessions', label: '🕐 Сеансы' },
    { id: 'users', label: '👥 Пользователи' },
  ];

  return (
    <div className="page admin-page">
      <h1>Панель администратора</h1>

      <div className="admin-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`admin-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >{t.label}</button>
        ))}
      </div>

      {error && <div className="alert alert-error" onClick={() => setError('')}>{error} ✕</div>}
      {loading && <div className="loading">Загрузка...</div>}

      {/* ── ФИЛЬМЫ ── */}
      {tab === 'movies' && (
        <div className="admin-section">
          <form className="admin-form" onSubmit={createMovie}>
            <h3>Добавить фильм</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Название</label>
                <input value={movieForm.title} onChange={e => setMovieForm({...movieForm, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Жанр</label>
                <input value={movieForm.genre} onChange={e => setMovieForm({...movieForm, genre: e.target.value})} required />
              </div>
            </div>
            <div className="form-group">
              <label>Описание</label>
              <textarea value={movieForm.description} onChange={e => setMovieForm({...movieForm, description: e.target.value})} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Длительность (мин)</label>
                <input type="number" value={movieForm.durationMinutes} onChange={e => setMovieForm({...movieForm, durationMinutes: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Рейтинг</label>
                <input type="number" step="0.1" min="0" max="10" value={movieForm.rating} onChange={e => setMovieForm({...movieForm, rating: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Дата выхода</label>
                <input type="date" value={movieForm.releaseDate} onChange={e => setMovieForm({...movieForm, releaseDate: e.target.value})} required />
              </div>
            </div>
            <div className="form-group">
              <label>URL постера</label>
              <input type="url" value={movieForm.posterUrl} onChange={e => setMovieForm({...movieForm, posterUrl: e.target.value})} placeholder="https://..." />
            </div>
            <button type="submit" className="btn btn-primary">Добавить фильм</button>
          </form>
          {editMovie && (
  <form className="admin-form" style={{ border: '1px solid #e53e3e', marginBottom: 24 }}
    onSubmit={async (e) => {
      e.preventDefault();
      try {
        await moviesApi.update(editMovie.id, {
          title:           editMovie.title,
          description:     editMovie.description,
          genre:           editMovie.genre,
          durationMinutes: +editMovie.durationMinutes,
          rating:          +editMovie.rating,
          posterUrl:       editMovie.posterUrl || null,
        });
        setEditMovie(null);
        await loadAll();
      } catch (e) { setError(e.message); }
    }}>
    <h3>✎ Редактировать: {editMovie.title}</h3>
    <div className="form-row">
      <div className="form-group">
        <label>Название</label>
        <input value={editMovie.title}
          onChange={e => setEditMovie({...editMovie, title: e.target.value})} required />
      </div>
      <div className="form-group">
        <label>Жанр</label>
        <input value={editMovie.genre}
          onChange={e => setEditMovie({...editMovie, genre: e.target.value})} required />
      </div>
    </div>
    <div className="form-group">
      <label>Описание</label>
      <textarea value={editMovie.description}
        onChange={e => setEditMovie({...editMovie, description: e.target.value})} required />
    </div>
    <div className="form-row">
      <div className="form-group">
        <label>Длительность (мин)</label>
        <input type="number" value={editMovie.durationMinutes}
          onChange={e => setEditMovie({...editMovie, durationMinutes: e.target.value})} required />
      </div>
      <div className="form-group">
        <label>Рейтинг</label>
        <input type="number" step="0.1" min="0" max="10" value={editMovie.rating}
          onChange={e => setEditMovie({...editMovie, rating: e.target.value})} required />
      </div>
    </div>
    <div className="form-group">
      <label>URL постера</label>
      <input value={editMovie.posterUrl || ''}
        onChange={e => setEditMovie({...editMovie, posterUrl: e.target.value})} />
    </div>
    <div style={{ display: 'flex', gap: 12 }}>
      <button type="submit" className="btn btn-primary">Сохранить</button>
      <button type="button" className="btn btn-secondary" onClick={() => setEditMovie(null)}>Отмена</button>
    </div>
  </form>
)}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Название</th><th>Жанр</th><th>Мин</th><th>Рейтинг</th><th>Статус</th><th></th></tr></thead>
              <tbody>
                {movies.map(m => (
                  <tr key={m.id}>
                    <td>{m.title}</td>
                    <td>{m.genre}</td>
                    <td>{m.durationMinutes}</td>
                    <td>⭐ {m.rating}</td>
                    <td><span className={`badge ${m.isActive !== false ? 'badge-green' : 'badge-red'}`}>{m.isActive !== false ? 'Активен' : 'Скрыт'}</span></td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-sm btn-secondary" onClick={() => setEditMovie(m)}>✎</button>
                      <button className="btn-sm btn-danger" onClick={() => deleteMovie(m.id)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ЗАЛЫ ── */}
      {tab === 'halls' && (
        <div className="admin-section">
          <form className="admin-form" onSubmit={createHall}>
            <h3>Добавить зал</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Название</label>
                <input value={hallForm.name} onChange={e => setHallForm({...hallForm, name: e.target.value})} required placeholder="Зал №1" />
              </div>
              <div className="form-group">
                <label>Рядов</label>
                <input type="number" min="1" max="30" value={hallForm.rows} onChange={e => setHallForm({...hallForm, rows: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Мест в ряду</label>
                <input type="number" min="1" max="30" value={hallForm.seatsPerRow} onChange={e => setHallForm({...hallForm, seatsPerRow: e.target.value})} required />
              </div>
            </div>
            <p className="form-hint">Последний ряд будет автоматически назначен VIP</p>
            <button type="submit" className="btn btn-primary">Создать зал</button>
          </form>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Название</th><th>Рядов</th><th>Мест в ряду</th><th>Всего мест</th><th></th></tr></thead>
              <tbody>
                {halls.map(h => (
                  <tr key={h.id}>
                    <td>{h.name}</td>
                    <td>{h.rows}</td>
                    <td>{h.seatsPerRow}</td>
                    <td>{h.totalSeats}</td>
                    <td><button className="btn-sm btn-danger" onClick={() => deleteHall(h.id)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── СЕАНСЫ ── */}
      {tab === 'sessions' && (
        <div className="admin-section">
          <form className="admin-form" onSubmit={createSession}>
            <h3>Добавить сеанс</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Фильм</label>
                <select value={sessionForm.movieId} onChange={e => setSessionForm({...sessionForm, movieId: e.target.value})} required>
                  <option value="">— выберите —</option>
                  {movies.filter(m => m.isActive !== false).map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Зал</label>
                <select value={sessionForm.hallId} onChange={e => setSessionForm({...sessionForm, hallId: e.target.value})} required>
                  <option value="">— выберите —</option>
                  {halls.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Дата и время</label>
                <input type="datetime-local" value={sessionForm.startTime} onChange={e => setSessionForm({...sessionForm, startTime: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Цена (₽)</label>
                <input type="number" min="1" value={sessionForm.price} onChange={e => setSessionForm({...sessionForm, price: e.target.value})} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Создать сеанс</button>
          </form>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Фильм</th><th>Зал</th><th>Начало</th><th>Цена</th><th>Мест</th><th></th></tr></thead>
              <tbody>
                {sessionsList.map(s => (
                  <tr key={s.id}>
                    <td>{s.movieTitle}</td>
                    <td>{s.hallName}</td>
                    <td>{new Date(s.startTime).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{s.price} ₽</td>
                    <td>{s.availableSeats}</td>
                    <td><button className="btn-sm btn-danger" onClick={() => deleteSession(s.id)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ПОЛЬЗОВАТЕЛИ ── */}
      {tab === 'users' && (
        <div className="admin-section">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Email</th><th>Имя</th><th>Телефон</th><th>Роль</th><th>Дата</th><th></th></tr></thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.firstName} {u.lastName}</td>
                    <td>{u.phone || '—'}</td>
                    <td><span className={`badge ${u.role === 'Admin' ? 'badge-purple' : 'badge-gray'}`}>{u.role}</span></td>
                    <td>{new Date(u.createdAt).toLocaleDateString('ru-RU')}</td>
                    <td>
                      <button className="btn-sm btn-secondary" onClick={() => toggleRole(u)}>
                        {u.role === 'Admin' ? '→ User' : '→ Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
