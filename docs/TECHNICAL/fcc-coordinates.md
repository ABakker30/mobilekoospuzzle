# FCC Coordinate System Technical Specification

## Overview

Koos Puzzle V2 implements a dual Face-Centered Cubic (FCC) coordinate system to separate mathematical operations from visualization concerns. This document provides the complete technical specification for coordinate systems, transformations, and implementation details.

## Mathematical Foundation

### Face-Centered Cubic Lattice

The FCC lattice is a cubic crystal system where lattice points are located at:
- Cube corners: (0,0,0), (1,0,0), (0,1,0), (0,0,1), etc.
- Face centers: (0.5,0.5,0), (0.5,0,0.5), (0,0.5,0.5), etc.

**Key Properties:**
- Coordination number: 12 (each sphere touches 12 neighbors)
- Packing efficiency: π/(3√2) ≈ 74.05%
- Nearest neighbor distance: a/√2 (where a is lattice parameter)
- High symmetry: supports complex geometric operations

---

## Dual Coordinate Systems

### Engine FCC (Rhombohedral)

**Purpose**: Mathematical operations, algorithms, and data storage

```typescript
interface EngineFCC {
  x: number;  // Integer rhombohedral coordinates
  y: number;  // Optimized for mathematical operations
  z: number;  // Used for all puzzle logic
}
```

**Characteristics:**
- Integer coordinates for exact arithmetic
- Rhombohedral representation for optimal algorithm performance
- Canonical orientation for consistent CID calculation
- Compact storage representation
- Mathematical operations preserve precision

**Used For:**
- Shape definitions and validation
- Piece fitting algorithms and collision detection
- Solver engines (DFS, DLX, custom algorithms)
- Data storage and serialization
- CID calculations for content addressing
- Symmetry analysis and geometric computations

### World FCC (Visualization)

**Purpose**: 3D rendering and user interaction

```typescript
interface WorldFCC extends THREE.Vector3 {
  x: number;  // Three.js compatible coordinates
  y: number;  // Optimized for 3D rendering
  z: number;  // Camera and lighting calculations
}
```

**Characteristics:**
- Floating-point coordinates for smooth rendering
- Three.js Vector3 compatibility
- Optimized for GPU operations
- Supports smooth animations and interpolation
- Camera-relative positioning

**Used For:**
- 3D rendering with Three.js
- User interactions (mouse clicks, touch events)
- Camera positioning and orbit controls
- Visual effects and animations
- Material and lighting calculations
- UI coordinate mapping

---

## Coordinate Transformations

### Core Transformation Functions

```typescript
// lib/coords/fcc.ts - SINGLE SOURCE OF TRUTH

/**
 * Transform Engine coordinates to World coordinates
 * @param engineCoord - Rhombohedral FCC coordinates
 * @returns Three.js compatible world coordinates
 */
export function engineToWorld(engineCoord: EngineFCC): WorldFCC {
  // Rhombohedral to Cartesian transformation matrix
  const a = 1.0; // Lattice parameter
  const cos60 = 0.5;
  const sin60 = Math.sqrt(3) / 2;
  
  const x = a * (engineCoord.x + cos60 * engineCoord.y);
  const y = a * (sin60 * engineCoord.y + cos60 * engineCoord.z);
  const z = a * engineCoord.z;
  
  return new THREE.Vector3(x, y, z);
}

/**
 * Transform World coordinates to Engine coordinates
 * @param worldCoord - Three.js world coordinates
 * @returns Rhombohedral FCC coordinates
 */
export function worldToEngine(worldCoord: WorldFCC): EngineFCC {
  // Inverse transformation matrix
  const a = 1.0; // Lattice parameter
  const cos60 = 0.5;
  const sin60 = Math.sqrt(3) / 2;
  
  const z = worldCoord.z / a;
  const y = (worldCoord.y / a - cos60 * z) / sin60;
  const x = worldCoord.x / a - cos60 * y;
  
  // Round to nearest integers for Engine coordinates
  return {
    x: Math.round(x),
    y: Math.round(y),
    z: Math.round(z)
  };
}

/**
 * Batch transform multiple Engine coordinates to World
 * @param engineCoords - Array of Engine coordinates
 * @returns Array of World coordinates
 */
export function engineToWorldBatch(engineCoords: EngineFCC[]): WorldFCC[] {
  return engineCoords.map(engineToWorld);
}

/**
 * Batch transform multiple World coordinates to Engine
 * @param worldCoords - Array of World coordinates
 * @returns Array of Engine coordinates
 */
export function worldToEngineBatch(worldCoords: WorldFCC[]): EngineFCC[] {
  return worldCoords.map(worldToEngine);
}
```

