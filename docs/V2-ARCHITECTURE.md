# Koos Puzzle V2 Architecture
*Clean, Scalable, Test-Driven Design*

## 🎯 Architectural Principles

### Core Design Philosophy
1. **Separation of Concerns**: Clear boundaries between engine logic and visualization
2. **Single Source of Truth**: Centralized coordinate transformations and data contracts
3. **Scalable Foundation**: Built to grow from personal tool to global platform
4. **Test-Driven Development**: Comprehensive automated testing from day one
5. **Documentation-Driven**: All architectural decisions recorded and justified

### Key Architectural Decisions
- **Dual Coordinate Systems**: Engine (mathematical) vs World (visualization)
- **CID-Based Data Contracts**: Content-addressable storage for integrity
- **Unified Workspace**: Single 3D environment with mode-based functionality
- **Component Reusability**: Shared components across all modes
- **Clean Interfaces**: Well-defined contracts between layers

---

## 📐 Coordinate System Architecture

### The Challenge
Managing two different coordinate systems while maintaining mathematical integrity and visual consistency across all features.

### The Solution: Dual FCC Systems

#### Engine FCC (Rhombohedral)
```typescript
interface EngineFCC {
  x: number; // Rhombohedral coordinates
  y: number; // Mathematical operations
  z: number; // Algorithm processing
}

// Used for:
// - Shape definitions and validation
// - Piece fitting algorithms
// - Solver engines (DFS, DLX, custom)
// - Collision detection
// - Data serialization/storage
// - CID calculations
```

#### World FCC (Visualization)
```typescript
interface WorldFCC extends THREE.Vector3 {
  // Three.js compatible coordinates
  // Optimized for 3D rendering
}

// Used for:
// - 3D rendering and materials
// - User interactions (mouse, touch)
// - Camera controls and positioning
// - Animation and visual effects
// - UI coordinate mapping
```

### Transformation Layer
```typescript
// lib/coords/fcc.ts - SINGLE SOURCE OF TRUTH
export function engineToWorld(engineCoord: EngineFCC): WorldFCC;
export function worldToEngine(worldCoord: WorldFCC): EngineFCC;

// Critical Requirements:
// - Used by ALL components
// - NO duplicated transformation logic
// - Centralized optimization and bug fixes
// - Consistent behavior across entire platform
```

### Benefits
- **Maintainability**: One place to fix coordinate bugs
- **Performance**: Optimized transformations used consistently
- **Scalability**: Easy to add new features without coordinate confusion
- **Reliability**: No drift between different implementations

---

## 🏗️ Component Architecture

### Unified Workspace Structure
```
UnifiedWorkspace
├── WorkspaceHeader (mode switching, settings)
├── ShapeViewer3D (reusable 3D component)
├── ModeToolbar (dynamic based on current mode)
├── StatusPanel (real-time updates)
└── SettingsModal (unified settings system)
```

### Core Reusable Components

#### ShapeViewer3D
```typescript
interface ShapeViewer3DProps {
  mode: 'puzzle-shape' | 'auto-solve' | 'manual-solve' | 'view-solution';
  coordinates: EngineFCC[];
  solution?: SolutionContract;
  settings: ViewerSettings;
  onCoordinatesChange?: (coords: EngineFCC[]) => void;
  onInteraction?: (event: InteractionEvent) => void;
}

// Features:
// - Consistent 3D rendering across all modes
// - Same orientation/centering logic everywhere
// - Unified settings system (brightness, materials, etc.)
// - Mobile-optimized orbit controls
// - Performance optimization for large datasets
```

#### ModeToolbar (Dynamic)
```typescript
interface ModeToolbarProps {
  mode: WorkspaceMode;
  context: ModeContext;
  onAction: (action: ToolbarAction) => void;
}

// Mode-specific toolbars:
// - Puzzle Shape: Add/Delete, Library, Save/Load
// - Auto Solve: Engine Selection, Start/Stop, Progress
// - Manual Solve: Piece Selection, Placement Tools, Undo/Redo
// - View Solution: Navigation, Analysis, Sharing
```

