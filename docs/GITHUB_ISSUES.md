# GitHub Issues to Create

## Issue 1: Documentation Baseline

**Title**: [FEAT] Documentation Baseline - Project Structure and Contracts

**Body**:
```markdown
# Feature Specification

## Goal (Single Sentence)
Establish complete documentation structure with placeholders and links to upstream repository.

## Scope (Files Allowed to Change)
- [x] `docs/PROJECT_OVERVIEW.md` (already created)
- [x] `docs/ARCHITECTURE.md` (already created)
- [x] `docs/DATA_FORMATS.md` (already created)
- [x] `docs/WORKFLOWS.md` (already created)
- [x] `docs/EXTRACTION_PLAN.md` (already created)
- [x] `docs/TRANSFORM_PIPELINE.md` (already created)
- [x] `docs/ROADMAP.md` (already created)

## Non-Goals (Explicitly Out of Scope)
- No code implementation
- No dependency changes
- No engine logic
- No data file creation

## Size Constraints
- [x] ≤200 lines of code diff
- [x] ≤2 new files created
- [x] No dependency modifications

## Acceptance Criteria
- [x] All documentation files exist with complete structure
- [x] Links to upstream ballpuzzle4 repository included
- [x] "Out of scope" sections clearly defined
- [x] Transform pipeline interfaces specified
- [x] Session Charter template ready for next issues

## Technical Approach
Documentation-only task establishing project guardrails.

## Dependencies
- None (foundation task)

## Documentation Updates Required
- [x] All docs created as part of this issue

## Session Charter Template
```
Goal: Complete documentation baseline for project structure
Scope: docs/ directory files only
Non-goals: No code, no dependencies, no engine logic
Size limits: ≤200 LOC diff, ≤2 files new, no dependency changes
Artifacts: All docs/ files created
Exit criteria: Documentation complete, PR opened with structure
```
```

---

## Issue 2: Import Reference Data (Read-Only)

**Title**: [FEAT] Import Reference Data - Copy Examples from Upstream

**Body**:
```markdown
# Feature Specification

## Goal (Single Sentence)
Copy minimal set of example container/solution/events/status files from ballpuzzle4 with clear upstream attribution.

## Scope (Files Allowed to Change)
- [ ] `data/examples/containers/` (new directory)
- [ ] `data/examples/solutions/` (new directory)  
- [ ] `data/examples/events/` (new directory)
- [ ] `data/examples/status/` (new directory)
- [ ] `data/README.md` (new file)
- [ ] `src/lib/loaders/json-loader.js` (new file)

## Non-Goals (Explicitly Out of Scope)
- No engine logic implementation
- No data format modifications
- No coordinate transforms yet
- No UI components

## Size Constraints
- [ ] ≤200 lines of code diff
- [ ] ≤2 new files created (focus on data + basic loader)
- [ ] No dependency modifications

## Acceptance Criteria
- [ ] Example files copied with upstream attribution
- [ ] data/README.md points to authoritative source
- [ ] Basic JSON loader can parse example files
- [ ] Type definitions created for data formats
- [ ] No rendering - just successful parsing

## Technical Approach

### Data Flow
ballpuzzle4 examples → copy → data/examples/ → JSON loader → parsed objects

### Key Components
- data/ directory structure
- Basic JSON file loader utility
- TypeScript/JSDoc type definitions

### Testing Strategy
- Verify JSON parsing works without errors
- Check type definitions match actual data structure

## Dependencies
- Depends on: #1 (Documentation Baseline)

## Documentation Updates Required
- [ ] DATA_FORMATS.md (add actual format examples)
- [ ] WORKFLOWS.md (add data copy process)

## Session Charter Template
```
Goal: Import reference data files with basic JSON loading capability
Scope: data/examples/, src/lib/loaders/json-loader.js, data/README.md
Non-goals: No rendering, no transforms, no UI, no engine logic
Size limits: ≤200 LOC diff, ≤2 files new, no dependency changes
Artifacts: Update DATA_FORMATS.md and WORKFLOWS.md
Exit criteria: JSON files load successfully, types defined, PR opened
```
```

---

## Issue 3: Viewer Skeleton (No Engine)

**Title**: [FEAT] Viewer Skeleton - Empty Pages with Data Loading

**Body**:
```markdown
# Feature Specification

## Goal (Single Sentence)
Create empty viewer pages/routes that load and display JSON file summaries without 3D rendering.

## Scope (Files Allowed to Change)
- [ ] `src/components/viewers/ShapeViewer.jsx` (new file)
- [ ] `src/components/viewers/SolutionViewer.jsx` (new file)
- [ ] `src/App.jsx` (modify to add routes)
- [ ] `src/lib/loaders/` (extend if needed)

## Non-Goals (Explicitly Out of Scope)
- No 3D rendering or Three.js yet
- No coordinate transforms
- No engine logic
- No complex UI styling

## Size Constraints
- [ ] ≤200 lines of code diff
- [ ] ≤2 new files created
- [ ] No dependency modifications

## Acceptance Criteria
- [ ] Shape Viewer loads container JSON and shows summary (ID, piece count)
- [ ] Solution Viewer loads solution JSON and shows summary (container ID, pieces)
- [ ] Basic routing between viewers works
- [ ] Data contracts verified (JSON structure matches expectations)
- [ ] Mobile-responsive layout (basic)

## Technical Approach

### Data Flow
User selects file → JSON loader → parse → display summary info only

### Key Components
- React components for each viewer type
- Basic routing (React Router or simple state)
- File selection UI
- Summary display components

### Testing Strategy
- Verify each viewer can load its respective JSON type
- Check mobile responsiveness
- Confirm no console errors

## Dependencies
- Depends on: #2 (Import Reference Data)

## Documentation Updates Required
- [ ] ARCHITECTURE.md (add component structure)

## Session Charter Template
```
Goal: Create viewer skeleton components that load and summarize JSON data
Scope: src/components/viewers/, src/App.jsx, extend loaders if needed
Non-goals: No 3D rendering, no transforms, no styling, no engine logic
Size limits: ≤200 LOC diff, ≤2 files new, no dependency changes
Artifacts: Update ARCHITECTURE.md with component structure
Exit criteria: Viewers load JSON and show summaries, mobile works, PR opened
```
```
