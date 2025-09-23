# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for Koos Puzzle V2. ADRs document the architectural decisions made during development, including the context, decision, and consequences.

## ADR Format

Each ADR follows this structure:
- **Title**: Short noun phrase describing the decision
- **Status**: Proposed, Accepted, Deprecated, or Superseded
- **Context**: The issue motivating this decision
- **Decision**: The change we're proposing or have agreed to implement
- **Consequences**: What becomes easier or more difficult to do because of this change

## Current ADRs

### Core Architecture
- [ADR-001: FCC Coordinate System Decoupling](./001-fcc-coordinates.md)
- [ADR-002: CID-Based Data Contracts](./002-cid-contracts.md)
- [ADR-003: Unified Workspace Architecture](./003-unified-workspace.md)

### Development Approach
- [ADR-004: Test-Driven Development Strategy](./004-test-driven-development.md)
- [ADR-005: Component Reusability Pattern](./005-component-reusability.md)

### Data Management
- [ADR-006: Metadata Separation Strategy](./006-metadata-separation.md)
- [ADR-007: Symmetry Analysis Integration](./007-symmetry-analysis.md)

## Creating New ADRs

When making significant architectural decisions:

1. Create a new ADR file: `XXX-short-title.md`
2. Use the next sequential number
3. Follow the standard ADR format
4. Get review and approval before implementation
5. Update this README with the new ADR

## ADR Status Lifecycle

- **Proposed**: Decision is under consideration
- **Accepted**: Decision has been approved and is being implemented
- **Deprecated**: Decision is no longer recommended but may still be in use
- **Superseded**: Decision has been replaced by a newer ADR
