# Backend API - Sami's List

NestJS backend API for the gas delivery application.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file:
   ```bash
   cp env.example .env
   ```

3. Update `.env` with your configuration values.

4. Start PostgreSQL and Redis using Docker:
   ```bash
   docker-compose up -d
   ```

5. Run Prisma migrations:
   ```bash
   npm run prisma:migrate
   ```

6. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

7. Start the development server:
   ```bash
   npm run dev
   ```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:3000/api/docs

## Project Structure

```
src/
├── auth/           # Authentication module
├── users/          # User management
├── vendors/        # Vendor management
├── orders/         # Order management
├── payments/       # Payment processing
├── notifications/  # Notification system
├── prisma/         # Prisma service
├── redis/          # Redis service
├── common/         # Shared utilities, filters, guards
└── main.ts         # Application entry point
```

## Environment Variables

See `env.example` for all required environment variables.

## Deploying to Railway

1. **Create a Railway service**
   - Point the service at the `backend` directory (or select this folder when creating the service).
   - Set the build and start commands:
     - **Build**: `npm run build:prod`
     - **Start**: `npm run start:prod`

2. **Configure environment variables** (Railway → Variables tab)
   - `DATABASE_URL`: PostgreSQL connection string (Railway Postgres or external).
   - `REDIS_URL`: Redis connection string (Railway Redis, Upstash, etc.).
   - `JWT_SECRET`, `JWT_REFRESH_SECRET`: Strong secrets for access and refresh tokens.
   - `JWT_EXPIRATION`, `JWT_REFRESH_EXPIRATION`: Token lifetimes (for example `15m`, `7d`).
   - `OTP_EXPIRY_SECONDS`: OTP validity window in seconds.
   - `RATE_LIMIT_TTL`, `RATE_LIMIT_MAX`: Rate limiting window and max requests.
   - `CORS_ORIGINS`: Comma-separated list of allowed origins (include your production frontend URL, for example `https://your-frontend.up.railway.app`).
   - `NODE_ENV`: Set to `production` in Railway.
   - `LOG_TO_FILE` (optional): Set to `true` only if you explicitly want file logs in `logs/`; otherwise leave unset/`false` so logs go to the Railway dashboard.

3. **Database migrations with Prisma**
   - On your first deploy (or when the schema changes), run:
     ```bash
     npm run prisma:migrate:deploy
     ```
   - Run this from a Railway shell or as a one-off command targeting the backend service.

4. **Verification**
   - After deployment, open the Railway service URL and confirm:
     - Health and API endpoints under `/api/...` respond.
     - Swagger UI is available at `/api/docs` when `NODE_ENV` is not `production`.
     - Logs appear in the Railway Logs tab (no file-log related errors).

## Database

The application uses PostgreSQL with Prisma ORM. Schema is defined in `prisma/schema.prisma`.

## Security

- Helmet for security headers
- CORS with configurable origins
- Rate limiting
- JWT authentication
- Input validation with class-validator





