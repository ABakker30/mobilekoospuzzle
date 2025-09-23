# Day 1 Starter Guide: Framework-First Implementation

## 🎯 Today's Mission: Project Setup & Core Types

**Goal**: Set up the V2 development environment and create the foundational type system for the unified workspace.

**Time Estimate**: 2-4 hours

## 📋 Prerequisites

- Your excellent V1 codebase is working perfectly ✅
- You understand the framework-first approach ✅
- You have the comprehensive documentation ready ✅

## 🚀 Step-by-Step Implementation

### **Step 1: Create Development Branch (5 minutes)**

```bash
# Navigate to your project directory
cd c:\Projects\mobilekoospuzzle

# Create and switch to v2-development branch
git checkout -b v2-development

# Verify you're on the new branch
git branch
# Should show: * v2-development

# Push the new branch to remote
git push -u origin v2-development
```

### **Step 2: Install Additional Dependencies (10 minutes)**

```bash
# Testing framework (essential for V2 quality)
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev jest-environment-jsdom

# State management (lightweight and powerful)
npm install zustand

# Utility for conditional CSS classes
npm install clsx

# Verify installations
npm list --depth=0
```

### **Step 3: Create Directory Structure (5 minutes)**

```bash
# Create workspace components directory
mkdir -p src/components/workspace

# Create modes directory
mkdir -p src/components/modes/PuzzleShapeMode
mkdir -p src/components/modes/AutoSolveMode  
mkdir -p src/components/modes/ManualSolveMode
mkdir -p src/components/modes/ViewSolutionMode

# Create workspace-specific hooks and services
mkdir -p src/hooks/workspace
mkdir -p src/services/workspace

# Verify structure
tree src/components/workspace src/components/modes
```

### **Step 4: Create Core Type Definitions (30 minutes)**

Create the foundational type system that will power the entire unified workspace:

**File**: `src/types/workspace.ts`

```typescript
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
```

### **Step 5: Create Basic Mode Placeholder Components (45 minutes)**

Create placeholder components for each mode that we'll implement properly later:

**File**: `src/components/modes/PuzzleShapeMode/index.tsx`

```typescript
import React from 'react';
import { ModeToolbarProps, ModeViewerProps } from '../../../types/workspace';

export const PuzzleShapeToolbar: React.FC<ModeToolbarProps> = ({
  settings,
  onSettingsChange,
  modeState,
  onModeStateChange
}) => {
  return (
    <div style={{ padding: '1rem', background: '#f8f9fa' }}>
      <h3 style={{ margin: 0, color: '#007bff' }}>🧩 Puzzle Shape Mode</h3>
      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6c757d' }}>
        Create and edit 3D puzzle shapes • V1 features will be ported here
      </p>
    </div>
  );
};

export const PuzzleShapeViewer: React.FC<ModeViewerProps> = ({
  coordinates,
  settings,
  modeState,
  onCoordinatesChange,
  onModeStateChange
}) => {
  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #007bff20, #007bff10)',
      color: '#007bff'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🧩</div>
        <h2>Puzzle Shape Mode</h2>
        <p>Your excellent V1 ShapeEditor3D will be integrated here</p>
        <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
          Coordinates: {coordinates.length} • Settings: {Object.keys(settings).length}
        </p>
      </div>
    </div>
  );
};
```

**File**: `src/components/modes/AutoSolveMode/index.tsx`

```typescript
import React from 'react';
import { ModeToolbarProps, ModeViewerProps } from '../../../types/workspace';

export const AutoSolveToolbar: React.FC<ModeToolbarProps> = ({
  settings,
  onSettingsChange,
  modeState,
  onModeStateChange
}) => {
  return (
    <div style={{ padding: '1rem', background: '#f8f9fa' }}>
      <h3 style={{ margin: 0, color: '#6f42c1' }}>🤖 Auto Solve Mode</h3>
      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6c757d' }}>
        Automated puzzle solving with DFS, DLX, and custom algorithms
      </p>
    </div>
  );
};

export const AutoSolveViewer: React.FC<ModeViewerProps> = ({
  coordinates,
  settings,
  modeState,
  onCoordinatesChange,
  onModeStateChange
}) => {
  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #6f42c120, #6f42c110)',
      color: '#6f42c1'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🤖</div>
        <h2>Auto Solve Mode</h2>
        <p>AI-powered automated puzzle solving</p>
        <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
          Ready for solver engine integration
        </p>
      </div>
    </div>
  );
};
```

