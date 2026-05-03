# CLAUDE.md — WantToBeGigaChad

Фитнес-геймификация для группы друзей (~10 человек). React SPA + Firebase Realtime DB + Vercel Serverless. Интерфейс на русском языке.

## Команды

```bash
npm run dev      # dev-сервер на localhost:5173
npm run build    # сборка в dist/
npm run lint     # ESLint
```

## Деплой

```bash
git add .
git commit -m "feat: описание"
git push
# GitHub Actions автоматически билдит и деплоит на GitHub Pages (ветка gh-pages)
```

## Стек

- React 19 + Vite 8, JSX (не TSX), ES Modules
- Firebase Realtime Database (не Firestore, не Auth)
- Recharts — только в WeightTracker
- Единственный бэкенд: `api/notify.js` — Vercel Serverless, Telegram Bot

## Архитектура

- Навигация между экранами через стейт в `App.jsx` (не React Router)
- Весь шаред-стейт в `src/GameContext.jsx` через `useGame()` хук
- Firebase данные: `fitrace/players`, `fitrace/daily/{YYYY-MM-DD}/{playerId}`, `fitrace/activityLog`, `fitrace/hallOfFame`, `fitrace/teams`

## Стиль кода

- Только JSX, без TypeScript
- Инлайн стили через объекты (`style={{ ... }}`), без CSS-модулей и без Tailwind
- CSS-свойства без пробелов вокруг значений: `color:'red'` а не `color: 'red'`
- Никаких комментариев кроме случаев когда логика неочевидна
- Компоненты-хелперы объявлять внутри файла, не выносить в отдельные файлы без необходимости
- CSS-переменные: `--bg`, `--surf`, `--surf2`, `--gold`, `--red`, `--green`, `--text`, `--dim`, `--border`
- Шрифты: `'Press Start 2P'` (заголовки/акценты), `'Oswald'` (лейблы), `'Nunito'` (текст)

## Очки за упражнения

```
Подтягивания ×4 | Отжимания ×2 | Брусья ×3 | Приседания ×1
Планка ×15/мин | Пресс ×0.3/×10 | Бег ×40/км
Пиво −20 | Крепкое −30 | Вино +10
```

## Что НЕ делать

- Не трогать `src/images.js` — 762 KB base64, не читать без крайней нужды
- Не добавлять TypeScript
- Не менять `Chat.jsx` (История трень) — пользователь доволен
- Не использовать CSS-фреймворки (Tailwind, Bootstrap и т.д.)
- Не добавлять React Router — навигация через стейт намеренно
- `api/notify.js` — только для Telegram, не расширять без запроса
