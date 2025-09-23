# Data Contracts Specification

## Overview

Koos Puzzle V2 uses CID-based data contracts to ensure content integrity, enable deduplication, and provide a scalable foundation for the platform. This document provides detailed specifications for all data contracts.

## Core Principles

1. **Content Addressing**: All core data uses CID (Content Identifier) for addressing
2. **Metadata Separation**: Pure geometric/solving data separate from social/temporal metadata
3. **Orientation Invariance**: Shapes normalized to canonical orientation for consistent CIDs
4. **Version Evolution**: Contracts support versioning for backward compatibility
5. **Type Safety**: Full TypeScript interfaces for compile-time validation

---

## Shape Contracts

### ShapeContract (Core Data)

```typescript
interface ShapeContract {
  version: "1.0";                    // Contract version
  coordinates: EngineFCC[];          // Canonical orientation in Engine coordinates
}

interface EngineFCC {
  x: number;                         // Rhombohedral FCC coordinates
  y: number;                         // Mathematical space optimized for algorithms
  z: number;                         // Used for all puzzle logic operations
}
```

**CID Calculation Rules:**
- Coordinates must be in canonical orientation (largest face in XZ plane)
- Coordinates sorted by (z, y, x) for deterministic ordering
- CID calculated using SHA-256 hash of normalized JSON representation
- Same shape in different orientations produces same CID

**Validation Rules:**
- All coordinates must be valid FCC positions
- Shape must be connected (no floating spheres)
- Minimum 1 coordinate, maximum 1000 coordinates
- All coordinates must be integers

### ShapeMetadata (Social/Temporal Data)

```typescript
interface ShapeMetadata {
  cid: string;                       // References ShapeContract CID
  creator: string;                   // User ID of creator
  createdAt: number;                 // Unix timestamp
  updatedAt: number;                 // Last metadata update
  title?: string;                    // User-defined name (max 100 chars)
  description?: string;              // User description (max 1000 chars)
  tags: string[];                    // Searchable tags (max 20, each max 30 chars)
  difficulty?: number;               // Community rating 1-10
  popularity: number;                // Usage/view count
  symmetry: SymmetryQuality;         // Crystallographic analysis
  stats: ShapeStats;                 // Computed statistics
}

interface SymmetryQuality {
  rotationalSymmetry: {
    axes: SymmetryAxis[];            // Rotation axes with orders
    order: number;                   // Highest rotational symmetry order
  };
  reflectionalSymmetry: {
    planes: SymmetryPlane[];         // Mirror planes
    count: number;                   // Number of mirror planes
  };
  pointGroup: string;                // Crystallographic point group notation
  symmetryScore: number;             // 0-1 overall symmetry measure
  isChiral: boolean;                 // Has handedness (no mirror symmetry)
}

interface ShapeStats {
  sphereCount: number;               // Total number of spheres
  boundingBox: {                     // Axis-aligned bounding box
    min: EngineFCC;
    max: EngineFCC;
  };
  surfaceArea: number;               // Exposed sphere surface area
  volume: number;                    // Internal volume estimate
  compactness: number;               // Sphere count / bounding box volume
}
```

---

## Solution Contracts

### SolutionContract (Core Data)

```typescript
interface SolutionContract {
  version: "1.0";                    // Contract version
  shapeCID: string;                  // References target ShapeContract
  pieces: PiecePlacement[];          // Piece positions and orientations
}

interface PiecePlacement {
  pieceId: string;                   // Identifier for piece type
  position: EngineFCC;               // Placement position in Engine coordinates
  rotation: RotationMatrix;          // 3x3 rotation matrix
  coordinates: EngineFCC[];          // Final piece coordinates after transformation
}

interface RotationMatrix {
  m00: number; m01: number; m02: number;
  m10: number; m11: number; m12: number;
  m20: number; m21: number; m22: number;
}
```

**CID Calculation Rules:**
- Pieces sorted by position (z, y, x) for deterministic ordering
- Rotation matrices normalized to standard form
- CID calculated from complete solution data
- Same solution with pieces in different order produces same CID

**Validation Rules:**
- shapeCID must reference valid ShapeContract
- All piece coordinates must fit within shape boundaries
- No overlapping pieces (collision detection)
- All shape coordinates must be covered by pieces
- Rotation matrices must be valid orthogonal matrices

### SolutionMetadata (Social/Temporal Data)

