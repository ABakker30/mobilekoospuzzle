---
name: "Feature: Viewer Skeleton"
about: Create placeholder viewers for container/solution/status
title: "Feature: Viewer Skeleton"
labels: feature
assignees: ""
---

## Goal
Create read-only viewer skeleton pages.

## Scope
- Add pages/routes for:
  - Shape Viewer
  - Solution Viewer
  - Status Monitor
- Load and parse JSON files from `data/examples/` 
- Show minimal info (counts, IDs) only

## Non-goals
- No rendering with Three.js yet
- No editing shapes
- No transforms beyond parsing

## Acceptance Criteria
- Pages exist and can load example JSON
- Data shown matches schema fields (counts/IDs)
- No engine logic included
