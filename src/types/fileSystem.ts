// Unified File I/O System Types
export interface CellRecord {
  // Engine coordinates (FCC rhombohedral, integer)
  i: number;
  j: number; 
  k: number;
  
  // World coordinates (oriented, 3-digit precision)
  x: number;
  y: number;
  z: number;
}

// File type enumeration
export enum FileType {
  CONTAINER = 'container',
  SOLUTION = 'solution', 
  STATUS = 'status'
}

// Container file format (shapes)
export interface ContainerFile {
  version: string;
  lattice: 'fcc';
  cells: number[][]; // [i, j, k] coordinates
  cid?: string;
  designer?: {
    name: string;
    date: string;
  };
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    difficulty?: number;
  };
}

// Solution file format
export interface SolutionFile {
  version: string;
  containerCid: string;
  pieces: {
    id: string;
    type: string;
    coordinates: number[][];
    rotation?: number[];
    position?: number[];
  }[];
  metadata?: {
    solver?: string;
    solveTime?: number;
    algorithm?: string;
    steps?: number;
  };
}

// Status file format (save states, progress)
export interface StatusFile {
  version: string;
  mode: string;
  containerCid?: string;
  solutionCid?: string;
  progress: {
    currentStep?: number;
    totalSteps?: number;
    completedPieces?: string[];
    timeElapsed?: number;
  };
  userState: Record<string, any>;
  timestamp: string;
}

// Orientation data from convex hull analysis
export interface OrientationData {
  orientationMatrix: number[]; // 4x4 matrix as flat array
  largestFaceArea: number;
  largestFaceNormal: [number, number, number];
  largestFaceCentroid: [number, number, number];
  coordinateCount: number;
}

// Unified file interface
export interface UnifiedFile {
  type: FileType;
  name: string;
  path: string;
  size: number;
  lastModified: Date;
  content: ContainerFile | SolutionFile | StatusFile;
  orientation?: OrientationData; // Auto-calculated hull orientation
}

// File browser options
export interface FileBrowserOptions {
  supportedTypes: FileType[];
  multiSelect?: boolean;
  showPreview?: boolean;
  filterByMode?: string;
}

// File save options
export interface FileSaveOptions {
  type: FileType;
  suggestedName?: string;
  metadata?: Record<string, any>;
  overwrite?: boolean;
}
