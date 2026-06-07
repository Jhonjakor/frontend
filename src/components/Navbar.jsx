import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">🎬 КиноОнлайн</Link>

      <div className="navbar-links">
        <Link to="/">Фильмы</Link>
        {isAdmin && <Link to="/admin">Админ</Link>}
        {user ? (
          <>
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
  {user.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt="avatar"
      style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
      onError={e => e.target.style.display = 'none'}
    />
  ) : (
    <span>👤</span>
  )}
  {user.fullName?.split(' ')[0] || user.email}
</Link>
            <button className="btn btn-outline-sm" onClick={handleLogout}>Выйти</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline-sm">Войти</Link>
            <Link to="/register" className="btn btn-primary-sm">Регистрация</Link>
          </>
        )}
      </div>
    </nav>
  );
}