```typescript
interface SolutionMetadata {
  cid: string;                       // References SolutionContract CID
  shapeCID: string;                  // Duplicate for easy querying
  solver: string;                    // User ID of solver
  solvedAt: number;                  // Unix timestamp
  algorithm?: string;                // Solving method used
  duration?: number;                 // Time to solve in milliseconds
  steps?: number;                    // Number of moves/operations
  rating?: number;                   // Community rating 1-10
  difficulty: number;                // Computed difficulty score
  stats: SolutionStats;              // Performance metrics
}

interface SolutionStats {
  pieceCount: number;                // Total pieces used
  uniquePieceTypes: number;          // Number of different piece types
  efficiency: number;                // Solution quality metric
  complexity: number;                // Algorithmic complexity measure
  symmetryUtilization: number;       // How well solution uses shape symmetry
}
```

---

## Status Contracts (Ephemeral)

### StatusContract (Real-time Data)

```typescript
interface StatusContract {
  sessionId: string;                 // Unique session identifier
  shapeCID: string;                  // Shape being solved
  engine: SolverEngine;              // Which solver is running
  state: SolverState;                // Current solver state
  progress?: number;                 // 0-100 completion percentage
  currentSolution?: Partial<SolutionContract>; // Work in progress
  metrics: EngineMetrics;            // Real-time performance data
  startedAt: number;                 // Unix timestamp
  lastUpdate: number;                // Last status update timestamp
}

type SolverEngine = 'dfs' | 'dlx' | 'custom' | 'ai';
type SolverState = 'idle' | 'initializing' | 'solving' | 'complete' | 'error' | 'cancelled';

interface EngineMetrics {
  solutionsFound: number;            // Number of solutions discovered
  nodesExplored: number;             // Search tree nodes explored
  memoryUsage: number;               // Memory usage in bytes
  cpuTime: number;                   // CPU time used in milliseconds
  estimatedTimeRemaining?: number;   // Estimated completion time
  currentDepth?: number;             // Current search depth
  bestSolutionQuality?: number;      // Quality of best solution found
}
```

**Lifecycle Rules:**
- Status contracts are ephemeral (not stored long-term)
- Automatically cleaned up after session completion
- Real-time updates via WebSocket or polling
- No CID calculation (transient data)

---

## Piece Contracts (Future)

### PieceContract (Core Data)

```typescript
interface PieceContract {
  version: "1.0";                    // Contract version
  coordinates: EngineFCC[];          // Piece shape in canonical orientation
  rotations: RotationConstraint[];   // Allowed rotations
  properties: PieceProperties;       // Physical and logical properties
}

interface RotationConstraint {
  axis: 'x' | 'y' | 'z';            // Rotation axis
  angles: number[];                  // Allowed angles in degrees
}

interface PieceProperties {
  name: string;                      // Piece name (e.g., "L-piece", "T-piece")
  category: string;                  // Piece category (e.g., "tetromino", "custom")
  weight: number;                    // Relative weight for solving algorithms
  rarity: number;                    // How common this piece is (0-1)
  manufacturingComplexity: number;   // 3D printing difficulty (1-10)
}
```

### PieceMetadata (Social/Temporal Data)

```typescript
interface PieceMetadata {
  cid: string;                       // References PieceContract CID
  creator: string;                   // User ID of creator
  createdAt: number;                 // Unix timestamp
  title?: string;                    // User-defined name
  description?: string;              // User description
  tags: string[];                    // Searchable tags
  popularity: number;                // Usage count
  difficulty: number;                // Difficulty to use effectively
  stats: PieceStats;                 // Usage statistics
}

interface PieceStats {
  usageCount: number;                // How often piece is used
  successRate: number;               // Success rate in solutions
  averagePlacementTime: number;      // Average time to place manually
  compatibleShapes: string[];        // CIDs of shapes this piece works well with
}
```

---

## Contract Validation

### Validation Functions

```typescript
// Shape validation
export function validateShapeContract(shape: ShapeContract): ValidationResult {
  // Validate FCC coordinates
  // Check connectivity
  // Verify coordinate bounds
  // Ensure canonical orientation
}

export function validateShapeMetadata(metadata: ShapeMetadata): ValidationResult {
  // Validate CID format and existence
  // Check string length limits
  // Validate tag format
  // Verify timestamp ranges
}

// Solution validation
export function validateSolutionContract(
  solution: SolutionContract, 
  shape: ShapeContract
): ValidationResult {
  // Validate piece placements
  // Check collision detection
  // Verify complete coverage
  // Validate rotation matrices
}

// Cross-contract validation
export function validateSolutionAgainstShape(
  solution: SolutionContract,
  shape: ShapeContract
): ValidationResult {
  // Ensure solution fits shape exactly
  // Validate piece boundaries
  // Check for gaps or overlaps
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
```

### CID Calculation

