import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  halls as hallsApi,
  movies as moviesApi,
  reports as reportsApi,
  sessions as sessionsApi,
  users as usersApi,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const today = new Date().toISOString().slice(0, 10);
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString()
  .slice(0, 10);

export default function AdminPanel() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('movies');
  const [movies, setMovies] = useState([]);
  const [halls, setHalls] = useState([]);
  const [sessionsList, setSessionsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [salesReport, setSalesReport] = useState([]);
  const [occupancyReport, setOccupancyReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editMovie, setEditMovie] = useState(null);
  const [reportFilters, setReportFilters] = useState({ dateFrom: monthStart, dateTo: today });
  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    genre: '',
    durationMinutes: 90,
    rating: 7,
    posterUrl: '',
    releaseDate: today,
  });
  const [hallForm, setHallForm] = useState({ name: '', rows: 8, seatsPerRow: 12 });
  const [sessionForm, setSessionForm] = useState({ movieId: '', hallId: '', startTime: '', price: 350 });

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [activeMovies, inactiveMovies, hallsData, sessionsData, usersData] = await Promise.all([
        moviesApi.getAll({ isActive: true }),
        moviesApi.getAll({ isActive: false }),
        hallsApi.getAll(),
        sessionsApi.getAll(),
        usersApi.getAll(),
      ]);
      setMovies([...activeMovies, ...inactiveMovies]);
      setHalls(hallsData);
      setSessionsList(sessionsData);
      setUsersList(usersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    setError('');

    try {
      const [sales, occupancy] = await Promise.all([
        reportsApi.sales(reportFilters),
        reportsApi.occupancy(reportFilters),
      ]);
      setSalesReport(sales);
      setOccupancyReport(occupancy);
    } catch (err) {
      setError(err.message);
    } finally {
      setReportsLoading(false);
    }
  }, [reportFilters]);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadAll();
  }, [isAdmin, loadAll, navigate]);

  useEffect(() => {
    if (isAdmin && tab === 'reports') loadReports();
  }, [isAdmin, loadReports, tab]);

  const createMovie = async (e) => {
    e.preventDefault();
    try {
      await moviesApi.create({
        ...movieForm,
        durationMinutes: Number(movieForm.durationMinutes),
        rating: Number(movieForm.rating),
        posterUrl: movieForm.posterUrl || null,
      });
      setMovieForm({ title: '', description: '', genre: '', durationMinutes: 90, rating: 7, posterUrl: '', releaseDate: today });
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveMovie = async (e) => {
    e.preventDefault();
    try {
      await moviesApi.update(editMovie.id, {
        title: editMovie.title,
        description: editMovie.description,
        genre: editMovie.genre,
        durationMinutes: Number(editMovie.durationMinutes),
        rating: Number(editMovie.rating),
        posterUrl: editMovie.posterUrl || null,
      });
      setEditMovie(null);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteMovie = async (id) => {
    if (!confirm('Деактивировать фильм?')) return;
    try {
      await moviesApi.delete(id);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const createHall = async (e) => {
    e.preventDefault();
    try {
      await hallsApi.create({
        name: hallForm.name,
        rows: Number(hallForm.rows),
        seatsPerRow: Number(hallForm.seatsPerRow),
      });
      setHallForm({ name: '', rows: 8, seatsPerRow: 12 });
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteHall = async (id) => {
    if (!confirm('Удалить зал?')) return;
    try {
      await hallsApi.delete(id);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const createSession = async (e) => {
    e.preventDefault();
    try {
      await sessionsApi.create({
        movieId: sessionForm.movieId,
        hallId: sessionForm.hallId,
        startTime: new Date(sessionForm.startTime).toISOString(),
        price: Number(sessionForm.price),
      });
      setSessionForm({ movieId: '', hallId: '', startTime: '', price: 350 });
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteSession = async (id) => {
    if (!confirm('Отменить сеанс?')) return;
    try {
      await sessionsApi.delete(id);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleRole = async (user) => {
    const nextRole = user.role === 'Admin' ? 'User' : 'Admin';
    if (!confirm(`Изменить роль ${user.email} на ${nextRole}?`)) return;
    try {
      await usersApi.setRole(user.id, nextRole);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const exportCsv = (rows, fileName) => {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(';'),
      ...rows.map((row) => headers.map((key) => String(row[key] ?? '').replaceAll(';', ',')).join(';')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'movies', label: 'Фильмы' },
    { id: 'halls', label: 'Залы' },
    { id: 'sessions', label: 'Сеансы' },
    { id: 'users', label: 'Пользователи' },
    { id: 'reports', label: 'Отчёты' },
  ];

  return (
    <div className="page admin-page">
      <h1>Панель администратора</h1>

      <div className="admin-tabs">
        {tabs.map((item) => (
          <button
            key={item.id}
            className={`admin-tab ${tab === item.id ? 'active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error" onClick={() => setError('')}>{error}</div>}
      {loading && <div className="loading">Загрузка...</div>}

      {tab === 'movies' && (
        <div className="admin-section">
          <form className="admin-form" onSubmit={createMovie}>
            <h3>Добавить фильм</h3>
            <div className="form-row">
              <Field label="Название" value={movieForm.title} onChange={(value) => setMovieForm({ ...movieForm, title: value })} required />
              <Field label="Жанр" value={movieForm.genre} onChange={(value) => setMovieForm({ ...movieForm, genre: value })} required />
            </div>
            <div className="form-group">
              <label>Описание</label>
              <textarea value={movieForm.description} onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })} required />
            </div>
            <div className="form-row">
              <Field type="number" label="Длительность, мин" value={movieForm.durationMinutes} onChange={(value) => setMovieForm({ ...movieForm, durationMinutes: value })} min="1" required />
              <Field type="number" label="Рейтинг" value={movieForm.rating} onChange={(value) => setMovieForm({ ...movieForm, rating: value })} min="0" max="10" step="0.1" required />
              <Field type="date" label="Дата выхода" value={movieForm.releaseDate} onChange={(value) => setMovieForm({ ...movieForm, releaseDate: value })} required />
            </div>
            <Field type="url" label="URL постера" value={movieForm.posterUrl} onChange={(value) => setMovieForm({ ...movieForm, posterUrl: value })} placeholder="https://..." />
            <button type="submit" className="btn btn-primary">Добавить фильм</button>
          </form>

          {editMovie && (
            <form className="admin-form" onSubmit={saveMovie}>
              <h3>Редактировать: {editMovie.title}</h3>
              <div className="form-row">
                <Field label="Название" value={editMovie.title} onChange={(value) => setEditMovie({ ...editMovie, title: value })} required />
                <Field label="Жанр" value={editMovie.genre} onChange={(value) => setEditMovie({ ...editMovie, genre: value })} required />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea value={editMovie.description} onChange={(e) => setEditMovie({ ...editMovie, description: e.target.value })} required />
              </div>
              <div className="form-row">
                <Field type="number" label="Длительность, мин" value={editMovie.durationMinutes} onChange={(value) => setEditMovie({ ...editMovie, durationMinutes: value })} min="1" required />
                <Field type="number" label="Рейтинг" value={editMovie.rating} onChange={(value) => setEditMovie({ ...editMovie, rating: value })} min="0" max="10" step="0.1" required />
              </div>
              <Field label="URL постера" value={editMovie.posterUrl || ''} onChange={(value) => setEditMovie({ ...editMovie, posterUrl: value })} />
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Сохранить</button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditMovie(null)}>Отмена</button>
              </div>
            </form>
          )}

          <Table
            headers={['Название', 'Жанр', 'Мин', 'Рейтинг', 'Статус', '']}
            rows={movies.map((movie) => [
              movie.title,
              movie.genre,
              movie.durationMinutes,
              movie.rating,
              <span className={`badge ${movie.isActive ? 'badge-green' : 'badge-red'}`}>{movie.isActive ? 'Активен' : 'Скрыт'}</span>,
              <div className="row-actions">
                <button className="btn-sm btn-secondary" onClick={() => setEditMovie(movie)}>Править</button>
                {movie.isActive && <button className="btn-sm btn-danger" onClick={() => deleteMovie(movie.id)}>Скрыть</button>}
              </div>,
            ])}
          />
        </div>
      )}

      {tab === 'halls' && (
        <div className="admin-section">
          <form className="admin-form" onSubmit={createHall}>
            <h3>Добавить зал</h3>
            <div className="form-row">
              <Field label="Название" value={hallForm.name} onChange={(value) => setHallForm({ ...hallForm, name: value })} placeholder="Зал №1" required />
              <Field type="number" label="Рядов" value={hallForm.rows} onChange={(value) => setHallForm({ ...hallForm, rows: value })} min="1" max="30" required />
              <Field type="number" label="Мест в ряду" value={hallForm.seatsPerRow} onChange={(value) => setHallForm({ ...hallForm, seatsPerRow: value })} min="1" max="30" required />
            </div>
            <p className="form-hint">Последний ряд автоматически создаётся как VIP.</p>
            <button type="submit" className="btn btn-primary">Создать зал</button>
          </form>

          <Table
            headers={['Название', 'Рядов', 'Мест в ряду', 'Всего мест', '']}
            rows={halls.map((hall) => [
              hall.name,
              hall.rows,
              hall.seatsPerRow,
              hall.totalSeats,
              <button className="btn-sm btn-danger" onClick={() => deleteHall(hall.id)}>Удалить</button>,
            ])}
          />
        </div>
      )}

      {tab === 'sessions' && (
        <div className="admin-section">
          <form className="admin-form" onSubmit={createSession}>
            <h3>Добавить сеанс</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Фильм</label>
                <select value={sessionForm.movieId} onChange={(e) => setSessionForm({ ...sessionForm, movieId: e.target.value })} required>
                  <option value="">Выберите фильм</option>
                  {movies.filter((movie) => movie.isActive).map((movie) => (
                    <option key={movie.id} value={movie.id}>{movie.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Зал</label>
                <select value={sessionForm.hallId} onChange={(e) => setSessionForm({ ...sessionForm, hallId: e.target.value })} required>
                  <option value="">Выберите зал</option>
                  {halls.map((hall) => (
                    <option key={hall.id} value={hall.id}>{hall.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <Field type="datetime-local" label="Дата и время" value={sessionForm.startTime} onChange={(value) => setSessionForm({ ...sessionForm, startTime: value })} required />
              <Field type="number" label="Цена, ₽" value={sessionForm.price} onChange={(value) => setSessionForm({ ...sessionForm, price: value })} min="1" required />
            </div>
            <button type="submit" className="btn btn-primary">Создать сеанс</button>
          </form>

          <Table
            headers={['Фильм', 'Зал', 'Начало', 'Цена', 'Доступно мест', '']}
            rows={sessionsList.map((session) => [
              session.movieTitle,
              session.hallName,
              formatDate(session.startTime),
              formatRub(session.price),
              session.availableSeats,
              <button className="btn-sm btn-danger" onClick={() => deleteSession(session.id)}>Отменить</button>,
            ])}
          />
        </div>
      )}

      {tab === 'users' && (
        <div className="admin-section">
          <Table
            headers={['Email', 'Имя', 'Телефон', 'Роль', 'Дата', '']}
            rows={usersList.map((user) => [
              user.email,
              `${user.firstName} ${user.lastName}`,
              user.phone || '—',
              <span className={`badge ${user.role === 'Admin' ? 'badge-purple' : 'badge-gray'}`}>{user.role}</span>,
              new Date(user.createdAt).toLocaleDateString('ru-RU'),
              <button className="btn-sm btn-secondary" onClick={() => toggleRole(user)}>
                {user.role === 'Admin' ? 'Сделать User' : 'Сделать Admin'}
              </button>,
            ])}
          />
        </div>
      )}

      {tab === 'reports' && (
        <div className="admin-section">
          <form className="admin-form" onSubmit={(e) => { e.preventDefault(); loadReports(); }}>
            <h3>Период отчётов</h3>
            <div className="form-row">
              <Field type="date" label="Дата с" value={reportFilters.dateFrom} onChange={(value) => setReportFilters({ ...reportFilters, dateFrom: value })} required />
              <Field type="date" label="Дата по" value={reportFilters.dateTo} onChange={(value) => setReportFilters({ ...reportFilters, dateTo: value })} required />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={reportsLoading}>
                {reportsLoading ? 'Загружаем...' : 'Обновить отчёты'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => window.print()}>Печать</button>
              <button type="button" className="btn btn-secondary" onClick={() => exportCsv(salesReport, 'sales-report.csv')}>CSV продажи</button>
              <button type="button" className="btn btn-secondary" onClick={() => exportCsv(occupancyReport, 'occupancy-report.csv')}>CSV загрузка</button>
            </div>
          </form>

          <div>
            <h2 className="admin-subtitle">Продажи</h2>
            <Table
              headers={['Фильм', 'Билетов', 'Выручка', 'Средняя цена']}
              rows={salesReport.map((row) => [
                row.movieTitle,
                row.ticketsSold,
                formatRub(row.revenue),
                formatRub(row.averagePrice),
              ])}
            />
          </div>

          <div>
            <h2 className="admin-subtitle">Загрузка залов</h2>
            <Table
              headers={['Сеанс', 'Фильм', 'Зал', 'Начало', 'Вместимость', 'Продано', 'Загрузка', 'Выручка']}
              rows={occupancyReport.map((row) => [
                row.sessionId.slice(0, 8),
                row.movieTitle,
                row.hallName,
                formatDate(row.startTime),
                row.capacity,
                row.soldSeats,
                `${Number(row.occupancyPercent).toLocaleString('ru-RU')}%`,
                formatRub(row.revenue),
              ])}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', ...props }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} {...props} />
    </div>
  );
}

function Table({ headers, rows }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="table-empty">Нет данных</td></tr>
          ) : rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(value) {
  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRub(value) {
  return `${Number(value).toLocaleString('ru-RU')} ₽`;
}
