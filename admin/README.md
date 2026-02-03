# Sami's List - Admin Panel

React admin dashboard for Sami's List. Uses the same backend as the mobile app. Deploy to Vercel as a static SPA.

## Setup

1. Install dependencies (from repo root): `npm install`
2. Copy the app logo into the admin panel (from `admin` folder): `npm run copy-logo`. This copies `mobile/assets/images/Logos/logo.svg` to `admin/public/logo.svg` so the sidebar and login page show the Sami's List logo.
3. Copy `env.example` to `.env` and set `VITE_API_URL` to your backend URL (e.g. `http://localhost:3000` for local dev).
4. If running admin on another origin (e.g. `http://localhost:5174`), add it to the backend's `CORS_ORIGINS` (e.g. `CORS_ORIGINS=http://localhost:3000,http://localhost:5174`).
5. Run the backend, then start the admin app:

   ```bash
   npm run dev:admin
   ```

   Or from the `admin` folder: `npm run dev`. Open http://localhost:5174 (or the port Vite shows).

## Seed admin login

After running the backend seed (`npm run prisma:seed` in the `backend` folder), you can log in with:

- **Username:** `admin`
- **Password:** `Admin123!`

Change these in production (create a new admin from the Admins page and remove or change the seed user).

## Build & deploy (Vercel)

- Build: `npm run build` (from `admin` folder) or `npm run build:admin` from repo root.
- Output: `admin/dist`
- On Vercel: set root directory to `admin`, build command `npm run build`, output directory `dist`.
- Set environment variable `VITE_API_URL` to your production backend URL.
- Ensure the backend allows your Vercel origin in CORS (`CORS_ORIGINS` or equivalent).