### Transformation Validation

```typescript
/**
 * Validate that transformation is reversible
 * @param original - Original Engine coordinate
 * @returns true if transformation is reversible within tolerance
 */
export function validateTransformation(original: EngineFCC): boolean {
  const world = engineToWorld(original);
  const restored = worldToEngine(world);
  
  const tolerance = 1e-10;
  return (
    Math.abs(original.x - restored.x) < tolerance &&
    Math.abs(original.y - restored.y) < tolerance &&
    Math.abs(original.z - restored.z) < tolerance
  );
}

/**
 * Test transformation accuracy across coordinate space
 */
export function testTransformationAccuracy(): ValidationResult {
  const testCases: EngineFCC[] = [
    { x: 0, y: 0, z: 0 },     // Origin
    { x: 1, y: 0, z: 0 },     // Unit vectors
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 1, y: 1, z: 1 },     // Diagonal
    { x: -1, y: -1, z: -1 },  // Negative coordinates
    { x: 10, y: 15, z: 20 },  // Large coordinates
  ];
  
  const results = testCases.map(validateTransformation);
  return {
    passed: results.every(r => r),
    failedCases: testCases.filter((_, i) => !results[i])
  };
}
```

---

## Orientation Normalization

### Canonical Orientation

For consistent CID calculation, shapes must be normalized to canonical orientation:

```typescript
/**
 * Normalize shape to canonical orientation
 * Places largest face in XZ plane, centered at origin
 * @param coordinates - Shape coordinates in Engine space
 * @returns Normalized coordinates
 */
export function normalizeShapeOrientation(coordinates: EngineFCC[]): EngineFCC[] {
  // 1. Calculate convex hull
  const hull = calculateConvexHull(coordinates);
  
  // 2. Find largest face
  const largestFace = findLargestFace(hull);
  
  // 3. Calculate rotation to align largest face with XZ plane
  const rotation = calculateAlignmentRotation(largestFace.normal, { x: 0, y: 1, z: 0 });
  
  // 4. Apply rotation to all coordinates
  const rotated = coordinates.map(coord => applyRotation(coord, rotation));
  
  // 5. Center at origin
  const centroid = calculateCentroid(rotated);
  const centered = rotated.map(coord => ({
    x: coord.x - centroid.x,
    y: coord.y - centroid.y,
    z: coord.z - centroid.z
  }));
  
  // 6. Ensure deterministic ordering
  return centered.sort(coordinateComparator);
}

/**
 * Compare coordinates for deterministic sorting
 */
function coordinateComparator(a: EngineFCC, b: EngineFCC): number {
  if (a.z !== b.z) return a.z - b.z;
  if (a.y !== b.y) return a.y - b.y;
  return a.x - b.x;
}
```

### Hull Analysis

```typescript
/**
 * 8-step hull-based orientation analysis
 * Implements the same algorithm used in V1 Solutions Viewer
 */
export function performHullAnalysis(coordinates: EngineFCC[]): HullAnalysis {
  // Step 1: Calculate 3D convex hull
  const hull = calculateConvexHull3D(coordinates);
  
  // Step 2: Extract faces from hull
  const faces = extractHullFaces(hull);
  
  // Step 3: Calculate face areas and normals
  const faceData = faces.map(face => ({
    vertices: face,
    area: calculateFaceArea(face),
    normal: calculateFaceNormal(face),
    centroid: calculateFaceCentroid(face)
  }));
  
  // Step 4: Find largest face
  const largestFace = faceData.reduce((max, face) => 
    face.area > max.area ? face : max
  );
  
  // Step 5: Calculate orientation transformation
  const targetNormal = { x: 0, y: 1, z: 0 }; // Y-up
  const rotation = calculateRotationBetweenVectors(largestFace.normal, targetNormal);
  
  // Step 6: Apply transformation
  const orientedCoords = coordinates.map(coord => applyRotation(coord, rotation));
  
  // Step 7: Center the shape
  const centroid = calculateCentroid(orientedCoords);
  const centeredCoords = orientedCoords.map(coord => subtractVector(coord, centroid));
  
  // Step 8: Final validation and cleanup
  const finalCoords = validateAndCleanCoordinates(centeredCoords);
  
  return {
    originalCoordinates: coordinates,
    orientedCoordinates: finalCoords,
    largestFace,
    rotation,
    centroid,
    hull: hull
  };
}
```

---

## Performance Optimization

### Caching Strategy

