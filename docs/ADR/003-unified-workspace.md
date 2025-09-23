# ADR-003: Unified Workspace Architecture

## Status
**Accepted** - Core UI architecture for V2

## Context

Koos Puzzle currently has separate pages for different functionality:
- Puzzle Shape page for creating/editing shapes
- View Solution page for browsing solutions
- Auto Solve page (placeholder) for automated solving
- Manual Solve page (placeholder) for interactive solving

This approach leads to:
- Context loss when switching between different puzzle-related tasks
- Code duplication across similar 3D visualization components
- Inconsistent user experience and interface patterns
- Difficulty maintaining shared state between related operations
- Poor user workflow for tasks that span multiple "pages"

Users need to seamlessly transition between creating shapes, solving puzzles, and viewing results without losing context or relearning interfaces. The vision is to create "The Minecraft of 3D Puzzles" - a unified creative environment.

## Decision

We will implement a **Unified Workspace Architecture** with mode-based functionality:

### Single 3D Workspace with Multiple Modes

```typescript
type WorkspaceMode = 
  | 'puzzle-shape'    // Create and edit container shapes
  | 'auto-solve'      // Configure and run automated solving
  | 'manual-solve'    // Interactive piece placement and building
  | 'view-solution'   // Browse and analyze existing solutions
  | 'piece-editor';   // Design custom pieces (future)

interface UnifiedWorkspaceProps {
  initialMode: WorkspaceMode;
  initialData?: WorkspaceData;
  onModeChange?: (mode: WorkspaceMode) => void;
}
```

### Component Architecture

```
UnifiedWorkspace
├── WorkspaceHeader
│   ├── ModeSelector (tabs/buttons for switching modes)
│   ├── SettingsButton (unified settings modal)
│   └── HomeButton (return to main page)
├── ShapeViewer3D (reusable across all modes)
│   ├── Three.js scene with FCC coordinate support
│   ├── Mobile-optimized orbit controls
│   ├── Consistent material and lighting system
│   └── Mode-specific interaction handlers
├── ModeToolbar (dynamic based on current mode)
│   ├── PuzzleShapeToolbar (add/delete, library, save/load)
│   ├── AutoSolveToolbar (engine selection, start/stop, progress)
│   ├── ManualSolveToolbar (piece selection, placement, undo/redo)
│   └── ViewSolutionToolbar (navigation, analysis, sharing)
├── StatusPanel (real-time updates and information)
└── UnifiedSettingsModal (mode-aware settings)
```

### User Experience Flow

```
Home Page → Mode Selection → Unified Workspace
├── Load Shape → Switch to any mode → Work seamlessly
├── Create Shape → Auto Solve → View Results → Manual Solve
├── Consistent 3D controls and visual experience
└── No page reloads or context loss
```

### Mode-Specific Behavior

#### Puzzle Shape Mode
- Shape editing tools in toolbar
- Add/delete sphere interactions
- Library browser integration
- Save/load functionality
- Hull-based auto-orientation

#### Auto Solve Mode
- Solver engine selection
- Real-time progress monitoring
- Status updates and metrics
- Solution result display
- Performance analytics

#### Manual Solve Mode
- Interactive piece placement
- Drag-and-drop functionality
- Collision detection and validation
- Undo/redo operations
- Progress tracking

#### View Solution Mode
- Solution browsing and navigation
- Piece visibility controls
- Analysis tools and metrics
- Sharing and export options
- Community features integration

### Shared State Management

```typescript
interface WorkspaceState {
  currentMode: WorkspaceMode;
  loadedShape?: ShapeContract;
  currentSolution?: SolutionContract;
  settings: UnifiedSettings;
  history: WorkspaceAction[];
}

// State persists across mode switches
// Users don't lose work when changing modes
// Undo/redo works across mode boundaries
```

## Consequences

### Positive Consequences

**Seamless User Experience**
- No context loss when switching between related tasks
- Consistent 3D controls and visual experience across all modes
- Natural workflow from creation to solving to analysis
- Single interface to learn instead of multiple separate pages

**Code Reusability**
- Single ShapeViewer3D component used across all modes
- Shared coordinate transformation and rendering logic
- Consistent settings and preferences system
- Reduced code duplication and maintenance overhead

