# Sami's List - Gas Delivery Application

A gas delivery mobile application for Amman, Jordan. Users can order gas cylinders through the app, vendors receive orders and dispatch drivers to deliver them.

## Tech Stack

- **Backend**: Node.js with NestJS, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Mobile**: React Native with Expo
- **Admin**: React with Vite, Tailwind CSS, shadcn/ui

## Project Structure

```
.
├── backend/          # NestJS backend application
├── mobile/           # React Native/Expo mobile application
├── shared/           # Shared TypeScript types and interfaces
└── package.json      # Monorepo workspace configuration
```

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Supabase account (for PostgreSQL database)
- Upstash account (for Redis cache)
- Expo CLI (for mobile development) - optional, can use `npx expo`

## Setup Instructions

### 1. Set Up Cloud Services

#### Supabase (PostgreSQL Database)

1. Go to [Supabase](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the database to be provisioned (takes ~2 minutes)
4. Go to **Project Settings** → **Database**
5. Copy the **Connection String** (URI format)
   - It will look like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
   - Replace `[YOUR-PASSWORD]` with your actual database password
   - Add `?sslmode=require` at the end for SSL connection

#### Upstash (Redis Cache)

1. Go to [Upstash](https://upstash.com) and create a free account
2. Create a new Redis database
3. Choose a region closest to you
4. Go to your database → **REST API** tab
5. Copy the **Redis URL**
   - It will look like: `redis://default:xxxxx@xxxxx.upstash.io:6379`
   - Or `rediss://...` if using SSL

### 2. Install Dependencies

```bash
npm install
```

This will install dependencies for all workspaces (backend, mobile, shared).

### 3. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the environment example file:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your configuration:
   - `DATABASE_URL`: PostgreSQL connection string from Supabase
     - Format: `postgresql://user:password@host:port/database?sslmode=require`
     - Get this from Supabase Dashboard → Project Settings → Database → Connection String
   - `REDIS_URL`: Redis connection string from Upstash
     - Format: `redis://default:password@host:port` or `rediss://...` for SSL
     - Get this from Upstash Dashboard → Your Database → REST API → Redis URL
   - `JWT_SECRET`: Secret key for JWT tokens (already generated in .env)
   - `JWT_REFRESH_SECRET`: Secret key for JWT refresh tokens (already generated in .env)
   - `PORT`: Backend server port (default: 3000)
   - `NODE_ENV`: Environment (development, production, test)

4. Run Prisma migrations:
   ```bash
   npm run prisma:migrate
   ```

6. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

7. Start the backend server:
   ```bash
   npm run dev
   ```

### 4. Mobile Setup

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Copy the environment example file:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your API endpoint:
   - `EXPO_PUBLIC_API_URL`: Backend API URL (e.g., http://localhost:3000)

4. Start the Expo development server:
   ```bash
   npm start
   ```

   Or use the root command:
   ```bash
   npm run dev:mobile
   ```

### 5. Pre-commit Hooks

Pre-commit hooks are set up to check for secrets and enforce code quality. They will run automatically on `git commit`.

To manually run the hooks:
```bash
npm run prepare
```

## Development

### Running Backend
```bash
npm run dev:backend
```

### Running Mobile App
```bash
npm run dev:mobile
```

## Environment Variables

### Backend (.env)
- `DATABASE_URL`: PostgreSQL connection string from Supabase (with SSL)
- `REDIS_URL`: Redis connection string from Upstash
- `JWT_SECRET`: JWT secret key
- `JWT_REFRESH_SECRET`: JWT refresh token secret
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production/test)
- `CORS_ORIGINS`: Comma-separated list of allowed CORS origins

### Mobile (.env)
- `EXPO_PUBLIC_API_URL`: Backend API URL

## Security

- All `.env` files are gitignored
- Pre-commit hooks check for secrets
- Helmet middleware for security headers
- CORS configured with allowed origins
- Rate limiting enabled
- JWT tokens stored securely using expo-secure-store

## License

Private - All rights reserved



