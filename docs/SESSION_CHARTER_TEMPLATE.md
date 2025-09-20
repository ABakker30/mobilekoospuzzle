# Windsurf Session Charter Template

## Copy-Paste Template for Each Session

```
**Windsurf Session Charter**

Goal (single): [Copy from GitHub issue Goal section]
Scope (allowed edits): [Copy from GitHub issue Scope section - list specific files]
Non-goals: [Copy from GitHub issue Non-goals section]
Size limits: ≤200 LOC diff, ≤2 files new, no dependency changes
Artifacts required: Update docs if any architecture/data contracts change
Exit criteria: [Copy from GitHub issue Acceptance Criteria], tests pass, PR opened

If Windsurf proposes anything outside scope: "Decline and restate scope."
```

## Example Usage

### For "Docs: Baseline" Issue
```
**Windsurf Session Charter**

Goal (single): Set up baseline documentation files with placeholders
Scope (allowed edits): docs/PROJECT_OVERVIEW.md, docs/ARCHITECTURE.md, docs/DATA_FORMATS.md, docs/WORKFLOWS.md, docs/ROADMAP.md, docs/CONTRIBUTING.md, .github/PULL_REQUEST_TEMPLATE.md
Non-goals: No code changes, no dependency changes, no engine logic
Size limits: ≤200 LOC diff, ≤2 files new, no dependency changes
Artifacts required: All documentation files created
Exit criteria: All listed docs exist with section headings, each contains "Out of scope" section, links back to upstream repo, PR opened

If Windsurf proposes anything outside scope: "Decline and restate scope."
```

### For "Data: Import Reference Examples" Issue
```
**Windsurf Session Charter**

Goal (single): Bring in minimal set of upstream data for local viewing/testing
Scope (allowed edits): data/examples/ directory, data/README.md, src/lib/loaders/ (if needed for basic JSON parsing)
Non-goals: No engine code, no transforms, no editing schema definitions
Size limits: ≤200 LOC diff, ≤2 files new, no dependency changes
Artifacts required: Update DATA_FORMATS.md if format examples added
Exit criteria: Example files present and loadable, README points to upstream repo as source of truth, PR opened

If Windsurf proposes anything outside scope: "Decline and restate scope."
```

### For "Feature: Viewer Skeleton" Issue
```
**Windsurf Session Charter**

Goal (single): Create read-only viewer skeleton pages
Scope (allowed edits): src/components/viewers/, src/App.jsx (for routing), src/lib/loaders/ (extend if needed)
Non-goals: No rendering with Three.js yet, no editing shapes, no transforms beyond parsing
Size limits: ≤200 LOC diff, ≤2 files new, no dependency changes
Artifacts required: Update ARCHITECTURE.md if component structure changes
Exit criteria: Pages exist and can load example JSON, data shown matches schema fields (counts/IDs), no engine logic included, PR opened

If Windsurf proposes anything outside scope: "Decline and restate scope."
```

## Drift Control Prompts

Use these verbatim if Windsurf starts to wander:

- "Do not create or modify files outside: [list from scope]. If you believe more files are needed, stop and propose."
- "Keep the total diff under 200 LOC and no dependency changes."
- "No engine logic; treat engines as external via CLI only."
- "Before writing code, summarize your plan in 5 bullets. Wait for my 'OK'."
