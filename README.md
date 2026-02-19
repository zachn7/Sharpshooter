# Sharpshooter

Sharpshooter is a **2D target-range ballistics game** that challenges you to land hits by accounting for **distance, wind, drag, environment**, and your weapon setup.

It's designed as a **skill-forward ballistics puzzle**: you get a limited number of shots per level, learn to use **MIL reticles, turret dialing, and zeroing**, and build intuition through feedback like **impact offsets, group size, and replay/range cards**.

> **Note:** This is a game/simulation for entertainment and learning within the app. It is **not** real-world advice.

---

## Highlights

- **Real-time ballistics simulation** (point-mass style integration)
  - Gravity + drag + wind (with gusts)
  - Optional Expert "sim extras" (toggleable)
- **Optics & aiming systems**
  - MIL reticle overlays + magnification
  - **Turret dialing** (elevation/windage) with intuitive controls
  - **Zeroing profiles** + Return-to-Zero
  - **Zero Range practice mode** (unlimited shots by default; optional 3-shot challenge)
- **Gameplay loop**
  - 3 shots per level (standard)
  - Stars + progression unlocks
  - Multiple level types: bullseye, plates, timed strings
- **Learning-focused feedback**
  - Impact offset readout (MILs)
  - Group size feedback (dispersion)
  - Range card + shot replay/trace viewer (optional)
- **Content and variety**
  - Weapons by type
  - Ammo variants (e.g., Match/Budget/Heavy/Light)
  - Daily Challenge (date-seeded) + local-only leaderboard
- **Offline-first**
  - **No backend**. Progress is saved locally.
  - Installable **PWA** with offline support

---

## Play

### Goals

- Read the conditions (wind, distance, environment)
- Choose your weapon + ammo
- Use the reticle and/or turrets to correct your aim
- Make the most of your shot limit to earn stars

### Controls

- **Aim:** mouse/touch drag (reticle)
- **Fire:** click/tap
- **Turrets:** +/- buttons (0.1 mil steps)
- **Zeroing:** save a zero profile and Return-to-Zero
- **Replay/Trace:** enable shot path recording in settings (optional)

> Tip: In Realistic/Expert modes, numeric wind may be hidden by default—use visual cues like flags/shimmer.

---

## Game Modes

- **Levels:** progression-based stages with stars
- **Zero Range:** practice and zero your setup
  - Unlimited shots by default
  - Optional 3-shot cap for challenge zero
- **Daily Challenge:** a deterministic scenario generated from the local date
  - Records your local personal best (no online leaderboard)

---

## Realism Presets

- **Arcade:** more visible info, lighter penalties, optional "Apply Correction" assist
- **Realistic:** wind/drag/environment matter; fewer training wheels
- **Expert:** adds optional "sim extras" toggles (off by default)
  - Spin drift
  - Coriolis effect

---

## Features

### Ballistics Simulation
- Point-mass integration with gravity
- Drag approximated per weapon/ammo type
- Wind modeling with gust variation
- Environment effects (temperature, altitude, air density)

### Optics & Aiming
- MIL-based reticle with adjustable magnification
- Simple reticle (crosshair) for beginners
- Real-time reticle jitter (sway) simulation
- Turret-adjusted point of impact calculations

### Weapons & Ammo
- Multiple weapon types (pistol, rifle, sniper, shotgun)
- Ammo variants with different ballistic characteristics
  - Match Grade (consistent, tighter groups)
  - Budget (wider dispersion)
  - Heavy (less wind drift, slower)
  - Light (faster, more drift)

### Zeroing System
- Save zero profiles per weapon at any distance
- Return-to-Zero button to apply saved zero
- Zero Range practice mode for calibration

### Range Card & Replay
- Per-shot telemetry (wind, dials, time-of-flight, impact offsets)
- Range card table showing all shot data
- Optional shot path recording and trace viewer
- Toggle replay traces on/off with color-coded paths

### Audio
- Synthesized sound effects using Web Audio API (no external files)
  - Shot, hit, bullseye, click, error sounds
  - Adjustable master volume
  - Mute toggle
  - Reduced audio option (quieter sounds)
- Audio initializes after first user gesture (browser policy)

### Visual Effects
- Muzzle flash (optional)
- Screen shake (recoil)
- Impact particles (sparks, puff)
- Bullet trails (optional, for replay)
- Accessibility toggles (reduced motion, reduced flash)

