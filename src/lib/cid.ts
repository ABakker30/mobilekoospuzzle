// UI-only port; engines remain upstream.
// CID computation using v1 canonicalization (24 FCC rotations + SHA-256)

import { FCCCoord } from './coords/fcc';

// 24 proper rotations for FCC lattice (from upstream symmetry_fcc.py)
const FCC_ROTATIONS = [
  // Identity and rotations around main axes
  [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
  [[0, 1, 0], [0, 0, 1], [1, 0, 0]],
  [[-1, 0, 0], [0, -1, 0], [0, 0, 1]],
  [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
  [[0, -1, 0], [0, 0, -1], [1, 0, 0]],
  [[1, 0, 0], [0, -1, 0], [0, 0, -1]],
  [[0, 0, 1], [-1, 0, 0], [0, -1, 0]],
  [[0, 1, 0], [0, 0, -1], [-1, 0, 0]],
  [[-1, 0, 0], [0, 1, 0], [0, 0, -1]],
  [[0, 0, -1], [1, 0, 0], [0, -1, 0]],
  [[0, -1, 0], [0, 0, 1], [-1, 0, 0]],
  // Additional rotations for complete FCC symmetry
  [[0, 1, 0], [1, 0, 0], [0, 0, -1]],
  [[0, 0, 1], [0, 1, 0], [-1, 0, 0]],
  [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
  [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
  [[0, 0, -1], [0, -1, 0], [1, 0, 0]],
  [[1, 0, 0], [0, 0, -1], [0, 1, 0]],
  [[0, 1, 0], [-1, 0, 0], [0, 0, 1]],
  [[0, 0, 1], [0, -1, 0], [-1, 0, 0]],
  [[-1, 0, 0], [0, 0, -1], [0, -1, 0]],
  [[0, -1, 0], [-1, 0, 0], [0, 0, -1]],
  [[0, 0, -1], [0, 1, 0], [1, 0, 0]],
  [[1, 0, 0], [0, 0, 1], [0, -1, 0]]
];

/**
 * Apply rotation matrix to FCC coordinate
 */
function applyRotation(coord: FCCCoord, rotation: number[][]): FCCCoord {
  return {
    x: rotation[0][0] * coord.x + rotation[0][1] * coord.y + rotation[0][2] * coord.z,
    y: rotation[1][0] * coord.x + rotation[1][1] * coord.y + rotation[1][2] * coord.z,
    z: rotation[2][0] * coord.x + rotation[2][1] * coord.y + rotation[2][2] * coord.z
  };
}

/**
 * Translate coordinates to have minimum at origin
 */
function translateToOrigin(coords: FCCCoord[]): FCCCoord[] {
  if (coords.length === 0) return [];
  
  const minX = Math.min(...coords.map(c => c.x));
  const minY = Math.min(...coords.map(c => c.y));
  const minZ = Math.min(...coords.map(c => c.z));
  
  return coords.map(coord => ({
    x: coord.x - minX,
    y: coord.y - minY,
    z: coord.z - minZ
  }));
}

/**
 * Convert coordinates to canonical string for hashing
 */
function coordsToString(coords: FCCCoord[]): string {
  return coords
    .map(c => `${c.x},${c.y},${c.z}`)
    .sort()
    .join('|');
}

/**
 * Generate all 24 rotations of the coordinate set
 */
function generateRotations(coords: FCCCoord[]): string[] {
  const rotations: string[] = [];
  
  for (const rotation of FCC_ROTATIONS) {
    const rotated = coords.map(coord => applyRotation(coord, rotation));
    const translated = translateToOrigin(rotated);
    const canonical = coordsToString(translated);
    rotations.push(canonical);
  }
  
  return rotations;
}

/**
 * Compute CID using v1 canonicalization algorithm
 * 1. Generate all 24 FCC rotations
 * 2. Translate each to origin
 * 3. Pick lexicographically smallest
 * 4. SHA-256 hash
 */
export async function computeCID(coords: FCCCoord[]): Promise<string> {
  if (coords.length === 0) return 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // Empty SHA-256
  
  // Generate all rotations and find canonical form
  const rotations = generateRotations(coords);
  const canonical = rotations.sort()[0]; // Lexicographically smallest
  
  // Compute SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `sha256:${hashHex}`;
}

/**
 * Compute short CID for display (first 8 characters)
 */
export async function computeShortCID(coords: FCCCoord[]): Promise<string> {
  const fullCID = await computeCID(coords);
  return fullCID.substring(7, 15); // Skip "sha256:" prefix, take 8 chars
}

/**
 * Validate CID format
 */
export function isValidCID(cid: string): boolean {
  return /^sha256:[a-f0-9]{64}$/.test(cid);
}
