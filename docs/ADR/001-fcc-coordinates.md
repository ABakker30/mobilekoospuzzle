# ADR-001: FCC Coordinate System Decoupling

## Status
**Accepted** - Core architectural decision for V2

## Context

Koos Puzzle operates with Face-Centered Cubic (FCC) coordinate systems, but we need to manage two different coordinate spaces:

1. **Mathematical/Engine Space**: Optimal for algorithms, storage, and puzzle logic
2. **Visualization/World Space**: Optimal for 3D rendering and user interaction

The current V1 implementation mixes these concerns, leading to:
- Coordinate transformation logic scattered throughout the codebase
- Inconsistent transformations between components
- Difficulty maintaining and optimizing coordinate operations
- Confusion when adding new features that need coordinate transformations

As we scale to support multiple modes (Puzzle Shape, Auto Solve, Manual Solve, View Solution) and advanced features (AI, community, physical manufacturing), we need a clean separation of coordinate systems.

## Decision

We will implement a **dual FCC coordinate system** with centralized transformation functions:

### Engine FCC (Rhombohedral Coordinates)
```typescript
interface EngineFCC {
  x: number; // Rhombohedral coordinates
  y: number; // Optimized for mathematical operations
  z: number; // Used for all puzzle logic
}
```

**Used for:**
- Shape definitions and validation
- Piece fitting algorithms
- Solver engines (DFS, DLX, custom)
- Collision detection and spatial queries
- Data storage and serialization
- CID calculations for content addressing
- All core puzzle logic and algorithms

### World FCC (Visualization Coordinates)
```typescript
interface WorldFCC extends THREE.Vector3 {
  // Three.js compatible coordinates
  // Optimized for 3D rendering and interaction
}
```

**Used for:**
- 3D rendering with Three.js
- User interactions (mouse clicks, touch events)
- Camera positioning and controls
- Visual effects and animations
- UI coordinate mapping
- Material and lighting calculations

### Centralized Transformation Functions
```typescript
// lib/coords/fcc.ts - SINGLE SOURCE OF TRUTH
export function engineToWorld(engineCoord: EngineFCC): WorldFCC;
export function worldToEngine(worldCoord: WorldFCC): EngineFCC;

// Critical requirements:
// - Used by ALL components that need coordinate transformation
// - NO duplicated transformation logic anywhere in the codebase
// - Optimized implementations with caching where appropriate
// - Comprehensive test coverage for all transformation scenarios
```

### Implementation Rules
1. **Single Source of Truth**: All coordinate transformations must use these functions
2. **No Duplication**: No component may implement its own coordinate transformation
3. **Clear Boundaries**: Engine logic operates in Engine coordinates, UI operates in World coordinates
4. **Explicit Transformations**: All coordinate conversions must be explicit and documented
5. **Performance Optimization**: Transformations can be optimized centrally without affecting components

## Consequences

### Positive Consequences

**Maintainability**
- Single place to fix coordinate transformation bugs
- Easy to optimize transformation performance
- Clear separation of concerns between engine and visualization
- Consistent behavior across all components

**Scalability**
- Easy to add new features without coordinate system confusion
- Engine optimizations don't affect visualization code
- Visualization improvements don't break puzzle logic
- Independent testing of engine vs. world components

**Performance**
- Optimized transformations used consistently throughout the application
- Opportunity for batch transformations and caching
- Memory efficiency through shared transformation functions
- Reduced computational overhead from duplicate implementations

**Reliability**
- No drift between different transformation implementations
- Comprehensive test coverage for coordinate operations
- Clear debugging path for coordinate-related issues
- Consistent mathematical behavior across the platform

### Negative Consequences

**Initial Development Overhead**
- Requires careful planning of coordinate system boundaries
- All existing coordinate code must be refactored
- Developers must understand dual coordinate system concept
- Additional complexity in component interfaces

**Performance Considerations**
- Coordinate transformations add computational overhead
- May need optimization for large datasets or real-time operations
- Memory usage for storing coordinates in both systems if needed
- Potential bottleneck if transformations are not optimized

### Mitigation Strategies

**Development Overhead**
- Comprehensive documentation of coordinate system usage
- Clear examples and patterns for component development
- Automated linting rules to prevent coordinate system violations
- Developer training and code review processes

**Performance Optimization**
- Implement caching for frequently used transformations
- Batch transformation operations where possible
- Profile and optimize transformation functions
- Use appropriate data structures for coordinate storage

## Implementation Plan

### Phase 1: Foundation
1. Create `lib/coords/fcc.ts` with transformation functions
2. Define TypeScript interfaces for both coordinate systems
3. Implement comprehensive test suite for transformations
4. Create documentation and usage examples

### Phase 2: Core Components
1. Refactor ShapeViewer3D to use dual coordinate system
2. Update all existing coordinate transformation code
3. Implement coordinate system boundaries in component interfaces
4. Add validation to ensure proper coordinate system usage

### Phase 3: Validation
1. Comprehensive testing of all coordinate transformations
2. Performance benchmarking and optimization
3. Code review to ensure no coordinate system violations
4. Documentation review and developer training

## Alternatives Considered

### Single Coordinate System
**Rejected**: Would require either suboptimal mathematical operations or suboptimal visualization, compromising either algorithm performance or user experience.

### Component-Level Transformations
**Rejected**: Leads to code duplication, inconsistent behavior, and maintenance difficulties as seen in V1.

### Mixed Coordinate Systems
**Rejected**: Creates confusion, bugs, and makes the codebase difficult to understand and maintain.

## References

- [Three.js Coordinate System Documentation](https://threejs.org/docs/#manual/en/introduction/Matrix-transformations)
- [FCC Lattice Mathematical Properties](https://en.wikipedia.org/wiki/Cubic_crystal_system#Face-centered_cubic)
- [Clean Architecture Principles](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

## Related ADRs

- [ADR-002: CID-Based Data Contracts](./002-cid-contracts.md) - Uses Engine coordinates for CID calculations
- [ADR-003: Unified Workspace Architecture](./003-unified-workspace.md) - Relies on clean coordinate separation