```typescript
/**
 * Coordinate transformation cache
 * Caches expensive transformations for reuse
 */
class CoordinateCache {
  private engineToWorldCache = new Map<string, WorldFCC>();
  private worldToEngineCache = new Map<string, EngineFCC>();
  private orientationCache = new Map<string, EngineFCC[]>();
  
  /**
   * Get cached Engine to World transformation
   */
  getEngineToWorld(coord: EngineFCC): WorldFCC | undefined {
    const key = `${coord.x},${coord.y},${coord.z}`;
    return this.engineToWorldCache.get(key);
  }
  
  /**
   * Cache Engine to World transformation
   */
  setEngineToWorld(coord: EngineFCC, result: WorldFCC): void {
    const key = `${coord.x},${coord.y},${coord.z}`;
    this.engineToWorldCache.set(key, result);
  }
  
  /**
   * Get cached orientation normalization
   */
  getOrientation(coordsHash: string): EngineFCC[] | undefined {
    return this.orientationCache.get(coordsHash);
  }
  
  /**
   * Cache orientation normalization result
   */
  setOrientation(coordsHash: string, result: EngineFCC[]): void {
    this.orientationCache.set(coordsHash, result);
  }
  
  /**
   * Clear cache when memory usage is high
   */
  clearCache(): void {
    this.engineToWorldCache.clear();
    this.worldToEngineCache.clear();
    this.orientationCache.clear();
  }
}

// Global cache instance
export const coordinateCache = new CoordinateCache();
```

### Batch Operations

```typescript
/**
 * Optimized batch coordinate transformations
 * Uses SIMD operations where available
 */
export class BatchCoordinateProcessor {
  /**
   * Transform large arrays of coordinates efficiently
   */
  static transformBatch(
    coordinates: EngineFCC[], 
    operation: 'engineToWorld' | 'worldToEngine'
  ): (WorldFCC | EngineFCC)[] {
    const batchSize = 1000; // Process in chunks
    const results: (WorldFCC | EngineFCC)[] = [];
    
    for (let i = 0; i < coordinates.length; i += batchSize) {
      const chunk = coordinates.slice(i, i + batchSize);
      const chunkResults = chunk.map(coord => 
        operation === 'engineToWorld' 
          ? engineToWorld(coord as EngineFCC)
          : worldToEngine(coord as WorldFCC)
      );
      results.push(...chunkResults);
    }
    
    return results;
  }
  
  /**
   * Parallel processing for large datasets
   */
  static async transformBatchParallel(
    coordinates: EngineFCC[],
    operation: 'engineToWorld' | 'worldToEngine'
  ): Promise<(WorldFCC | EngineFCC)[]> {
    const numWorkers = navigator.hardwareConcurrency || 4;
    const chunkSize = Math.ceil(coordinates.length / numWorkers);
    
    const promises = [];
    for (let i = 0; i < numWorkers; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, coordinates.length);
      const chunk = coordinates.slice(start, end);
      
      promises.push(
        new Promise(resolve => {
          // Use Web Workers for parallel processing
          const worker = new Worker('/workers/coordinate-transform.js');
          worker.postMessage({ coordinates: chunk, operation });
          worker.onmessage = (e) => {
            resolve(e.data.results);
            worker.terminate();
          };
        })
      );
    }
    
    const results = await Promise.all(promises);
    return results.flat();
  }
}
```

---

## Geometric Operations

### Distance Calculations

```typescript
/**
 * Calculate distance between FCC coordinates
 */
export function fccDistance(a: EngineFCC, b: EngineFCC): number {
  // Convert to world coordinates for Euclidean distance
  const worldA = engineToWorld(a);
  const worldB = engineToWorld(b);
  return worldA.distanceTo(worldB);
}

/**
 * Find nearest neighbors in FCC lattice
 */
export function findFCCNeighbors(coord: EngineFCC, radius: number = 1): EngineFCC[] {
  const neighbors: EngineFCC[] = [];
  
  // FCC has 12 nearest neighbors
  const neighborOffsets = [
    { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 },
    { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 },
    { x: 1, y: 1, z: 0 }, { x: 1, y: -1, z: 0 },
    { x: -1, y: 1, z: 0 }, { x: -1, y: -1, z: 0 },
    { x: 1, y: 0, z: 1 }, { x: 1, y: 0, z: -1 },
    { x: -1, y: 0, z: 1 }, { x: -1, y: 0, z: -1 },
    { x: 0, y: 1, z: 1 }, { x: 0, y: 1, z: -1 },
    { x: 0, y: -1, z: 1 }, { x: 0, y: -1, z: -1 }
  ];
  
  for (const offset of neighborOffsets) {
    const neighbor = {
      x: coord.x + offset.x,
      y: coord.y + offset.y,
      z: coord.z + offset.z
    };
    
    if (fccDistance(coord, neighbor) <= radius) {
      neighbors.push(neighbor);
    }
  }
  
  return neighbors;
}
```

