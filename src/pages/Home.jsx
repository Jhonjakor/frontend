import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { movies as moviesApi } from '../services/api';

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    moviesApi.getAll()
      .then(setMovies)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = movies.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.genre.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="page">
      <div className="hero">
        <h1>🎬 Онлайн-кинотеатр</h1>
        <p>Выберите фильм и забронируйте место онлайн</p>
        <input
          className="search-input"
          placeholder="Поиск по названию или жанру..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="empty">Фильмы не найдены</p>
      ) : (
        <div className="movies-grid">
          {filtered.map(movie => (
            <Link to={`/movies/${movie.id}`} key={movie.id} className="movie-card">
              <div className="movie-poster">
                {movie.posterUrl
                  ? <img src={movie.posterUrl} alt={movie.title} />
                  : <div className="poster-placeholder">🎬</div>
                }
                <span className="movie-rating">⭐ {movie.rating}</span>
              </div>
              <div className="movie-info">
                <h3>{movie.title}</h3>
                <p className="movie-genre">{movie.genre} · {movie.durationMinutes} мин</p>
                <p className="movie-desc">{movie.description.slice(0, 100)}...</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
