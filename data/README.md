# Data Directory - Reference Examples from Upstream

## Provenance
All data files in this directory are copied from the authoritative source:
**[ABakker30/ballpuzzle4](https://github.com/ABakker30/ballpuzzle4)** (MIT License)

**Tag**: v1.6.0  
**Commit**: 9d01c0f3b6072a468a5c33b742d2f07421f617e6  
**Extraction Date**: 2025-09-20T15:35:00Z  

## Important Notice
⚠️ **Upstream is the single source of truth** ⚠️

- **Do not modify** these files - they are read-only reference copies
- **Do not add** new schemas or formats here
- **For authoritative data**: Always refer to the upstream repository
- **For updates**: Re-extract from latest upstream tag

## File Inventory

### Containers (FCC v1 Format)
| File | Source | Description |
|------|--------|-------------|
| `tiny_4.fcc.json` | `tests/data/containers/tiny_4.fcc.json` | 4-cell container (used in README examples) |
| `tiny_6.fcc.json` | `tests/data/containers/tiny_6.fcc.json` | 6-cell container for testing |

### Pieces (FCC v1 Format)  
| File | Source | Description |
|------|--------|-------------|
| `pieces_fcc_v1.json` | `tests/data/pieces/pieces_fcc_v1.json` | Standard FCC piece library v1 |

### Status Snapshots
| File | Source | Description |
|------|--------|-------------|
| `example_status.json` | Generated based on upstream schema | Example status snapshot structure |

### Event Logs (JSONL)
| File | Source | Description |
|------|--------|-------------|
| `example_events.jsonl` | Generated based on upstream format | Example event log entries |

## License
Files copied under MIT License from upstream repository.  
See: https://github.com/ABakker30/ballpuzzle4/blob/v1.6.0/LICENSE

## Usage in UI
These files are used by our viewers for:
- Loading and parsing container definitions
- Displaying piece libraries and rotations  
- Showing solver status and progress
- Visualizing event sequences

For live data generation, use the upstream CLI tools.