### Accessibility
- Adjustable master volume
- Mute toggle
- Reduced audio setting
- Reduced motion toggle (disables trails, flash, screen shake)
- Reduced flash toggle (disables muzzle flash)
- Recorded shot path toggle (for replay)

### Progress & Saves
- Star-based level progression
- Local storage persistence
- Per-weapon turret states
- Per-weapon zero profiles
- Level progress tracking
- Daily challenge history
- Settings persistence

### PWA Features
- Installable as desktop/mobile app
- Offline play via service worker
- Asset precaching for instant loading

---

## Offline & PWA Install

Sharpshooter is installable as a Progressive Web App (PWA) and supports offline play via a service worker.

### Installing on Your Device

- **Desktop (Chrome/Edge):** install from the browser's "Install app" icon in the address bar
- **Android:** "Add to Home screen" from browser menu
- **iOS (Safari):** Share → "Add to Home Screen"

### Offline Behavior

Once installed:
- You can play without an internet connection
- All game assets are precached
- Your progress is saved locally

> Note: If you've installed the PWA and a new version is deployed, you may need to refresh the page to pick up updated cached assets.

---

## Audio & Browser Policies

Browsers restrict autoplay audio for better user experience. Sharpshooter only starts audio **after a user gesture** (e.g., clicking Start or Fire).

### How It Works

1. No audio plays until you interact with the game
2. Audio initializes on first user gesture (button click or shot)
3. All subsequent sounds play normally
4. You can disable or reduce audio via Settings at any time

### Audio Settings

- Master volume slider (0-100%)
- Mute toggle (disables all sounds)
- Reduced audio toggle (quieter sounds for sensitive ears)

---

## Tech Stack

- **Framework:** Vite + React + TypeScript
- **Rendering:** HTML5 Canvas (2D)
- **Audio:** Web Audio API (synthesized SFX, no external files)
- **Storage:** localStorage (offline-first)
- **Testing:**
  - Vitest (unit tests)
  - Playwright (E2E tests)
- **PWA:**
  - Vite PWA plugin
  - Workbox caching strategy

---

## Development

### Requirements

- Node.js (LTS recommended)
- npm or yarn

### Install

```bash
npm install
```

### Run (Development)

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Build

```bash
npm run build
```

Build outputs to the `dist/` directory.

### Preview Production Build

```bash
npm run build
npm run preview
```

### Testing

```bash
# Lint
npm run lint

# Unit tests (watch mode)
npm run test

# Unit tests (single run)
npm run test -- --run

# E2E tests
npm run test:e2e
```

### Test Coverage

- Unit tests: Physics, utilities, components, storage
- E2E tests: Smoke tests, level completion flow, PWA functionality

---

## Data & Privacy

- **No accounts required**
- **No backend or cloud services**
- **All data is stored locally on your device**
- Progress, settings, and leaderboards are saved in localStorage
- No data is transmitted to any server
- No tracking or analytics

### What's Stored Locally

- Level progress and stars earned
- Weapon turret settings
- Zero profiles
- Daily challenge results
- Audio and VFX settings
- Realism presets

If you clear your browser data, your progress will be reset.

---

## Contributing

Issues and pull requests are welcome! Please:

- Keep changes small and focused
- Maintain deterministic test behavior (seeded randomness)
- Don't add paid services or secret keys
- Ensure all tests pass before submitting
- Follow existing code style and patterns

### Development Guidelines

- Use the provided test utilities for deterministic randomness
- Avoid external dependencies that require API keys
- Keep the app offline-first and local-only
- Maintain accessibility features

---

## License

[Add your license here - e.g., MIT, Apache 2.0, etc.]

---

## Acknowledgments

- Built with Vite, React, and TypeScript
- Physics inspired by real-world ballistics principles
- Web Audio API for synthesized sound effects
- Canvas API for 2D rendering

---

## Changelog

Recent major features:

- Range card with per-shot telemetry
- Shot replay and trace viewer
- PNG export of results
- Web Audio API sound effects
- Visual effects (muzzle flash, screen shake, particles)
- Accessibility toggles (reduced motion/flash)
- Offline PWA support
- Expert simulation extras (spin drift, Coriolis)