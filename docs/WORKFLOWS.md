# Development Workflows

## Engine → UI Pipeline

### 1. Generate Data (Upstream)
```bash
# Run in ballpuzzle4 repository
./engine generate-container --id container_001 --output containers/
./engine solve --container container_001 --output solutions/
./engine export-events --session session_001 --output events/
./engine status --container container_001 --output status/
```

### 2. Copy to UI Repository
```bash
# Copy generated files to this repo
cp ballpuzzle4/output/containers/* mobilekoospuzzle/data/examples/containers/
cp ballpuzzle4/output/solutions/* mobilekoospuzzle/data/examples/solutions/
cp ballpuzzle4/output/events/* mobilekoospuzzle/data/examples/events/
cp ballpuzzle4/output/status/* mobilekoospuzzle/data/examples/status/
```

### 3. View in App
```bash
# Start dev server
npm run dev -- --host

# Open URLs:
# PC: http://localhost:5173/
# Mobile: http://192.168.4.24:5173/
```

## Development Session Workflow

### 1. Session Charter (Required)
```
Goal: [Single sentence outcome]
Scope: [3-7 files allowed to change]
Non-goals: [What NOT to touch]
Size limits: ≤200 LOC diff, ≤2 files new, no deps
Artifacts: Update docs for any changes
Exit: Tests pass, PR opened with summary
```

### 2. Branch & PR Flow
```bash
# Create feature branch
git checkout -b feat/short-name

# Make changes (within scope)
# ... development work ...

# Commit and push
git add .
git commit -m "feat: brief description"
git push origin feat/short-name

# Open PR with template checklist
```

### 3. Review & Merge
- PR must be ≤200 LOC
- All checklist items completed
- Docs updated if applicable
- Squash merge to main

## CLI Commands Reference

### Engine Operations (Upstream)
[TBD: Add exact CLI invocations from ballpuzzle4]

### Local Development
```bash
# Start with mobile access
npm run dev -- --host

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Out of Scope
- Engine modifications
- Custom CLI tools
- Direct engine integration
