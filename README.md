# Koos Puzzle - Mobile PWA

Mobile-first Progressive Web App for visualizing and interacting with Koos puzzle solutions, built with React + Vite + Three.js.

## Features
- 🎮 **Interactive 3D Puzzle Visualization** - Three.js powered container and piece rendering
- 📱 **Mobile-First PWA** - Optimized for touch interaction and offline use
- 🔄 **Hot Reloading** - Instant development feedback on both PC and mobile
- 📊 **Comprehensive Container Collection** - 33+ puzzle shapes ready for visualization
- 🏗️ **Clean Architecture** - Separation between UI (this repo) and engine (upstream)

## Quick Start
```bash
npm run dev -- --host
```
- **Local**: http://localhost:5173/
- **Mobile**: http://192.168.4.24:5173/

## Development
This project follows a structured development workflow with scoped sessions and comprehensive documentation. See `docs/` for complete architecture and contributing guidelines.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
