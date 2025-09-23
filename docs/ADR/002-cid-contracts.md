# ADR-002: CID-Based Data Contracts

## Status
**Accepted** - Core data architecture for V2

## Context

Koos Puzzle needs a robust data architecture that can support:
- Content integrity and verification
- Deduplication of identical shapes and solutions
- Distributed storage and caching
- Version-independent content addressing
- Separation of pure geometric data from social/temporal metadata

The current V1 implementation uses informal data structures without content addressing, leading to:
- No way to verify data integrity
- Duplicate storage of identical content
- Difficulty implementing caching strategies
- Mixed concerns between geometric data and metadata
- No standard for data contracts across the platform

As we scale to support community features, AI integration, and physical manufacturing, we need a robust foundation for data integrity and content addressing.

## Decision

We will implement **CID-based data contracts** using content-addressable storage principles:

### Core Contracts

#### Shape Contract
```typescript
interface ShapeContract {
  version: string;                    // Contract version for evolution
  coordinates: EngineFCC[];           // Pure geometric data in canonical orientation
  // CID calculated from this data only
}

interface ShapeMetadata {
  cid: string;                       // References ShapeContract
  creator: string;                   // User ID
  createdAt: timestamp;              // Creation time
  title?: string;                    // User-defined name
  description?: string;              // User description
  tags: string[];                    // Searchable tags
  difficulty?: number;               // Community rating
  popularity: number;                // Usage statistics
  symmetry: SymmetryQuality;         // Crystallographic analysis
}
```

#### Solution Contract
```typescript
interface SolutionContract {
  version: string;                   // Contract version
  shapeCID: string;                  // References ShapeContract
  pieces: PiecePlacement[];          // Piece positions in Engine coordinates
  // CID calculated from this data only
}

interface SolutionMetadata {
  cid: string;                       // References SolutionContract
  solver: string;                    // User ID
  solvedAt: timestamp;               // Solve time
  algorithm?: string;                // Solving method used
  duration?: number;                 // Time to solve
  steps?: number;                    // Number of moves
  rating?: number;                   // Community rating
}
```

#### Status Contract (Ephemeral)
```typescript
interface StatusContract {
  sessionId: string;                 // Solving session identifier
  shapeCID: string;                  // What's being solved
  engine: string;                    // Which solver engine
  state: 'idle' | 'solving' | 'complete' | 'error';
  progress?: number;                 // 0-100% completion
  currentSolution?: Partial<SolutionContract>;
  metrics: EngineMetrics;            // Performance data
  // No CID - transient data
}
```

### CID Calculation Rules
1. **Orientation Invariance**: Shapes normalized to canonical orientation before CID calculation
2. **Pure Data Only**: CIDs calculated from geometric/solving data only, never metadata
3. **Deterministic**: Same content always produces same CID
4. **Cryptographic**: Use SHA-256 or similar for integrity verification

### Data Storage Architecture
```
Content Store (CID → Pure Data)
├── shapes/[CID] → ShapeContract
├── solutions/[CID] → SolutionContract
└── pieces/[CID] → PieceContract (future)

Metadata Store (CID → Rich Data)
├── shape_metadata/[CID] → ShapeMetadata
├── solution_metadata/[CID] → SolutionMetadata
└── user_data/[userID] → UserProfile

Cache Layer
├── coordinate_transforms/[hash] → TransformResult
├── symmetry_analysis/[CID] → SymmetryQuality
└── render_data/[CID] → OptimizedGeometry
```

## Consequences

### Positive Consequences

**Content Integrity**
- CID validates content hasn't been tampered with
- Cryptographic verification of data integrity
- Immutable content addressing prevents data corruption
- Version-independent content identification

**Deduplication**
- Identical shapes/solutions automatically share storage
- Reduced storage requirements and bandwidth usage
- Efficient caching strategies using content addressing
- Natural deduplication across users and time

