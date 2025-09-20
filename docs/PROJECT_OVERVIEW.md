# Koos Puzzle - Project Overview

## Purpose
Mobile-first PWA for visualizing and interacting with Koos puzzle solutions, built with React + Three.js.

## Audiences
- **Players**: Interactive puzzle solving on mobile devices
- **Developers**: Clean separation between UI (this repo) and engine (upstream)
- **Contributors**: Small, reviewable changes following transform contracts

## Quick Links
- **Upstream Engine**: [ballpuzzle4 repository](https://github.com/ABakker30/ballpuzzle4) (authoritative source)
- **Live Demo**: [Mobile URL](http://192.168.4.24:5173/) | [Local](http://localhost:5173/)
- **Architecture**: [docs/ARCHITECTURE.md](./ARCHITECTURE.md)
- **Data Contracts**: [docs/DATA_FORMATS.md](./DATA_FORMATS.md)

## Tech Stack
- **Frontend**: React 18.2 + Vite 5.4
- **3D Graphics**: Three.js
- **PWA**: Service worker + manifest
- **Coordinates**: Native→World→Oriented transform pipeline

## Out of Scope
- Engine logic (use upstream CLI only)
- Puzzle generation algorithms
- Complex dependency changes
- Large refactors without approved issues

## Development URLs
- **Local**: `http://localhost:5173/`
- **Mobile**: `http://192.168.4.24:5173/`