### Data Flow Architecture
```
User Interaction → World Coordinates → Engine Coordinates → Business Logic
                                                          ↓
UI Updates ← World Coordinates ← Engine Coordinates ← State Changes
```

---

## 💾 Data Architecture

### CID-Based Content Addressing

#### Shape Storage
```typescript
// Pure geometric data (CID calculated from this)
interface ShapeContract {
  version: "1.0";
  coordinates: EngineFCC[]; // Canonical orientation
}

// Social/temporal data (separate storage)
interface ShapeMetadata {
  cid: string;              // References ShapeContract
  creator: string;
  createdAt: timestamp;
  title?: string;
  tags: string[];
  difficulty?: number;
  popularity: number;
  symmetry: SymmetryQuality;
}
```

#### Solution Storage
```typescript
// Pure solving data (CID calculated from this)
interface SolutionContract {
  version: "1.0";
  shapeCID: string;         // References ShapeContract
  pieces: PiecePlacement[];
}

// Social/temporal data (separate storage)
interface SolutionMetadata {
  cid: string;              // References SolutionContract
  solver: string;
  solvedAt: timestamp;
  algorithm?: string;
  duration?: number;
  rating?: number;
}
```

### Database Architecture
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

### Benefits
- **Deduplication**: Identical content shares storage
- **Integrity**: CID validates content hasn't changed
- **Scalability**: Horizontal scaling with content addressing
- **Caching**: Efficient caching strategies using CIDs
- **Offline**: CIDs work without central authority

---

## 🧪 Testing Architecture

### Testing Strategy
```
Unit Tests (70%)
├── Coordinate transformations
├── CID calculations
├── Symmetry analysis
├── Pure functions and utilities
└── Business logic components

Integration Tests (20%)
├── Component interactions
├── Data flow between layers
├── Mode switching functionality
├── Settings persistence
└── File loading/saving

End-to-End Tests (10%)
├── Complete user workflows
├── Cross-browser compatibility
├── Mobile device testing
├── Performance benchmarks
└── Accessibility compliance
```

### Test Structure
```typescript
// Example: Coordinate transformation tests
describe('FCC Coordinate System', () => {
  describe('engineToWorld', () => {
    it('should transform origin correctly', () => {
      const engine: EngineFCC = { x: 0, y: 0, z: 0 };
      const world = engineToWorld(engine);
      expect(world).toEqual(new THREE.Vector3(0, 0, 0));
    });

    it('should be reversible', () => {
      const original: EngineFCC = { x: 1, y: 2, z: 3 };
      const world = engineToWorld(original);
      const restored = worldToEngine(world);
      expect(restored).toEqual(original);
    });
  });
});
```

### Continuous Integration
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
      - run: npm run test:coverage
```

---

## 🚀 Performance Architecture

### 3D Rendering Optimization
```typescript
// Efficient geometry management
class GeometryManager {
  private geometryCache = new Map<string, THREE.BufferGeometry>();
  private materialCache = new Map<string, THREE.Material>();
  
  getOptimizedGeometry(coordinates: EngineFCC[]): THREE.BufferGeometry {
    const cacheKey = this.calculateGeometryCID(coordinates);
    if (!this.geometryCache.has(cacheKey)) {
      this.geometryCache.set(cacheKey, this.createGeometry(coordinates));
    }
    return this.geometryCache.get(cacheKey)!;
  }
}
```

### Memory Management
- **Object Pooling**: Reuse Three.js objects to reduce garbage collection
- **Lazy Loading**: Load geometry and textures only when needed
- **Level of Detail**: Reduce complexity for distant or small objects
- **Frustum Culling**: Only render objects visible to camera

### Data Loading Optimization
- **Streaming**: Load large datasets progressively
- **Compression**: Efficient serialization of coordinate data
- **Caching**: Browser and server-side caching strategies
- **Prefetching**: Anticipate user needs and preload content

---

## 🔧 Development Architecture

### Project Structure
```
src/
├── components/           # Reusable React components
│   ├── workspace/       # Unified workspace components
│   ├── viewers/         # 3D visualization components
│   ├── toolbars/        # Mode-specific toolbars
│   └── common/          # Shared UI components
├── lib/                 # Core libraries and utilities
│   ├── coords/          # Coordinate system transformations
│   ├── contracts/       # Data contract definitions
│   ├── geometry/        # Geometric calculations
│   └── utils/           # General utilities
├── services/            # External service integrations
│   ├── storage/         # Data persistence
│   ├── auth/            # User authentication
│   └── api/             # Backend API clients
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
└── __tests__/           # Test files (co-located)