```typescript
export function calculateShapeCID(shape: ShapeContract): string {
  // 1. Normalize coordinates to canonical orientation
  const normalized = normalizeShapeOrientation(shape.coordinates);
  
  // 2. Sort coordinates for deterministic ordering
  const sorted = normalized.sort(coordinateComparator);
  
  // 3. Create deterministic JSON representation
  const canonical = { version: shape.version, coordinates: sorted };
  
  // 4. Calculate SHA-256 hash
  return computeCID(JSON.stringify(canonical));
}

export function calculateSolutionCID(solution: SolutionContract): string {
  // Similar process for solutions
  const normalized = normalizeSolutionPlacements(solution.pieces);
  const canonical = { 
    version: solution.version, 
    shapeCID: solution.shapeCID, 
    pieces: normalized 
  };
  return computeCID(JSON.stringify(canonical));
}
```

---

## Storage Architecture

### Database Schema

```sql
-- Content tables (CID-addressed)
CREATE TABLE shapes (
  cid VARCHAR(64) PRIMARY KEY,
  version VARCHAR(10) NOT NULL,
  coordinates JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE solutions (
  cid VARCHAR(64) PRIMARY KEY,
  shape_cid VARCHAR(64) REFERENCES shapes(cid),
  version VARCHAR(10) NOT NULL,
  pieces JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Metadata tables (rich data)
CREATE TABLE shape_metadata (
  cid VARCHAR(64) PRIMARY KEY REFERENCES shapes(cid),
  creator VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  title VARCHAR(100),
  description TEXT,
  tags TEXT[],
  difficulty INTEGER,
  popularity INTEGER DEFAULT 0,
  symmetry JSONB,
  stats JSONB
);

CREATE TABLE solution_metadata (
  cid VARCHAR(64) PRIMARY KEY REFERENCES solutions(cid),
  shape_cid VARCHAR(64) NOT NULL,
  solver VARCHAR(64) NOT NULL,
  solved_at TIMESTAMP NOT NULL,
  algorithm VARCHAR(50),
  duration INTEGER,
  steps INTEGER,
  rating INTEGER,
  difficulty REAL,
  stats JSONB
);

-- Indexes for performance
CREATE INDEX idx_shape_metadata_creator ON shape_metadata(creator);
CREATE INDEX idx_shape_metadata_tags ON shape_metadata USING GIN(tags);
CREATE INDEX idx_solution_metadata_shape ON solution_metadata(shape_cid);
CREATE INDEX idx_solution_metadata_solver ON solution_metadata(solver);
```

### API Endpoints

```typescript
// Shape operations
GET    /api/shapes/:cid                    // Get shape contract
GET    /api/shapes/:cid/metadata           // Get shape metadata
POST   /api/shapes                         // Create new shape
PUT    /api/shapes/:cid/metadata           // Update metadata
DELETE /api/shapes/:cid                    // Delete shape (if authorized)

// Solution operations
GET    /api/solutions/:cid                 // Get solution contract
GET    /api/solutions/:cid/metadata        // Get solution metadata
POST   /api/solutions                      // Create new solution
GET    /api/shapes/:shapeCid/solutions     // Get solutions for shape

// Search and discovery
GET    /api/search/shapes                  // Search shapes with filters
GET    /api/search/solutions               // Search solutions with filters
GET    /api/popular/shapes                 // Popular shapes
GET    /api/recent/solutions               // Recent solutions

// Validation
POST   /api/validate/shape                 // Validate shape contract
POST   /api/validate/solution              // Validate solution contract
```

---

## Migration Strategy

### V1 to V2 Data Migration

```typescript
interface MigrationPlan {
  shapes: {
    source: 'v1-json-files';
    target: 'shape-contracts';
    process: [
      'load-v1-coordinates',
      'normalize-orientation',
      'calculate-cid',
      'extract-metadata',
      'validate-contracts'
    ];
  };
  solutions: {
    source: 'v1-solution-files';
    target: 'solution-contracts';
    process: [
      'load-v1-solutions',
      'map-to-shape-cids',
      'normalize-pieces',
      'calculate-cid',
      'validate-against-shapes'
    ];
  };
}

// Migration utilities
export async function migrateV1Shape(v1Data: any): Promise<{
  contract: ShapeContract;
  metadata: ShapeMetadata;
}> {
  // Convert V1 format to V2 contracts
}

export async function migrateV1Solution(v1Data: any): Promise<{
  contract: SolutionContract;
  metadata: SolutionMetadata;
}> {
  // Convert V1 format to V2 contracts
}
```

This data contract specification provides the foundation for all data operations in Koos Puzzle V2, ensuring consistency, integrity, and scalability across the entire platform.
