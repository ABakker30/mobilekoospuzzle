# Transform Pipeline Specification

## Overview
Single shared module for all coordinate transformations. No engine logic - pure mathematical transforms only.

## Pipeline Stages

### Stage 1: Native → World
**Purpose**: Convert engine coordinates to standardized 3D world space
**Input**: Engine-specific coordinate format (from JSON)
**Output**: Standardized world coordinates (Three.js compatible)

```javascript
// src/lib/coords/native-to-world.js
export function nativeToWorld(nativeCoords) {
  // Transform engine coordinates to world space
  // Returns: { x, y, z } in world units
}
```

### Stage 2: World → Oriented  
**Purpose**: Apply camera/view transformations for rendering
**Input**: World coordinates
**Output**: View-specific positioning for Three.js

```javascript
// src/lib/coords/world-to-oriented.js
export function worldToOriented(worldCoords, viewParams) {
  // Apply camera transforms, rotations, scaling
  // Returns: { position, rotation, scale } for Three.js
}
```

### Reverse Pipeline: Oriented → World → Native
**Purpose**: Convert user interactions back to engine coordinates
**Use case**: Touch events, piece placement, move validation

```javascript
// Reverse transforms for interaction
export function orientedToWorld(orientedCoords, viewParams) { /* ... */ }
export function worldToNative(worldCoords) { /* ... */ }
```

## Interface Contracts

### Native Coordinate Format
```typescript
interface NativeCoords {
  // TBD: Define based on upstream engine format
  // Example: { piece_id, position, rotation, constraints }
}
```

### World Coordinate Format  
```typescript
interface WorldCoords {
  x: number;        // World X position
  y: number;        // World Y position  
  z: number;        // World Z position
  rotation?: {      // Optional rotation
    x: number;
    y: number; 
    z: number;
  };
}
```

### Oriented Coordinate Format
```typescript
interface OrientedCoords {
  position: Vector3;    // Three.js position
  rotation: Euler;      // Three.js rotation
  scale: Vector3;       // Three.js scale
}
```

## Implementation Rules

### ✅ Allowed
- Pure mathematical transformations
- Matrix operations and rotations
- Coordinate system conversions
- Caching for performance
- Type definitions and validation

### ❌ Forbidden  
- Engine logic or puzzle rules
- Move validation or constraint checking
- Piece placement algorithms
- State management
- Direct Three.js scene manipulation

## Testing Strategy
```javascript
// Example test structure
describe('Transform Pipeline', () => {
  test('native-to-world preserves relationships', () => {
    // Test coordinate conversion accuracy
  });
  
  test('round-trip conversion is lossless', () => {
    // native → world → oriented → world → native
  });
  
  test('handles edge cases and boundaries', () => {
    // Test with extreme values, nulls, etc.
  });
});
```

## Usage Examples

### Loading and Displaying Pieces
```javascript
import { nativeToWorld, worldToOriented } from '@/lib/coords';

// Load piece from JSON
const pieceData = loadPieceFromJSON(filename);

// Transform to world coordinates  
const worldCoords = nativeToWorld(pieceData.coordinates);

// Apply view transform for Three.js
const orientedCoords = worldToOriented(worldCoords, cameraParams);

// Render in Three.js scene
mesh.position.copy(orientedCoords.position);
mesh.rotation.copy(orientedCoords.rotation);
```

### Handling User Interaction
```javascript
// User touches screen/clicks piece
const touchPosition = getTouchPosition(event);

// Reverse transform to world coordinates
const worldPos = orientedToWorld(touchPosition, cameraParams);

// Convert to native coordinates for engine
const nativePos = worldToNative(worldPos);

// Send to engine via CLI (out of scope for transforms)
```

## Out of Scope
- Scene graph management
- Animation and tweening  
- Physics simulation
- Collision detection
- Engine communication
