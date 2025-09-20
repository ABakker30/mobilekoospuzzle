# Contributing Guidelines

## Small PRs Philosophy
- **One change per PR**: Single focused outcome
- **Size limit**: ≤200 lines of code diff
- **File limit**: ≤2 new files per PR
- **No dependency changes** without dedicated issue

## Development Process

### 1. Start with Session Charter
Every Windsurf session begins with:
```
Goal (single): [One sentence outcome for this session]
Scope (allowed edits): [List 3-7 files you permit changes to]
Non-goals: [Explicitly list what NOT to touch]
Size limits: ≤200 LOC diff, ≤2 files new, no dependency changes
Artifacts required: [Update docs/checklists for anything you change]
Exit criteria: [Tests pass, PR opened with summary + checklists]
```

### 2. Issue → Branch → PR Flow
```bash
# Create issue first (use template)
# Create feature branch
git checkout -b feat/short-descriptive-name

# Make focused changes within scope
# Commit with clear messages
git commit -m "feat: brief description of single change"

# Push and open PR
git push origin feat/short-descriptive-name
```

### 3. PR Requirements
- Use PR template checklist (all items must be ✅)
- Link to originating issue
- Stay within size and scope limits
- Update relevant documentation
- Pass all CI checks

## Testing Strategy

### For Transform Functions (Required)
```javascript
// src/lib/coords/__tests__/
describe('coordinate transforms', () => {
  test('round-trip conversion preserves data', () => {
    // native → world → oriented → world → native
  });
  
  test('handles edge cases', () => {
    // null, undefined, extreme values
  });
});
```

### For UI Components (Recommended)
- Visual regression tests for 3D scenes
- Mobile interaction testing
- PWA functionality verification

## Code Organization

### Allowed Locations
- `src/components/` - React UI components
- `src/lib/loaders/` - JSON file handling
- `src/lib/three/` - Three.js utilities  
- `data/examples/` - Sample data (read-only copies)
- `docs/` - Documentation updates

### Protected Locations (CODEOWNERS)
- `src/lib/coords/` - Transform pipeline (requires review)
- `docs/` - Architecture documentation (requires review)

## What NOT to Contribute

### ❌ Engine Logic
- Puzzle solving algorithms
- Move validation
- Constraint checking
- State management beyond UI

### ❌ Large Changes
- Dependency updates (needs dedicated issue)
- Build system changes
- New folders without approved architecture
- Refactors >200 LOC

### ❌ Coordinate Systems
- Custom transforms outside shared module
- Direct Three.js coordinate manipulation
- Engine-specific coordinate handling

## Review Process

### Self-Review Checklist
- [ ] Stays within declared scope
- [ ] ≤200 LOC diff
- [ ] No engine logic introduced
- [ ] Documentation updated if applicable
- [ ] Tests added for transforms
- [ ] Mobile-responsive if UI change

### Reviewer Focus
- Scope adherence (most important)
- Code quality and maintainability  
- Documentation completeness
- Test coverage for transforms
- Mobile UX considerations

## Getting Help

### Before Starting
- Read relevant docs/ files
- Check existing issues and PRs
- Understand the transform pipeline
- Review data format contracts

### During Development  
- Use Session Charter to stay focused
- Ask questions in issue comments
- Request scope clarification if needed
- Stop and propose if more files needed

### Common Patterns
```javascript
// Loading data
import { loadContainer } from '@/lib/loaders';
const container = await loadContainer('container_001.json');

// Transforming coordinates  
import { nativeToWorld, worldToOriented } from '@/lib/coords';
const worldCoords = nativeToWorld(container.shape);
const oriented = worldToOriented(worldCoords, cameraParams);

// Three.js rendering
mesh.position.copy(oriented.position);
mesh.rotation.copy(oriented.rotation);
```
