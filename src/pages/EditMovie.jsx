import { useState, useEffect } from 'react';
import { moviesApi } from '../services/api';

/**
 * Форма редактирования фильма (для Admin).
 * Props:
 *   movieId — Guid фильма. Если не передан — режим создания.
 *   onSaved  — колбэк после успешного сохранения (необязательный)
 */
export default function EditMovie({ movieId, onSaved }) {
  const isEdit = Boolean(movieId);

  const [form, setForm] = useState({
    title: '',
    description: '',
    genre: '',
    durationMinutes: '',
    rating: '',
    posterUrl: '',
  });
  const [loading, setLoading] = useState(isEdit); // грузим только в режиме редактирования
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Загрузить данные фильма если редактируем
  useEffect(() => {
    if (!isEdit) return;
    moviesApi.getById(movieId)
      .then((m) => setForm({
        title: m.title,
        description: m.description,
        genre: m.genre,
        durationMinutes: String(m.durationMinutes),
        rating: String(m.rating),
        posterUrl: m.posterUrl ?? '',
      }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [movieId]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const payload = {
        title:           form.title,
        description:     form.description,
        genre:           form.genre,
        durationMinutes: Number(form.durationMinutes),
        rating:          Number(form.rating),
        posterUrl:       form.posterUrl || null,
      };

      if (isEdit) {
        await moviesApi.update(movieId, payload);
        setSuccess('Фильм обновлён!');
      } else {
        // Для создания нужна ещё дата выхода
        await moviesApi.create({ ...payload, releaseDate: form.releaseDate });
        setSuccess('Фильм добавлен!');
        // Сброс формы после создания
        setForm({ title: '', description: '', genre: '', durationMinutes: '', rating: '', posterUrl: '', releaseDate: '' });
      }

      onSaved?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Загрузка данных фильма...</p>;

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>{isEdit ? 'Редактировать фильм' : 'Добавить фильм'}</h2>

      <form onSubmit={handleSubmit}>
        <Field label="Название" name="title" value={form.title} onChange={handleChange} required />
        <Field label="Жанр" name="genre" value={form.genre} onChange={handleChange} required />

        <label style={labelStyle}>
          Описание
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            required
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>

        <div style={{ display: 'flex', gap: 12 }}>
          <Field
            label="Длительность (мин)"
            name="durationMinutes"
            type="number"
            min="1"
            value={form.durationMinutes}
            onChange={handleChange}
            required
          />
          <Field
            label="Рейтинг (0–10)"
            name="rating"
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={form.rating}
            onChange={handleChange}
            required
          />
        </div>

        <Field label="URL постера" name="posterUrl" value={form.posterUrl} onChange={handleChange} />

        {/* Дата выхода только при создании */}
        {!isEdit && (
          <Field
            label="Дата выхода"
            name="releaseDate"
            type="date"
            value={form.releaseDate ?? ''}
            onChange={handleChange}
            required
          />
        )}

        {error   && <p style={{ color: 'red'   }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}

        <button type="submit" disabled={saving} style={btnStyle}>
          {saving ? 'Сохраняем...' : isEdit ? 'Сохранить изменения' : 'Добавить фильм'}
        </button>
      </form>
    </div>
  );
}

// ── Маленький переиспользуемый компонент поля ──────────
function Field({ label, ...props }) {
  return (
    <label style={{ ...labelStyle, flex: 1 }}>
      {label}
      <input style={inputStyle} {...props} />
    </label>
  );
}

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  marginBottom: 16,
  fontWeight: 500,
  fontSize: 14,
};

const inputStyle = {
  padding: '8px',
  marginTop: 4,
  borderRadius: 6,
  border: '1px solid #ccc',
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
};

const btnStyle = {
  width: '100%',
  padding: '10px',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 15,
};