docs/
├── ADR/                 # Architecture Decision Records
├── FEATURES/            # Feature specifications
├── IMPLEMENTATION/      # Phase-by-phase guides
└── TECHNICAL/           # Technical documentation
```

### Development Workflow
```bash
# Feature development
git checkout -b feature/unified-workspace
npm run test:watch        # Continuous testing
npm run dev              # Development server
npm run test:coverage    # Coverage reports
npm run lint             # Code quality
git commit -m "feat: add unified workspace shell"
```

### Code Quality Standards
- **TypeScript**: Strict mode with comprehensive type coverage
- **ESLint**: Consistent code style and error prevention
- **Prettier**: Automated code formatting
- **Husky**: Pre-commit hooks for quality gates
- **Conventional Commits**: Standardized commit messages

---

## 🔐 Security Architecture

### Data Security
- **Input Validation**: All user inputs validated and sanitized
- **CID Verification**: Content integrity through cryptographic hashes
- **Rate Limiting**: Prevent abuse of computational resources
- **CORS Configuration**: Secure cross-origin resource sharing

### User Security
- **Authentication**: Secure user login and session management
- **Authorization**: Role-based access control for features
- **Privacy**: User data protection and GDPR compliance
- **Content Moderation**: Community guidelines enforcement

---

## 📈 Scalability Architecture

### Horizontal Scaling
- **Stateless Components**: No server-side state dependencies
- **CDN Distribution**: Global content delivery network
- **Database Sharding**: Partition data across multiple databases
- **Microservices**: Independent scaling of different features

### Performance Monitoring
- **Real User Monitoring**: Track actual user experience
- **Application Performance Monitoring**: Server-side metrics
- **Error Tracking**: Comprehensive error reporting and analysis
- **Analytics**: User behavior and feature usage tracking

---

## 🎯 Migration Strategy

### V1 to V2 Transition
1. **Parallel Development**: V2 built alongside stable V1
2. **Feature Parity**: Ensure V2 matches all V1 capabilities
3. **Data Migration**: Convert existing puzzles to new format
4. **User Testing**: Beta testing with select users
5. **Gradual Rollout**: Phased deployment with rollback capability

### Backward Compatibility
- **Data Format Migration**: Automatic conversion of old formats
- **API Versioning**: Support for legacy integrations
- **Feature Flags**: Gradual enablement of new features
- **Fallback Mechanisms**: Graceful degradation when needed

---

## 📋 Success Criteria

### Technical Success
- **Performance**: <2s load time, 60fps 3D rendering
- **Reliability**: 99.9% uptime, comprehensive error handling
- **Maintainability**: <1 day to onboard new developers
- **Scalability**: Support 10,000+ concurrent users

### Code Quality Success
- **Test Coverage**: >80% automated test coverage
- **Documentation**: All architectural decisions documented
- **Type Safety**: 100% TypeScript coverage
- **Code Review**: All changes reviewed and approved

### User Experience Success
- **Usability**: Intuitive interface requiring minimal learning
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Smooth experience on mobile devices
- **Reliability**: Error-free operation for 99% of user sessions

---

This architecture provides the foundation for building "The Minecraft of 3D Puzzles" - a platform that can scale from personal tool to global community while maintaining mathematical rigor and user experience excellence.
