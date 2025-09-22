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
  camera: {
    orthographic: boolean;
    focalLength: number;
  };
}

// Default piece colors (distinct colors for each piece)
export const DEFAULT_PIECE_COLORS: Record<string, string> = {
  'A': '#FF0000', // Red
  'B': '#00FF00', // Green  
  'C': '#0000FF', // Blue
  'D': '#FFFF00', // Yellow
  'E': '#FF00FF', // Magenta
  'F': '#00FFFF', // Cyan
  'G': '#FFA500', // Orange
  'H': '#800080', // Purple
  'I': '#FFC0CB', // Pink
  'J': '#A52A2A', // Brown
  'K': '#808080', // Gray
  'L': '#000080', // Navy
  'M': '#008000', // Dark Green
  'N': '#800000', // Maroon
  'O': '#808000', // Olive
  'P': '#FF6347', // Tomato
  'Q': '#4682B4', // Steel Blue
  'R': '#D2691E', // Chocolate
  'S': '#FF1493', // Deep Pink
  'T': '#00CED1', // Dark Turquoise
  'U': '#FFD700', // Gold
  'V': '#ADFF2F', // Green Yellow
  'W': '#FF69B4', // Hot Pink
  'X': '#CD853F', // Peru
  'Y': '#DDA0DD', // Plum
  'Z': '#98FB98'  // Pale Green
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
    camera: {
      orthographic: false,
      focalLength: 50
    }
  };
}
