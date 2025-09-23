import { FCCCoord } from '../lib/coords/fcc';

export type WorkspaceModeId = 'shape' | 'auto-solve' | 'manual-solve' | 'view-solution';

export interface WorkspaceSettings {
  // 3D Viewer Settings (from your excellent V1)
  brightness: number;
  backgroundColor: string;
  
  // Camera Settings (preserving V1 functionality)
  camera: {
    orthographic: boolean;
    focalLength: number;
  };
  
  // Material Settings (your PBR system)
  material: {
    type: 'standard' | 'pbr-gold' | 'pbr-steel' | 'pbr-brushed';
    color: string;
    metalness: number;
    transparency: number;
    reflectiveness: number;
  };
  
  // Mode-specific settings (extensible)
  modes: {
    [K in WorkspaceModeId]: Record<string, any>;
  };
}

export interface WorkspaceState {
  currentMode: WorkspaceModeId;
  settings: WorkspaceSettings;
  
  // Shape data (from V1)
  coordinates: FCCCoord[];
  
  // Mode-specific state (for each mode's unique needs)
  modeState: {
    [K in WorkspaceModeId]: Record<string, any>;
  };
}

// Props for mode toolbar components
export interface ModeToolbarProps {
  settings: WorkspaceSettings;
  onSettingsChange: (settings: Partial<WorkspaceSettings>) => void;
  modeState: Record<string, any>;
  onModeStateChange: (state: Record<string, any>) => void;
}

// Props for mode viewer components  
export interface ModeViewerProps {
  coordinates: FCCCoord[];
  settings: WorkspaceSettings;
  modeState: Record<string, any>;
  onCoordinatesChange: (coordinates: FCCCoord[]) => void;
  onModeStateChange: (state: Record<string, any>) => void;
}

// Mode configuration interface
export interface WorkspaceMode {
  id: WorkspaceModeId;
  name: string;
  displayName: string;
  color: string;
  icon: string;
  toolbar: React.ComponentType<ModeToolbarProps>;
  viewer: React.ComponentType<ModeViewerProps>;
  settings: Record<string, any>;
}

// Default settings based on your V1 excellence
export const defaultWorkspaceSettings: WorkspaceSettings = {
  brightness: 1.0,
  backgroundColor: '#ffffff',
  camera: {
    orthographic: false,
    focalLength: 50
  },
  material: {
    type: 'standard',
    color: '#4a90e2',
    metalness: 0.1,
    transparency: 0.0,
    reflectiveness: 0.5
  },
  modes: {
    'shape': {
      editMode: 'add',
      editingEnabled: true,
      showNeighbors: true
    },
    'auto-solve': {
      solverEngine: 'dfs',
      showProgress: true,
      animateSteps: true
    },
    'manual-solve': {
      showHints: false,
      pieceInventory: true,
      snapToGrid: true
    },
    'view-solution': {
      showPieceLabels: true,
      colorScheme: 'rainbow',
      animateAssembly: false
    }
  }
};
