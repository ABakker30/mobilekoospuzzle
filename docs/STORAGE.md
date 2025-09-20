# Hosted JSON Library Storage

This repository hosts puzzle containers, solutions, and partial solutions as static JSON files via GitHub Pages.

## Directory Structure

```
public/content/
├── containers/     # Puzzle containers (.fcc.json files)
├── solutions/      # Complete solutions to containers
├── partials/       # Public partial solution examples
├── events/         # Event-related data (optional)
├── status/         # Status data (optional)
└── index.json      # Manifest listing all items
```

## File Types & Naming Conventions

### Containers
- **Format**: `<name>.fcc.json`
- **Content**: v1 container format with `version`, `lattice`, `cells`, `cid`, and optional `designer`
- **Examples**: `Shape_1.fcc.json`, `16 cell container.fcc.json`

### Solutions
- **Format**: `<container-name>__sol-<number>.json`
- **Content**: Solution data for specific containers
- **Examples**: `Shape_1__sol-001.json`, `hollow_pyramid__sol-042.json`

### Partials
- **Format**: `<container-name>__partial-<id>.json`
- **Content**: Public partial solution examples (non-private samples only)
- **Examples**: `Shape_1__partial-demo.json`, `16_cell__partial-tutorial.json`

## Adding New Items

To add a new item to the hosted library:

1. **Drop the file** in the appropriate folder under `public/content/`
2. **Update the manifest** by adding an entry to `public/content/index.json`:

```json
{
  "type": "container|solution|partial|events|status",
  "name": "<filename>",
  "cid": "<container-id-if-present>",
  "size": <cell-count-if-known>,
  "url": "/content/<folder>/<filename>",
  "updated": "YYYY-MM-DD"
}
```

3. **Commit and push** - GitHub Pages will automatically deploy the changes

## Privacy Note

**Important**: The `partials` folder contains only **public sample data**. Private user saves and work-in-progress solutions should remain in IndexedDB on the user's device and never be committed to this repository.

## Access URLs

Once deployed via GitHub Pages, files are accessible at:
- Base URL: `https://<username>.github.io/<repo-name>/content/`
- Containers: `https://<username>.github.io/<repo-name>/content/containers/<filename>`
- Manifest: `https://<username>.github.io/<repo-name>/content/index.json`

## Container Format (v1)

All containers must follow the v1 format:

```json
{
  "version": "1.0",
  "lattice": "fcc",
  "cells": [[x, y, z], ...],
  "cid": "sha256:...",
  "designer": {
    "name": "...",
    "date": "YYYY-MM-DD"
  }
}
```

## Validation

The application includes validation for v1 containers via `src/lib/guards/containerV1.ts`. All hosted containers should pass this validation before being added to the library.
