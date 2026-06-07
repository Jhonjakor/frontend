// Базовый URL бэкенда
const BASE_URL = 'http://localhost:5115/api';

// ── Хелпер: общий fetch с авторизацией ───────────────
async function request(method, path, body = null) {
  const token = localStorage.getItem('token');

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : null,
  });

  // Для 204 No Content ничего не парсим
  if (res.status === 204) return null;

  const data = await res.json();

  if (!res.ok) {
    // Пробрасываем сообщение из бэкенда
    throw new Error(data.message || `Ошибка ${res.status}`);
  }

  return data;
}

// ══════════════════════════════════════════════════════
// Auth
// ══════════════════════════════════════════════════════

export const authApi = {
  register: (dto) => request('POST', '/auth/register', dto),
  login:    (dto) => request('POST', '/auth/login', dto),
};

// ══════════════════════════════════════════════════════
// Users (профиль)
// ══════════════════════════════════════════════════════

export const usersApi = {
  // Получить свой профиль
  getMe: () => request('GET', '/users/me'),

  // Обновить своё имя/фамилию/телефон
  updateMe: (dto) => request('PUT', '/users/me', dto),
};

// ══════════════════════════════════════════════════════
// Movies
// ══════════════════════════════════════════════════════

export const moviesApi = {
  // Список (публичный). genre и isActive — опциональные фильтры
  getAll: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
    ).toString();
    return request('GET', `/movies${qs ? '?' + qs : ''}`);
  },

  getById: (id) => request('GET', `/movies/${id}`),

  // Admin: создать фильм
  create: (dto) => request('POST', '/movies', dto),

  // Admin: частичное обновление фильма
  update: (id, dto) => request('PATCH', `/movies/${id}`, dto),

  // Admin: деактивировать фильм (мягкое удаление)
  delete: (id) => request('DELETE', `/movies/${id}`),
};

// ══════════════════════════════════════════════════════
// Sessions
// ══════════════════════════════════════════════════════

export const sessionsApi = {
  getByMovie: (movieId) => request('GET', `/sessions?movieId=${movieId}`),
  getById:    (id)      => request('GET', `/sessions/${id}`),
};

// ══════════════════════════════════════════════════════
// Halls
// ══════════════════════════════════════════════════════

export const hallsApi = {
  getAll:  ()        => request('GET',    '/halls'),
  getById: (id)      => request('GET',    `/halls/${id}`),
  create:  (dto)     => request('POST',   '/halls', dto),
  delete:  (id)      => request('DELETE', `/halls/${id}`),
};

// ══════════════════════════════════════════════════════
// Bookings
// ══════════════════════════════════════════════════════

export const bookingsApi = {
  getMyBookings: ()    => request('GET',  '/bookings/my'),
  getById:       (id)  => request('GET',  `/bookings/${id}`),
  create:        (dto) => request('POST', '/bookings', dto),
  cancel:        (id)  => request('POST', `/bookings/${id}/cancel`),
};

// ══════════════════════════════════════════════════════
// Payments
// ══════════════════════════════════════════════════════

export const paymentsApi = {
  create: (dto) => request('POST', '/payments', dto),
  getById: (id) => request('GET',  `/payments/${id}`),
};

// ══════════════════════════════════════════════════════
// Алиасы для обратной совместимости
// ══════════════════════════════════════════════════════

export const auth     = authApi;
export const users    = usersApi;
export const movies   = moviesApi;
export const sessions = sessionsApi;
export const halls    = hallsApi;
export const bookings = bookingsApi;
export const payments = paymentsApi;
