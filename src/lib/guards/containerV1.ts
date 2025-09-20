// UI-only port; engines remain upstream.
// Light JSON guard for v1 container format

export interface ContainerV1 {
  version?: string;
  lattice?: string;
  cells?: number[][];
  coordinates?: number[][]; // Alternative field name
  cid?: string;
  designer?: {
    name?: string;
    date?: string;
    email?: string;
  };
  name?: string;
  description?: string;
}

/**
 * Validate container v1 format with clear error messages
 */
export function validateContainerV1(data: any): { valid: boolean; error?: string; container?: ContainerV1 } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid JSON: not an object' };
  }

  // Check lattice type
  if (data.lattice && data.lattice !== 'fcc') {
    return { valid: false, error: `Unsupported lattice type: ${data.lattice}. Only 'fcc' is supported.` };
  }

  // Check for coordinate data (cells or coordinates field)
  const coords = data.cells || data.coordinates;
  if (!coords) {
    return { valid: false, error: 'Missing coordinate data. Expected "cells" or "coordinates" field.' };
  }

  if (!Array.isArray(coords)) {
    return { valid: false, error: 'Coordinates must be an array' };
  }

  if (coords.length === 0) {
    return { valid: false, error: 'Container cannot be empty' };
  }

  // Validate coordinate format
  for (let i = 0; i < coords.length; i++) {
    const coord = coords[i];
    if (!Array.isArray(coord) || coord.length !== 3) {
      return { valid: false, error: `Invalid coordinate at index ${i}: expected [x, y, z] array` };
    }
    
    if (!coord.every(n => typeof n === 'number' && Number.isInteger(n))) {
      return { valid: false, error: `Invalid coordinate at index ${i}: expected integer values` };
    }
  }

  // Validate CID format if present
  if (data.cid && !/^sha256:[a-f0-9]{64}$/.test(data.cid)) {
    return { valid: false, error: 'Invalid CID format. Expected sha256:... with 64 hex characters.' };
  }

  // Validate version if present
  if (data.version && data.version !== '1.0') {
    return { valid: false, error: `Unsupported version: ${data.version}. Expected '1.0'.` };
  }

  return { 
    valid: true, 
    container: {
      version: data.version || '1.0',
      lattice: data.lattice || 'fcc',
      cells: coords,
      cid: data.cid,
      designer: data.designer,
      name: data.name,
      description: data.description
    }
  };
}

/**
 * Convert container to v1 format for saving
 */
export function containerToV1Format(
  coords: number[][], 
  name?: string, 
  cid?: string,
  designer?: { name?: string; date?: string; email?: string }
): ContainerV1 {
  const container: ContainerV1 = {
    version: '1.0',
    lattice: 'fcc',
    cells: coords
  };

  if (name) container.name = name;
  if (cid) container.cid = cid;
  if (designer) container.designer = designer;

  return container;
}