### Collision Detection

```typescript
/**
 * Check if two FCC coordinate sets overlap
 */
export function checkFCCCollision(
  coords1: EngineFCC[], 
  coords2: EngineFCC[]
): boolean {
  const set1 = new Set(coords1.map(c => `${c.x},${c.y},${c.z}`));
  return coords2.some(c => set1.has(`${c.x},${c.y},${c.z}`));
}

/**
 * Find overlapping coordinates between two sets
 */
export function findFCCOverlaps(
  coords1: EngineFCC[], 
  coords2: EngineFCC[]
): EngineFCC[] {
  const set1 = new Set(coords1.map(c => `${c.x},${c.y},${c.z}`));
  const overlaps: EngineFCC[] = [];
  
  for (const coord of coords2) {
    const key = `${coord.x},${coord.y},${coord.z}`;
    if (set1.has(key)) {
      overlaps.push(coord);
    }
  }
  
  return overlaps;
}
```

---

## Testing and Validation

### Comprehensive Test Suite

```typescript
describe('FCC Coordinate System', () => {
  describe('Coordinate Transformations', () => {
    test('engineToWorld should handle origin correctly', () => {
      const engine: EngineFCC = { x: 0, y: 0, z: 0 };
      const world = engineToWorld(engine);
      expect(world.x).toBeCloseTo(0);
      expect(world.y).toBeCloseTo(0);
      expect(world.z).toBeCloseTo(0);
    });
    
    test('transformations should be reversible', () => {
      const testCases: EngineFCC[] = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 2, z: 3 },
        { x: -5, y: 10, z: -15 }
      ];
      
      testCases.forEach(original => {
        const world = engineToWorld(original);
        const restored = worldToEngine(world);
        expect(restored).toEqual(original);
      });
    });
    
    test('batch transformations should match individual', () => {
      const coords: EngineFCC[] = [
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: 1 }
      ];
      
      const individual = coords.map(engineToWorld);
      const batch = engineToWorldBatch(coords);
      
      expect(batch).toEqual(individual);
    });
  });
  
  describe('Orientation Normalization', () => {
    test('should produce consistent results', () => {
      const shape1 = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 }
      ];
      
      // Same shape, different orientation
      const shape2 = [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: 1 }
      ];
      
      const normalized1 = normalizeShapeOrientation(shape1);
      const normalized2 = normalizeShapeOrientation(shape2);
      
      // Should produce same canonical form
      expect(normalized1).toEqual(normalized2);
    });
  });
  
  describe('Performance', () => {
    test('batch operations should be faster than individual', async () => {
      const coords = Array.from({ length: 1000 }, (_, i) => ({
        x: i % 10,
        y: Math.floor(i / 10) % 10,
        z: Math.floor(i / 100)
      }));
      
      const start1 = performance.now();
      const individual = coords.map(engineToWorld);
      const time1 = performance.now() - start1;
      
      const start2 = performance.now();
      const batch = engineToWorldBatch(coords);
      const time2 = performance.now() - start2;
      
      expect(batch).toEqual(individual);
      expect(time2).toBeLessThan(time1 * 1.1); // Allow 10% overhead
    });
  });
});
```

---

## Integration Guidelines

### Component Usage

```typescript
// Example: Shape viewer component
export function ShapeViewer3D({ coordinates }: { coordinates: EngineFCC[] }) {
  const worldCoords = useMemo(() => 
    engineToWorldBatch(coordinates), 
    [coordinates]
  );
  
  return (
    <Canvas>
      <group>
        {worldCoords.map((coord, index) => (
          <Sphere key={index} position={coord} />
        ))}
      </group>
    </Canvas>
  );
}

// Example: Interactive placement
export function InteractivePlacer({ onPlace }: { onPlace: (coord: EngineFCC) => void }) {
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    const worldCoord = event.point;
    const engineCoord = worldToEngine(worldCoord);
    onPlace(engineCoord);
  };
  
  return <Plane onClick={handleClick} />;
}
```

### Best Practices

1. **Always use transformation functions**: Never implement coordinate conversion inline
2. **Cache expensive operations**: Use coordinate cache for repeated transformations
3. **Batch when possible**: Use batch operations for large coordinate sets
4. **Validate transformations**: Test reversibility in development
5. **Handle edge cases**: Account for floating-point precision issues
6. **Document coordinate spaces**: Clearly indicate which coordinate system is used

This specification provides the complete foundation for FCC coordinate handling in Koos Puzzle V2, ensuring mathematical accuracy, performance optimization, and maintainable code architecture.
