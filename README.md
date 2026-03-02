# KARR.AI Dashboard

Full-stack dashboard for clients, projects, tasks, billing, support, and calendar.

## Requirements

- Node.js 20+
- npm

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local`.
3. Fill required env vars.
4. Start the app:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`.

## Initial login

- Email: `admin@karr.ai`
- Password: `admin123`

## Google Calendar setup

Set these values in `.env.local`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

In Google Cloud Console:
- Enable Google Calendar API.
- Configure OAuth consent screen.
- Create an OAuth 2.0 Client ID (Web application).
- Add this Authorized redirect URI:
  `http://localhost:3000/api/auth/google/callback`

If any of these vars are missing, the app will block OAuth start and show a clear error in Calendar.

## Persistence

- SQLite database: `data.db`
- Activity history table: `activity_log`
- User settings, notifications, password, and API keys are persisted.

## Useful commands

- Type check:
  ```bash
  npm run lint
  ```
- Production build:
  ```bash
  npm run build
  ```
