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

## Database

The application uses PostgreSQL with Prisma ORM. Schema is defined in `prisma/schema.prisma`.

## Security

- Helmet for security headers
- CORS with configurable origins
- Rate limiting
- JWT authentication
- Input validation with class-validator