**Scalability**
- Horizontal scaling with content-addressable storage
- IPFS-compatible for potential decentralization
- Efficient CDN caching using CIDs as cache keys
- Database sharding based on CID prefixes

**Clean Architecture**
- Clear separation between pure data and metadata
- Consistent data contracts across all features
- Easy to add new contract types following same pattern
- Testable data validation and transformation

**Community Features**
- Content attribution through metadata linking
- Search and discovery using metadata while preserving content integrity
- Social features (ratings, comments) separate from core content
- Analytics and insights without affecting content CIDs

### Negative Consequences

**Implementation Complexity**
- Requires understanding of content-addressable storage concepts
- More complex data access patterns compared to simple object storage
- Need to manage relationships between contracts and metadata
- Additional validation logic for CID integrity

**Performance Considerations**
- CID calculation overhead for large datasets
- Potential latency from content addressing lookups
- Memory usage for maintaining CID mappings
- Network overhead for distributed content addressing

**Development Overhead**
- All data access must follow contract patterns
- Developers must understand dual storage model
- Additional testing requirements for data integrity
- Migration complexity from existing data formats

### Mitigation Strategies

**Implementation Complexity**
- Comprehensive documentation with examples
- Helper functions for common contract operations
- Automated validation and testing tools
- Clear patterns and conventions for contract usage

**Performance Optimization**
- Caching strategies for frequently accessed content
- Batch operations for CID calculations
- Optimized serialization formats
- Background processing for expensive operations

**Development Support**
- TypeScript interfaces for compile-time validation
- Automated testing for all contract operations
- Code generation tools for boilerplate reduction
- Developer training and documentation

## Implementation Plan

### Phase 1: Core Infrastructure
1. Implement CID calculation functions with comprehensive tests
2. Create TypeScript interfaces for all contracts
3. Build contract validation and serialization utilities
4. Implement basic storage abstraction layer

### Phase 2: Shape Contracts
1. Migrate existing shape data to ShapeContract format
2. Implement shape metadata management
3. Add orientation normalization for CID calculation
4. Create shape contract validation and testing

### Phase 3: Solution Contracts
1. Implement SolutionContract with shape CID references
2. Add solution metadata management
3. Create solution validation against shape contracts
4. Implement solution contract testing

### Phase 4: Status Contracts
1. Implement ephemeral status contract system
2. Add real-time status updates and monitoring
3. Create status contract validation
4. Integrate with solving engines

### Phase 5: Advanced Features
1. Implement symmetry analysis and caching
2. Add advanced search and filtering capabilities
3. Create contract migration and versioning system
4. Optimize performance and add monitoring

## Alternatives Considered

### Traditional Database IDs
**Rejected**: Doesn't provide content integrity, deduplication, or distributed storage benefits. Makes caching and scaling more difficult.

### Hash-Based IDs Without Content Addressing
**Rejected**: Provides some benefits but doesn't enable full content-addressable storage patterns or IPFS compatibility.

### Monolithic Data Structures
**Rejected**: Mixing geometric data with metadata makes CID calculation inconsistent and prevents clean separation of concerns.

### No Data Contracts
**Rejected**: Informal data structures make it difficult to ensure consistency, implement validation, or evolve the data model safely.

## References

- [Content Addressing Specification](https://github.com/multiformats/cid)
- [IPFS Content Addressing](https://docs.ipfs.io/concepts/content-addressing/)
- [Cryptographic Hash Functions](https://en.wikipedia.org/wiki/Cryptographic_hash_function)
- [Data Contract Patterns](https://martinfowler.com/articles/data-contracts.html)

## Related ADRs

- [ADR-001: FCC Coordinate System Decoupling](./001-fcc-coordinates.md) - Engine coordinates used for CID calculations
- [ADR-003: Unified Workspace Architecture](./003-unified-workspace.md) - Workspace operates on contract data
- [ADR-006: Metadata Separation Strategy](./006-metadata-separation.md) - Details metadata storage patterns
