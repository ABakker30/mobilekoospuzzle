// UI-only port; engines remain upstream.
// FCC coordinate transforms for mobile puzzle shape editor

export interface FCCCoord {
  x: number;
  y: number;
  z: number;
}

export interface WorldCoord {
  x: number;
  y: number;
  z: number;
}

/**
 * Convert FCC lattice coordinates to world space for Three.js rendering
 * FCC lattice has basis vectors: (1,1,0), (1,0,1), (0,1,1) scaled by 0.5
 */
export function fccToWorld(fcc: FCCCoord): WorldCoord {
  // FCC to Cartesian transformation
  // Based on FCC lattice structure from upstream
  const scale = 0.8; // Spacing for visualization
  
  return {
    x: (fcc.x + fcc.y) * scale * 0.5,
    y: (fcc.x + fcc.z) * scale * 0.5,
    z: (fcc.y + fcc.z) * scale * 0.5
  };
}

/**
 * Convert world coordinates back to FCC lattice coordinates
 * Used for click-to-add functionality
 */
export function worldToFCC(world: WorldCoord): FCCCoord {
  const scale = 0.8;
  const invScale = 1.0 / (scale * 0.5);
  
  // Inverse transformation - approximate to nearest lattice point
  const a = world.x * invScale;
  const b = world.y * invScale;
  const c = world.z * invScale;
  
  // Solve the system: x+y=a, x+z=b, y+z=c
  const x = (a + b - c) * 0.5;
  const y = (a - b + c) * 0.5;
  const z = (-a + b + c) * 0.5;
  
  return {
    x: Math.round(x),
    y: Math.round(y),
    z: Math.round(z)
  };
}

/**
 * Snap world coordinates to nearest valid FCC lattice point
 */
export function snapToFCCLattice(world: WorldCoord): FCCCoord {
  return worldToFCC(world);
}

/**
 * Check if FCC coordinate is valid (sum must be even for FCC lattice)
 */
export function isValidFCCCoord(fcc: FCCCoord): boolean {
  return (fcc.x + fcc.y + fcc.z) % 2 === 0;
}

/**
 * Get rhombohedral FCC lattice neighbors for connectivity checking
 * Returns 6 neighbors as used in V1 - this is correct for rhombohedral FCC in engine coordinates
 */
export function getFCCNeighbors(fcc: FCCCoord): FCCCoord[] {
  const neighbors: FCCCoord[] = [];
  
  // 6 nearest neighbors in rhombohedral lattice
  const offsets = [
    [1, 0, 0], [-1, 0, 0],  // ±x direction
    [0, 1, 0], [0, -1, 0],  // ±y direction  
    [0, 0, 1], [0, 0, -1]   // ±z direction
  ];
  
  for (const [dx, dy, dz] of offsets) {
    const neighbor = {
      x: fcc.x + dx,
      y: fcc.y + dy,
      z: fcc.z + dz
    };
    neighbors.push(neighbor);
    console.log(`  FCC offset [${dx},${dy},${dz}] -> Engine(${neighbor.x},${neighbor.y},${neighbor.z})`);
  }
  
  console.log(`Generated ${neighbors.length} FCC neighbors for (${fcc.x}, ${fcc.y}, ${fcc.z})`);
  return neighbors; // Always return all 6
}

/**
 * Center and normalize FCC coordinates for display
 */
export function centerFCCCoords(coords: FCCCoord[]): FCCCoord[] {
  if (coords.length === 0) return [];
  
  // Find bounding box
  const minX = Math.min(...coords.map(c => c.x));
  const minY = Math.min(...coords.map(c => c.y));
  const minZ = Math.min(...coords.map(c => c.z));
  const maxX = Math.max(...coords.map(c => c.x));
  const maxY = Math.max(...coords.map(c => c.y));
  const maxZ = Math.max(...coords.map(c => c.z));
  
  // Center coordinates
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;
  
  return coords.map(coord => ({
    x: coord.x - centerX,
    y: coord.y - centerY,
    z: coord.z - centerZ
  }));
}
