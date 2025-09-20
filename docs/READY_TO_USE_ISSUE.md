# Ready-to-Use GitHub Issue & Session Charter

## GitHub Issue Template (Copy-Paste to GitHub)

**Title**: Data – Import Reference Examples from ballpuzzle4

**Body**:
```markdown
## Goal
Import a minimal, authoritative reference set (schemas + examples + docs pointers) from the latest Git tag of ABakker30/ballpuzzle4 into this repo for read-only use by our viewers/editors.

## Scope
Create/update only these files/folders:
- docs/WORKFLOWS.md (append CLI usage & links)
- docs/DATA_FORMATS.md (append short field maps & links)
- data/README.md (explain provenance, upstream canonical)
- data/examples/containers/ (1–3 minimal v1 containers)
- data/examples/solutions/ (matching solutions if present)
- data/examples/status/ (1–2 sample status.json)
- data/examples/events/ (1–2 sample events.jsonl)
- data/pieces/ (only piece/rotation spec files if present)
- docs/EXTRACTION_LOG.md (record tag, commit, file list, SHA256 hashes)

## Constraints
- Diff ≤ 200 LOC
- New files ≤ 12
- No dependency changes
- No engine code
- No schema redefinition (link upstream docs instead)

## Acceptance Criteria
- Imported data files present under data/examples/…
- data/README.md explains provenance & MIT license
- docs/EXTRACTION_LOG.md contains tag, commit hash, file list, SHA256 for each file
- docs/WORKFLOWS.md shows CLI usage examples (solve, verify, status, events) with exit codes 0/2 explained
- docs/DATA_FORMATS.md links to upstream schemas/docs (no duplication)
- No engine code added, no deps touched

## References
- Container v1 schema & CID invariants
- CLI usage (solve + verify) and exit codes
- Status JSON emission for monitoring
- Symmetry handling (24 FCC rotations, upstream only)
```

---

## Windsurf Session Charter (Copy-Paste to Windsurf)

```
**Windsurf Session Charter — Import from ballpuzzle4**

Goal (single): Import a minimal set of reference data (schemas, containers v1, solutions, status, events, piece specs) from the latest Git tag of ABakker30/ballpuzzle4 into this repo for read-only use by our viewers/editors.

Scope (allowed edits):
Create/update only:
- docs/WORKFLOWS.md
- docs/DATA_FORMATS.md
- docs/EXTRACTION_LOG.md
- data/README.md
- data/examples/{containers,solutions,status,events}/
- data/pieces/ (spec files only, if present)
- New files ≤ 12
- Diff size ≤ 200 LOC
- No dependency changes

Non-goals (forbidden):
- No engine code (Python, solvers, heuristics, symmetry logic).
- No new schemas (must link upstream).
- No changes to build/CI/dependencies.

Artifacts required:
- data/README.md → explain provenance, MIT license, upstream is canonical.
- docs/EXTRACTION_LOG.md → tag, commit hash, file list, SHA256 checksums.
- docs/WORKFLOWS.md → append CLI usage (solve, verify, status, events) + exit codes.
- docs/DATA_FORMATS.md → append short descriptions + links upstream.

Exit criteria:
- Imported minimal data present under data/examples/.
- Docs updated with provenance and upstream links.
- No code drift into engine logic.
- PR created with checklist completed.

If Windsurf proposes anything outside scope: "Decline and restate scope."
```

---

## Usage Instructions

1. **Copy the GitHub Issue** section above and paste it into a new GitHub issue
2. **Start Windsurf session** on that issue
3. **Copy the Session Charter** section above and paste it as your first message to Windsurf
4. **Let Windsurf execute** the structured import within the constraints
5. **Review the PR** using the template checklist

This will give you a clean, traceable import of reference data from ballpuzzle4 with full provenance tracking.
