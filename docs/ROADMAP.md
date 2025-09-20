# Development Roadmap

## Phase 1: Foundation (Documentation & Data)
**Goal**: Establish project structure and data contracts

### Acceptance Criteria
- [ ] All documentation files created with placeholders
- [ ] GitHub templates and protection rules active  
- [ ] Example data files copied from upstream (read-only)
- [ ] Data loading and parsing works (JSON → objects)
- [ ] No rendering yet - just data validation

### Deliverables
- Complete docs/ structure
- data/examples/ with sample files
- Basic JSON loaders in src/lib/loaders/
- Type definitions for data formats

---

## Phase 2: Visualization (Viewers & Transforms)
**Goal**: Display containers and solutions in 3D

### Acceptance Criteria
- [ ] Transform pipeline implemented (Native→World→Oriented)
- [ ] Shape Viewer displays container geometry
- [ ] Solution Viewer shows piece placements
- [ ] Mobile-responsive 3D controls
- [ ] No interaction yet - display only

### Deliverables  
- src/lib/coords/ transform modules
- src/components/viewers/ React components
- Three.js scene setup and rendering
- Mobile touch controls for camera

---

## Phase 3: Interaction (Status & Events)
**Goal**: Handle user input and display puzzle state

### Acceptance Criteria
- [ ] Status Monitor shows current puzzle state
- [ ] Touch/click events convert to world coordinates
- [ ] Event log displays move history
- [ ] PWA features work (install, offline)
- [ ] Ready for engine integration via CLI

### Deliverables
- src/components/monitors/ status displays  
- Event handling and coordinate conversion
- PWA manifest and service worker
- CLI integration documentation

---

## Size Constraints (All Phases)
- **Per PR**: ≤200 LOC diff, ≤2 new files
- **Per issue**: Single focused outcome
- **Dependencies**: No changes without dedicated issue
- **Scope**: UI only - no engine logic

## Success Metrics
- Mobile-first PWA loads and displays 3D puzzles
- Clean separation: UI consumes engine via CLI only
- Transform pipeline handles all coordinate conversions
- Small, reviewable PRs with complete documentation
- Ready for puzzle game mechanics in future phases
