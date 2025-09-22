// Solution Data Types
// Types for solution file format and rendering

import { FCCCoord } from '../lib/coords/fcc';

// Solution file format (standardized ijk-only format)
export interface SolutionFile {
  version: number;
  containerCidSha256: string;
  lattice: 'fcc';
  piecesUsed: Record<string, number>; // {"A": 1, "B": 1, ...}
  placements: SolutionPlacement[];
  sid_state_sha256?: string;
  sid_route_sha256?: string;
  sid_state_canon_sha256?: string;
  mode?: string;
  solver?: {
    engine: string;
    seed: number;
    flags: Record<string, boolean>;
  };
}

// Individual piece placement in solution
export interface SolutionPlacement {
  piece: string; // Piece ID (A, B, C, ...)
  ori: number;   // Orientation
  t: FCCCoord;   // Translation
  cells_ijk: FCCCoord[]; // 4 cells forming the tetromino
}

// Piece rendering data
export interface PieceRenderData {
  id: string;
  color: string;
  visible: boolean;
  cells: FCCCoord[];
}

// Solution settings for UI
export interface SolutionSettings {
  pieceColors: Record<string, string>; // {"A": "#ff0000", "B": "#00ff00", ...}
  visiblePieceCount: number; // 0 to total pieces
  brightness: number;
  backgroundColor: string;
  metalness: number; // 0.0 to 1.0
  reflectiveness: number; // 0.0 to 1.0
  transparency: number; // 0.0 to 1.0
  camera: {
    orthographic: boolean;
    focalLength: number;
  };
}

// Professional color palette for distinct piece visualization
// Based on ColorBrewer qualitative palette optimized for accessibility
export const DEFAULT_PIECE_COLORS: Record<string, string> = {
  'A': '#e41a1c', // Vibrant Red
  'B': '#377eb8', // Strong Blue
  'C': '#4daf4a', // Fresh Green
  'D': '#984ea3', // Rich Purple
  'E': '#ff7f00', // Bright Orange
  'F': '#ffff33', // Vivid Yellow
  'G': '#a65628', // Warm Brown
  'H': '#f781bf', // Soft Pink
  'I': '#999999', // Neutral Gray
  'J': '#1f78b4', // Deep Blue
  'K': '#33a02c', // Forest Green
  'L': '#e31a1c', // Crimson Red
  'M': '#fdbf6f', // Light Orange
  'N': '#ff7f00', // Tangerine
  'O': '#cab2d6', // Lavender
  'P': '#6a3d9a', // Deep Purple
  'Q': '#b15928', // Chocolate
  'R': '#fb9a99', // Light Pink
  'S': '#a6cee3', // Sky Blue
  'T': '#b2df8a', // Light Green
  'U': '#ffd92f', // Golden Yellow
  'V': '#e78ac3', // Rose Pink
  'W': '#8dd3c7', // Mint Green
  'X': '#bebada', // Pale Purple
  'Y': '#fb8072', // Coral
  'Z': '#80b1d3'  // Powder Blue
};

// Generate default solution settings
export function createDefaultSolutionSettings(piecesUsed: Record<string, number>): SolutionSettings {
  const pieceColors: Record<string, string> = {};
  
  // Assign default colors to pieces
  Object.keys(piecesUsed).forEach(pieceId => {
    pieceColors[pieceId] = DEFAULT_PIECE_COLORS[pieceId] || '#888888';
  });
  
  return {
    pieceColors,
    visiblePieceCount: Object.keys(piecesUsed).length, // All pieces visible by default
    brightness: 1.0,
    backgroundColor: '#f0f0f0',
    metalness: 0.0,
    reflectiveness: 0.0,
    transparency: 0.0,
    camera: {
      orthographic: false,
      focalLength: 50
    }
  };
}
