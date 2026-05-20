const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5115/api';

// ── Утилита запросов ─────────────────────────────────────────
async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Ошибка ${res.status}`);
  return data;
}

const get = (path) => request(path);
const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) });
const put = (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) });
const del = (path) => request(path, { method: 'DELETE' });

// ── Auth ──────────────────────────────────────────────────────
export const auth = {
  register: (dto) => post('/auth/register', dto),
  login: (dto) => post('/auth/login', dto),
};

// ── Movies ────────────────────────────────────────────────────
export const movies = {
  getAll: (includeInactive = false) =>
    get(`/movies${includeInactive ? '?includeInactive=true' : ''}`),
  getById: (id) => get(`/movies/${id}`),
  create: (dto) => post('/movies', dto),
  update: (id, dto) => put(`/movies/${id}`, dto),
  delete: (id) => del(`/movies/${id}`),
};

// ── Halls ─────────────────────────────────────────────────────
export const halls = {
  getAll: () => get('/halls'),
  getById: (id) => get(`/halls/${id}`),
  create: (dto) => post('/halls', dto),
  delete: (id) => del(`/halls/${id}`),
};

// ── Sessions ──────────────────────────────────────────────────
export const sessions = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return get(`/sessions${q ? '?' + q : ''}`);
  },
  getById: (id) => get(`/sessions/${id}`),
  getSeats: (id) => get(`/sessions/${id}/seats`),
  create: (dto) => post('/sessions', dto),
  delete: (id) => del(`/sessions/${id}`),
};

// ── Bookings ──────────────────────────────────────────────────
export const bookings = {
  getAll: () => get('/bookings'),
  getById: (id) => get(`/bookings/${id}`),
  create: (dto) => post('/bookings', dto),
  cancel: (id) => del(`/bookings/${id}`),
};

// ── Payments ──────────────────────────────────────────────────
export const payments = {
  pay: (dto) => post('/payments', dto),
  getByBooking: (bookingId) => get(`/payments/${bookingId}`),
};

// ── Users ─────────────────────────────────────────────────────
export const users = {
  getMe: () => get('/users/me'),
  updateMe: (dto) => put('/users/me', dto),
  getAll: () => get('/users'),
  setRole: (id, role) => put(`/users/${id}/role`, { role }),
};
