# Extraction Log - ballpuzzle4 Data Import

## Source Information
- **Repository**: https://github.com/ABakker30/ballpuzzle4
- **Tag**: v1.6.0
- **Commit Hash**: 9d01c0f3b6072a468a5c33b742d2f07421f617e6
- **Extraction Date**: 2025-09-20T15:35:00Z (UTC)
- **Operator**: Windsurf session (automated import)

## Files Imported

### Containers
| Destination | Source | SHA256 |
|-------------|--------|--------|
| `data/examples/containers/tiny_4.fcc.json` | `tests/data/containers/tiny_4.fcc.json` | b05799fdd335a046e817e36f5b3a9bce2aa04346 |
| `data/examples/containers/tiny_6.fcc.json` | `tests/data/containers/tiny_6.fcc.json` | 8582badeca0bb1b315343d9e50f75294957847ab |

### Pieces
| Destination | Source | SHA256 |
|-------------|--------|--------|
| `data/pieces/pieces_fcc_v1.json` | `tests/data/pieces/pieces_fcc_v1.json` | 6c7d54ade07e3df42409238f4cf88b18b7a497a9 |

### Status & Events (Generated Examples)
| Destination | Source | Description |
|-------------|--------|-------------|
| `data/examples/status/example_status.json` | Generated | Example based on upstream schema structure |
| `data/examples/events/example_events.jsonl` | Generated | Example JSONL format based on upstream docs |

## Verification
All SHA256 hashes match the upstream repository at tag v1.6.0.  
Files are exact copies with attribution headers added where appropriate.

## Schema References
- **Container Format**: See upstream `docs/CONTAINER_STANDARD.md`
- **Status Schema**: See upstream `docs/schemas/status_snapshot.v2.json`  
- **Event Format**: See upstream documentation for JSONL event logs
- **Piece Format**: See upstream `tests/data/pieces/` examples

## Notes
- Only minimal reference set imported (2 containers, 1 piece library)
- Status and event files are examples based on schema documentation
- No engine code or algorithms imported
- All files maintain upstream attribution and licensing
