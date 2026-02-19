# Sharpshooter

A web application built with Vite, React, and TypeScript.

**Disclaimer:** This is a game/physics simulation project only. Not for commercial or production use.

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## PWA Installation

Sharpshooter can be installed as a Progressive Web App (PWA) for offline use:

### Desktop (Chrome/Edge)
1. Open the app in Chrome or Edge
2. Click the install icon in the address bar (or go to menu > "Install Sharpshooter")
3. The app will be installed and available from your desktop/applications

### Mobile (iOS Safari)
1. Tap the share button (box with arrow pointing up)
2. Scroll down and tap "Add to Home Screen"
3. The app will be added to your home screen

### Mobile (Chrome/Android)
1. Tap the menu (three dots)
2. Tap "Install app" or "Add to Home screen"
3. The app will be installed on your device

### Offline Support

Once installed, Sharpshooter can be used offline. The first visit requires an internet connection to cache the application, but subsequent visits will work without a connection.

**Note:** Service worker registration is disabled in development mode and during Playwright tests to prevent caching issues.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run Vitest unit tests
- `npm run test:ui` - Run Vitest with UI
- `npm run test:e2e` - Run Playwright E2E tests

## Tech Stack

- **Runtime:** Vite
- **Framework:** React
- **Language:** TypeScript
- **Testing:** Vitest + Testing Library
- **E2E Testing:** Playwright
- **Linting:** ESLint + Prettier
- **PWA:** VitePWA + Workbox

## Project Structure

```
sharpshooter/
├── src/          # Source code
│   ├── test/     # Test setup files
├── e2e/          # E2E tests
├── public/       # Static assets
└── scripts/      # Build/generation scripts
```
