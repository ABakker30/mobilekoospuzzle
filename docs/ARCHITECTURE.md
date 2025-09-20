# Architecture Overview

## Two Worlds Design

### UI World (This Repository)
- **Purpose**: Visualization, interaction, mobile UX
- **Technology**: React + Three.js PWA
- **Responsibilities**:
  - Load container/solution JSON files
  - Transform coordinates via shared pipeline
  - Render 3D scenes
  - Handle touch/mobile interactions
  - PWA capabilities (offline, install)

### Engine World (Upstream)
- **Purpose**: Puzzle logic, solving, validation
- **Technology**: [ballpuzzle4](https://github.com/ABakker30/ballpuzzle4)
- **Responsibilities**:
  - Generate containers and solutions
  - Validate moves and states
  - Export data in standard formats
  - CLI interface for batch operations

## Data Flow
```
Engine (CLI) → JSON files → UI (load) → Transform → Three.js → Mobile
```

## Transform Pipeline
```
Native Coordinates → World Coordinates → Oriented Coordinates
```
- **Native**: Raw engine output format
- **World**: Standardized 3D space
- **Oriented**: Camera/view-specific positioning

## Component Structure
```
src/
├── components/
│   ├── viewers/          # Shape/Solution viewers
│   ├── monitors/         # Status displays
│   └── shared/           # Reusable UI components
├── lib/
│   ├── coords/           # Transform pipeline (CODEOWNERS protected)
│   ├── loaders/          # JSON file handling
│   └── three/            # Three.js utilities
└── data/                 # Example files (read-only copies)
```

## Out of Scope
- Engine reimplementation
- Coordinate transforms outside shared module
- Direct puzzle solving logic
