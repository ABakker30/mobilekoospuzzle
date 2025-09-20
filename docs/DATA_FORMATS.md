# Data Formats & Contracts

## Overview
All data formats are defined by the upstream [ballpuzzle4](https://github.com/ABakker30/ballpuzzle4) engine. This document provides quick reference and links.

## Container Format (v1)
**Purpose**: Defines puzzle shape and constraints
**Source**: Upstream engine export
**Location**: `data/examples/containers/`

```json
{
  "version": "1.0",
  "id": "container_001",
  "shape": { /* TBD: link to upstream spec */ },
  "constraints": { /* TBD: link to upstream spec */ }
}
```

## Solution Format
**Purpose**: Piece placements and final state
**Source**: Engine solver output
**Location**: `data/examples/solutions/`

```json
{
  "container_id": "container_001",
  "pieces": [ /* TBD: link to upstream spec */ ],
  "metadata": { /* TBD: link to upstream spec */ }
}
```

## Events Format
**Purpose**: Move sequences and interactions
**Source**: Engine event log
**Location**: `data/examples/events/`

**Meaning**: [Link to upstream documentation needed]

## Status Format
**Purpose**: Current puzzle state
**Source**: Engine status export
**Location**: `data/examples/status/`

**Meaning**: [Link to upstream documentation needed]

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
