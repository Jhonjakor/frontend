const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5115/api';

export function toQuery(params = {}) {
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '');

  const query = new URLSearchParams(entries).toString();
  return query ? `?${query}` : '';
}

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

  if (res.status === 204) return null;

  const text = await res.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const error = new Error(data?.message || data?.title || `Ошибка ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const authApi = {
  register: (dto) => request('POST', '/auth/register', dto),
  login: (dto) => request('POST', '/auth/login', dto),
};

export const usersApi = {
  getMe: () => request('GET', '/users/me'),
  updateMe: (dto) => request('PUT', '/users/me', dto),
  getAll: () => request('GET', '/users'),
  setRole: (id, role) => request('PATCH', `/users/${id}/role`, { role }),
};

export const moviesApi = {
  getAll: (paramsOrBool = {}) => {
    const params = typeof paramsOrBool === 'boolean'
      ? { isActive: paramsOrBool }
      : paramsOrBool;
    return request('GET', `/movies${toQuery(params)}`);
  },
  getById: (id) => request('GET', `/movies/${id}`),
  create: (dto) => request('POST', '/movies', dto),
  update: (id, dto) => request('PATCH', `/movies/${id}`, dto),
  delete: (id) => request('DELETE', `/movies/${id}`),
};

export const sessionsApi = {
  getAll: (params = {}) => request('GET', `/sessions${toQuery(params)}`),
  getByMovie: (movieId) => request('GET', `/sessions${toQuery({ movieId })}`),
  getById: (id) => request('GET', `/sessions/${id}`),
  getSeats: (id) => request('GET', `/sessions/${id}/seats`),
  create: (dto) => request('POST', '/sessions', dto),
  delete: (id) => request('DELETE', `/sessions/${id}`),
};

export const hallsApi = {
  getAll: () => request('GET', '/halls'),
  getById: (id) => request('GET', `/halls/${id}`),
  create: (dto) => request('POST', '/halls', dto),
  delete: (id) => request('DELETE', `/halls/${id}`),
};

export const bookingsApi = {
  getAll: () => request('GET', '/bookings'),
  getMyBookings: () => request('GET', '/bookings/my'),
  getById: (id) => request('GET', `/bookings/${id}`),
  create: (dto) => request('POST', '/bookings', dto),
  cancel: (id) => request('POST', `/bookings/${id}/cancel`),
};

export const paymentsApi = {
  create: (dto) => request('POST', '/payments', dto),
  pay: (dto) => request('POST', '/payments', dto),
  getByBooking: (bookingId) => request('GET', `/payments/${bookingId}`),
};

export const reportsApi = {
  sales: (params = {}) => request('GET', `/reports/sales${toQuery(params)}`),
  occupancy: (params = {}) => request('GET', `/reports/occupancy${toQuery(params)}`),
};

export const auth = authApi;
export const users = usersApi;
export const movies = moviesApi;
export const sessions = sessionsApi;
export const halls = hallsApi;
export const bookings = bookingsApi;
export const payments = paymentsApi;
export const reports = reportsApi;
