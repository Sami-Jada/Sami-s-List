# Mobile App - Sami's List

React Native mobile application built with Expo for the gas delivery service.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file:
   ```bash
   cp env.example .env
   ```

3. Update `.env` with your API URL:
   ```
   EXPO_PUBLIC_API_URL=http://localhost:3000/api
   ```

4. Start the Expo development server:
   ```bash
   npm start
   ```

## Project Structure

```
src/
├── screens/        # Screen components
│   ├── auth/      # Authentication screens
│   └── main/      # Main app screens
├── navigation/     # Navigation configuration
├── components/     # Reusable components
├── context/        # React context providers
├── services/       # API services
├── utils/          # Utility functions
├── locales/        # i18n translations
└── assets/         # Images, fonts, etc.
```

## Features

- React Navigation (Stack + Bottom Tabs)
- TypeScript strict mode
- RTL support for Arabic
- Secure token storage with expo-secure-store
- Axios with interceptors for authentication
- i18n for internationalization

## Environment Variables

- `EXPO_PUBLIC_API_URL`: Backend API URL

## Building

For production builds, use Expo's build service:
```bash
expo build:android
expo build:ios
```





