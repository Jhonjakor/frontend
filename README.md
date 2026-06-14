# CinemaOnline Frontend

React + Vite frontend для CinemaOnline.

## Запуск

```powershell
copy .env.example .env
npm install
npm run dev
```

## Сборка

```powershell
npm run build
```

## API

Файл `.env.example` содержит локальный backend:

```text
VITE_API_URL=http://localhost:5115/api
```

Основные пользовательские сценарии:

- просмотр фильмов и сеансов;
- выбор свободных мест;
- создание бронирования;
- оплата бронирования;
- просмотр истории заказов в профиле;
- админ-панель с CRUD и отчётами.
