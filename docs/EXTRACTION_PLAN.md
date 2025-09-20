# Extraction Plan from ballpuzzle4

## What We Reuse (Data + Specs Only)

### ✅ Schemas & Examples
- **Container definitions**: Copy JSON schema and example files
- **Solution formats**: Copy structure and sample outputs  
- **Event specifications**: Copy event types and examples
- **Status formats**: Copy state definitions and samples
- **Location**: `data/examples/` (with upstream attribution)

### ✅ Piece Definitions
- **Rotation matrices**: Copy specification files only
- **Piece geometry**: Copy coordinate definitions
- **Constraint rules**: Copy documentation and examples
- **Location**: `data/pieces/` (marked as read-only copies)

### ✅ Documentation References
- **CLI usage**: Copy command examples and workflows
- **Data flow diagrams**: Adapt for UI-only context
- **Coordinate system docs**: Copy transform specifications
- **Location**: `docs/WORKFLOWS.md` with exact CLI invocations

### ✅ Test Data
- **Sample containers**: Copy working examples
- **Known solutions**: Copy verified outputs
- **Edge cases**: Copy boundary condition examples
- **Location**: `data/examples/` for development testing

## What We DON'T Reuse (Engine Logic)

### ❌ Algorithm Implementation
- **Solving logic**: Keep upstream as single source of truth
- **Validation code**: Use CLI interface only
- **Optimization routines**: Engine responsibility
- **Constraint checking**: CLI-based verification only

### ❌ Core Engine Files
- **Solver modules**: No copying of implementation
- **State management**: Engine handles internally
- **Move generation**: CLI interface only
- **Performance optimizations**: Upstream responsibility

### ❌ Build/Config Integration
- **Engine build system**: Separate repositories
- **Shared dependencies**: Minimal coupling
- **CI/CD pipelines**: Independent workflows
- **Deployment configs**: UI-specific only

## Migration Strategy

### Phase 1: Data Foundation
1. Copy example files with clear upstream attribution
2. Add README pointing to authoritative source
3. Verify JSON parsing works in UI
4. Document any format assumptions

### Phase 2: Interface Contracts
1. Define transform pipeline interfaces
2. Stub coordinate conversion functions
3. Create type definitions for data formats
4. Test with copied examples

### Phase 3: CLI Integration
1. Document exact upstream CLI commands
2. Create workflow for data generation
3. Test full pipeline: CLI → files → UI
4. Automate copy process if needed

## Maintenance Agreement
- **Upstream is authoritative**: Never modify copied specs
- **Regular sync**: Update examples when upstream changes
- **Clear attribution**: All copied files reference source
- **No divergence**: UI adapts to upstream, not vice versa
