// Базовый URL бэкенда — замени на свой Render URL если деплоишь
const BASE_URL = import.meta.env.VITE_API_URL || 'https://cinemaapi-qsiv.onrender.com';

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

  // 204 No Content — пустой ответ, всё ок
  if (res.status === 204) return null;

  // Читаем как текст сначала — защита от пустого тела
  const text = await res.text();
  if (!text) return null;

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    // Бэкенд вернул не-JSON (HTML страница ошибки и т.д.)
    if (!res.ok) throw new Error(`Ошибка сервера ${res.status}`);
    return null;
  }

  if (!res.ok) {
    throw new Error(data?.message || data?.title || `Ошибка ${res.status}`);
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
  getMe:    ()    => request('GET', '/users/me'),
  updateMe: (dto) => request('PUT', '/users/me', dto),
};

// ══════════════════════════════════════════════════════
// Movies
// ══════════════════════════════════════════════════════

export const moviesApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
    ).toString();
    return request('GET', `/movies${qs ? '?' + qs : ''}`);
  },
  getById: (id)      => request('GET',    `/movies/${id}`),
  create:  (dto)     => request('POST',   '/movies', dto),
  update:  (id, dto) => request('PATCH',  `/movies/${id}`, dto),
  delete:  (id)      => request('DELETE', `/movies/${id}`),
};

// ══════════════════════════════════════════════════════
// Sessions
// ══════════════════════════════════════════════════════

export const sessionsApi = {
  getAll:     (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
    ).toString();
    return request('GET', `/sessions${qs ? '?' + qs : ''}`);
  },
  getByMovie: (movieId) => request('GET', `/sessions?movieId=${movieId}`),
  getById:    (id)      => request('GET', `/sessions/${id}`),
  create:     (dto)     => request('POST',   '/sessions', dto),
  delete:     (id)      => request('DELETE', `/sessions/${id}`),
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
  create:  (dto) => request('POST', '/payments', dto),
  getById: (id)  => request('GET',  `/payments/${id}`),
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
