# Data Formats & Contracts

## Overview
All data formats are defined by the upstream [ballpuzzle4](https://github.com/ABakker30/ballpuzzle4) engine. This document provides quick reference and links.

## Container Format (FCC v1)
**Purpose**: Defines puzzle shape and constraints  
**Source**: Upstream engine export  
**Location**: `data/examples/containers/`  
**Upstream Spec**: [CONTAINER_STANDARD.md](https://github.com/ABakker30/ballpuzzle4/blob/v1.6.0/docs/CONTAINER_STANDARD.md)

```json
{
  "name": "tiny_4_cell_container",
  "lattice_type": "fcc", 
  "coordinates": [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0]]
}
```

## Pieces Format (FCC v1)
**Purpose**: Piece definitions and inventory  
**Source**: Upstream piece library  
**Location**: `data/pieces/`  
**Example**: See `pieces_fcc_v1.json` with standard A-Y pieces

```json
{
  "name": "pieces_fcc_v1",
  "lattice_type": "fcc",
  "pieces": {
    "single": {
      "coordinates": [[0, 0, 0]],
      "count": 4,
      "description": "Single ball piece"
    }
  }
}
```

## Events Format (JSONL)
**Purpose**: Move sequences and solver interactions  
**Source**: Engine event log  
**Location**: `data/examples/events/`  
**Format**: One JSON object per line

```jsonl
{"timestamp": "2025-09-20T15:33:00.100Z", "event_type": "solver_start", "container_id": "tiny_4_cell_container"}
{"timestamp": "2025-09-20T15:33:00.250Z", "event_type": "piece_placed", "piece_id": "single_1", "position": [0, 0, 0]}
```

## Status Format (JSON)
**Purpose**: Current solver state and progress  
**Source**: Engine status export  
**Location**: `data/examples/status/`  
**Upstream Schema**: [status_snapshot.v2.json](https://github.com/ABakker30/ballpuzzle4/blob/v1.6.0/docs/schemas/status_snapshot.v2.json)

```json
{
  "timestamp": "2025-09-20T15:33:00Z",
  "container_id": "tiny_4_cell_container", 
  "solver_state": "solving",
  "pieces_placed": 2,
  "progress_percent": 50.0
}
```

## Transform Contracts

### Native → World
- **Input**: Engine coordinate system
- **Output**: Standardized 3D world space
- **Implementation**: `src/lib/coords/native-to-world.js`

### World → Oriented  
- **Input**: World coordinates
- **Output**: Camera/view-specific positioning
- **Implementation**: `src/lib/coords/world-to-oriented.js`

## Out of Scope
- Format modifications (upstream owns schema)
- Custom coordinate systems
- Engine-specific optimizations