**Enhanced Productivity**
- Quick mode switching for iterative design and testing
- Persistent state across mode changes
- Integrated workflow for complex puzzle operations
- Better spatial understanding through consistent 3D environment

**Scalable Architecture**
- Easy to add new modes without duplicating infrastructure
- Consistent patterns for mode-specific functionality
- Shared components can be optimized once for all modes
- Clear separation between mode logic and shared infrastructure

**Professional User Experience**
- Matches expectations from professional 3D software
- Unified interface similar to CAD/modeling applications
- Consistent with "Minecraft of 3D Puzzles" vision
- Supports complex workflows and advanced users

### Negative Consequences

**Implementation Complexity**
- More complex state management across modes
- Need to handle mode transitions and data validation
- Shared component must support all mode requirements
- More complex testing scenarios

**Performance Considerations**
- Single component must handle all mode functionality
- Potential memory usage from keeping all mode code loaded
- Need to optimize for different usage patterns
- Complex 3D scene management across modes

**User Interface Complexity**
- Mode-specific UI elements need careful design
- Risk of overwhelming users with too many options
- Need clear visual indicators for current mode
- Potential confusion about mode-specific functionality

### Mitigation Strategies

**Implementation Complexity**
- Clear separation between shared and mode-specific logic
- Comprehensive state management patterns
- Extensive testing for mode transitions
- Well-documented component interfaces

**Performance Optimization**
- Lazy loading of mode-specific functionality
- Efficient 3D scene management and cleanup
- Memory profiling and optimization
- Progressive enhancement for complex features

**User Interface Design**
- Clear visual mode indicators and transitions
- Progressive disclosure of advanced features
- Consistent design patterns across modes
- User testing and feedback integration

## Implementation Plan

### Phase 1: Workspace Shell
1. Create UnifiedWorkspace component with basic mode switching
2. Implement WorkspaceHeader with mode selector
3. Add basic state management for mode transitions
4. Create placeholder mode components

### Phase 2: Shared 3D Component
1. Extract and generalize ShapeViewer3D from existing pages
2. Implement mode-aware interaction handling
3. Add consistent coordinate transformation support
4. Optimize for performance across all modes

### Phase 3: Mode Implementation
1. Implement Puzzle Shape mode with existing functionality
2. Add View Solution mode with enhanced features
3. Create Auto Solve mode with solver integration
4. Implement Manual Solve mode with interactive placement

### Phase 4: Advanced Features
1. Add unified settings system across all modes
2. Implement state persistence and history
3. Add mode transition animations and feedback
4. Optimize performance and add monitoring

### Phase 5: Polish and Enhancement
1. Add advanced mode-specific features
2. Implement community integration
3. Add accessibility and mobile optimization
4. Performance tuning and user experience refinement

## Alternatives Considered

### Separate Pages with Shared Components
**Rejected**: Still requires page navigation and context switching. Doesn't provide the seamless experience needed for complex workflows.

### Modal-Based Mode Switching
**Rejected**: Modals are not suitable for primary application functionality. Would feel cramped and limit the 3D workspace experience.

### Tabbed Interface
**Rejected**: Tabs suggest document-like workflow rather than tool-based workflow. Doesn't match the 3D application paradigm.

### Multiple Windows/Panels
**Rejected**: Too complex for web application, poor mobile experience, and doesn't provide the unified workspace feeling.

## References

- [Blender UI Architecture](https://docs.blender.org/manual/en/latest/interface/index.html)
- [Unity Editor Interface Design](https://docs.unity3d.com/Manual/UsingTheEditor.html)
- [Figma Workspace Design Patterns](https://www.figma.com/blog/how-we-built-the-figma-plugin-system/)
- [React State Management Patterns](https://kentcdodds.com/blog/application-state-management-with-react)

## Related ADRs

- [ADR-001: FCC Coordinate System Decoupling](./001-fcc-coordinates.md) - Workspace uses dual coordinate system
- [ADR-002: CID-Based Data Contracts](./002-cid-contracts.md) - Workspace operates on contract data
- [ADR-005: Component Reusability Pattern](./005-component-reusability.md) - Defines shared component patterns