**File**: `src/components/modes/ManualSolveMode/index.tsx`

```typescript
import React from 'react';
import { ModeToolbarProps, ModeViewerProps } from '../../../types/workspace';

export const ManualSolveToolbar: React.FC<ModeToolbarProps> = ({
  settings,
  onSettingsChange,
  modeState,
  onModeStateChange
}) => {
  return (
    <div style={{ padding: '1rem', background: '#f8f9fa' }}>
      <h3 style={{ margin: 0, color: '#fd7e14' }}>🎮 Manual Solve Mode</h3>
      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6c757d' }}>
        Interactive puzzle solving with piece manipulation
      </p>
    </div>
  );
};

export const ManualSolveViewer: React.FC<ModeViewerProps> = ({
  coordinates,
  settings,
  modeState,
  onCoordinatesChange,
  onModeStateChange
}) => {
  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #fd7e1420, #fd7e1410)',
      color: '#fd7e14'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎮</div>
        <h2>Manual Solve Mode</h2>
        <p>Interactive puzzle solving experience</p>
        <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
          Drag & drop piece placement system
        </p>
      </div>
    </div>
  );
};
```

**File**: `src/components/modes/ViewSolutionMode/index.tsx`

```typescript
import React from 'react';
import { ModeToolbarProps, ModeViewerProps } from '../../../types/workspace';

export const ViewSolutionToolbar: React.FC<ModeToolbarProps> = ({
  settings,
  onSettingsChange,
  modeState,
  onModeStateChange
}) => {
  return (
    <div style={{ padding: '1rem', background: '#f8f9fa' }}>
      <h3 style={{ margin: 0, color: '#28a745' }}>👁️ View Solution Mode</h3>
      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6c757d' }}>
        Browse and analyze puzzle solutions • Enhanced V1 solution viewer
      </p>
    </div>
  );
};

export const ViewSolutionViewer: React.FC<ModeViewerProps> = ({
  coordinates,
  settings,
  modeState,
  onCoordinatesChange,
  onModeStateChange
}) => {
  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #28a74520, #28a74510)',
      color: '#28a745'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👁️</div>
        <h2>View Solution Mode</h2>
        <p>Enhanced solution browsing and analysis</p>
        <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
          Your V1 solution viewer will be enhanced here
        </p>
      </div>
    </div>
  );
};
```

### **Step 6: Test and Commit (15 minutes)**

```bash
# Verify TypeScript compilation
npm run build

# Check for any type errors
npx tsc --noEmit

# Commit your Day 1 progress
git add .
git commit -m "feat: Day 1 - Core workspace types and mode placeholders

- Created comprehensive WorkspaceSettings and WorkspaceState types
- Defined ModeToolbarProps and ModeViewerProps interfaces  
- Added placeholder components for all 4 workspace modes
- Established directory structure for unified workspace
- Installed additional dependencies (zustand, clsx, testing-library)

Ready for Day 2: WorkspaceProvider and state management"

git push origin v2-development
```

## ✅ Day 1 Success Checklist

- [ ] **v2-development branch created** and pushed to remote
- [ ] **Dependencies installed** (testing-library, zustand, clsx)
- [ ] **Directory structure created** (workspace/, modes/)
- [ ] **Core types defined** in `src/types/workspace.ts`
- [ ] **Mode placeholders created** for all 4 modes
- [ ] **TypeScript compilation successful** with no errors
- [ ] **Git commit made** with clear progress description

## 🎯 What You've Accomplished

1. **Solid Foundation**: Type-safe workspace architecture defined
2. **Mode System**: Placeholder for all 4 unified workspace modes
3. **Extensible Design**: Easy to add new modes and settings
4. **V1 Compatibility**: Settings structure preserves your excellent V1 features
5. **Development Ready**: Clean branch and dependencies for Day 2

## 🚀 Tomorrow: Day 2 Preview

**Day 2 Goal**: Create `WorkspaceProvider` with state management and mode registry

**Key Components**:
- `WorkspaceProvider.tsx` - Context and state management
- `modeRegistry.ts` - Mode configuration and registration
- State management with React Context + useReducer
- Settings persistence integration

**Time Estimate**: 3-4 hours

---

**🎉 Congratulations! You've laid the foundation for the unified workspace. The type system you created today will power the entire V2 architecture. Ready for Day 2?** 🚀
