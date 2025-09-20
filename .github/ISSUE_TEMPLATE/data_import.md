---
name: "Data: Import Reference Examples"
about: Copy minimal example data files from upstream
title: "Data: Import Reference Examples"
labels: data
assignees: ""
---

## Goal
Bring in a minimal set of upstream data for local viewing/testing.

## Scope
- Add files under `data/examples/` 
  - containers (v1 JSON)
  - solutions (JSON)
  - events (JSONL)
  - status (JSON)
- Add `README.md`  in `data/`  explaining upstream is canonical

## Non-goals
- No engine code
- No transforms
- No editing schema definitions

## Acceptance Criteria
- Example files present and loadable
- README points to upstream repo as source of truth
