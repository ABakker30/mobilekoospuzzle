# Framework-First Implementation Plan

## 🎯 Strategic Decision: Build V2 Framework First

**Approach**: Create the unified workspace architecture from scratch, then port your excellent V1 features into the new framework.

**Rationale**: Your V1 mobile editing is already perfect. Rather than risk breaking it with complex extraction, we'll build the V2 container that deserves your proven functionality.

## 🏗️ Framework Architecture Overview

### **Core Components**
```
src/components/workspace/
├── UnifiedWorkspace.tsx          # Main container & orchestrator
├── WorkspaceHeader.tsx           # Mode selector & branding
├── WorkspaceViewer.tsx           # 3D viewport container
├── WorkspaceToolbar.tsx          # Dynamic mode-specific toolbar
├── WorkspaceSettings.tsx         # Unified settings modal
└── WorkspaceProvider.tsx         # Context & state management

src/components/modes/
├── PuzzleShapeMode/             # Shape creation & editing
├── AutoSolveMode/               # Automated puzzle solving
├── ManualSolveMode/             # Interactive puzzle solving
└── ViewSolutionMode/            # Solution browsing & analysis

src/types/workspace.ts           # Core type definitions
src/hooks/workspace/             # Workspace-specific hooks
src/services/workspace/          # Workspace services
```

### **Mode System Architecture**
```typescript
interface WorkspaceMode {
  id: 'shape' | 'auto-solve' | 'manual-solve' | 'view-solution';
  name: string;
  displayName: string;
  color: string;
  icon: string;
  toolbar: React.ComponentType<ModeToolbarProps>;
  viewer: React.ComponentType<ModeViewerProps>;
  settings: ModeSettingsConfig;
}
```

## 📅 Week-by-Week Implementation Plan

### **Week 1: Core Framework Foundation**

#### **Day 1: Project Setup & Core Types**

##### **1.1 Create v2-development Branch**
```bash
git checkout -b v2-development
git push -u origin v2-development
```

##### **1.2 Install Additional Dependencies**
```bash
# Testing framework
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev jest-environment-jsdom

# State management (if needed)
npm install zustand

# Additional utilities
npm install clsx
```

##### **1.3 Create Core Type Definitions**
**File**: `src/types/workspace.ts`
```typescript
export type WorkspaceModeId = 'shape' | 'auto-solve' | 'manual-solve' | 'view-solution';

export interface WorkspaceSettings {
  // 3D Viewer Settings
  brightness: number;
  backgroundColor: string;
  
  // Camera Settings
  camera: {
    orthographic: boolean;
    focalLength: number;
  };
  
  // Material Settings
  material: {
    type: 'standard' | 'pbr-gold' | 'pbr-steel' | 'pbr-brushed';
    color: string;
    metalness: number;
    transparency: number;
    reflectiveness: number;
  };
  
  // Mode-specific settings
  modes: {
    [K in WorkspaceModeId]: Record<string, any>;
  };
}

export interface WorkspaceState {
  currentMode: WorkspaceModeId;
  settings: WorkspaceSettings;
  // Shape data
  coordinates: FCCCoord[];
  // Mode-specific state
  modeState: {
    [K in WorkspaceModeId]: Record<string, any>;
  };
}

export interface ModeToolbarProps {
  settings: WorkspaceSettings;
  onSettingsChange: (settings: Partial<WorkspaceSettings>) => void;
  modeState: Record<string, any>;
  onModeStateChange: (state: Record<string, any>) => void;
}

export interface ModeViewerProps {
  coordinates: FCCCoord[];
  settings: WorkspaceSettings;
  modeState: Record<string, any>;
  onCoordinatesChange: (coordinates: FCCCoord[]) => void;
  onModeStateChange: (state: Record<string, any>) => void;
}
```

#### **Day 2: Workspace Context & State Management**

##### **2.1 Create Workspace Context**
**File**: `src/components/workspace/WorkspaceProvider.tsx`
```typescript
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { WorkspaceState, WorkspaceSettings, WorkspaceModeId } from '../../types/workspace';
import { FCCCoord } from '../../lib/coords/fcc';

interface WorkspaceContextType {
  state: WorkspaceState;
  setMode: (mode: WorkspaceModeId) => void;
  updateSettings: (settings: Partial<WorkspaceSettings>) => void;
  updateCoordinates: (coordinates: FCCCoord[]) => void;
  updateModeState: (mode: WorkspaceModeId, state: Record<string, any>) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
};

// Default settings based on your V1 excellence
const defaultSettings: WorkspaceSettings = {
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
    'shape': {},
    'auto-solve': {},
    'manual-solve': {},
    'view-solution': {}
  }
};

type WorkspaceAction = 
  | { type: 'SET_MODE'; mode: WorkspaceModeId }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<WorkspaceSettings> }
  | { type: 'UPDATE_COORDINATES'; coordinates: FCCCoord[] }
  | { type: 'UPDATE_MODE_STATE'; mode: WorkspaceModeId; state: Record<string, any> };

const workspaceReducer = (state: WorkspaceState, action: WorkspaceAction): WorkspaceState => {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, currentMode: action.mode };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'UPDATE_COORDINATES':
      return { ...state, coordinates: action.coordinates };
    case 'UPDATE_MODE_STATE':
      return {
        ...state,
        modeState: {
          ...state.modeState,
          [action.mode]: { ...state.modeState[action.mode], ...action.state }
        }
      };
    default:
      return state;
  }
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(workspaceReducer, {
    currentMode: 'shape',
    settings: defaultSettings,
    coordinates: [],
    modeState: {
      'shape': {},
      'auto-solve': {},
      'manual-solve': {},
      'view-solution': {}
    }
  });

  const setMode = useCallback((mode: WorkspaceModeId) => {
    dispatch({ type: 'SET_MODE', mode });
  }, []);

  const updateSettings = useCallback((settings: Partial<WorkspaceSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', settings });
  }, []);

  const updateCoordinates = useCallback((coordinates: FCCCoord[]) => {
    dispatch({ type: 'UPDATE_COORDINATES', coordinates });
  }, []);

  const updateModeState = useCallback((mode: WorkspaceModeId, state: Record<string, any>) => {
    dispatch({ type: 'UPDATE_MODE_STATE', mode, state });
  }, []);

  return (
    <WorkspaceContext.Provider value={{
      state,
      setMode,
      updateSettings,
      updateCoordinates,
      updateModeState
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};
```

#### **Day 3: Mode Configuration & Registry**

##### **3.1 Create Mode Registry**
**File**: `src/components/workspace/modeRegistry.ts`
```typescript
import { WorkspaceMode } from '../../types/workspace';
import { PuzzleShapeToolbar, PuzzleShapeViewer } from '../modes/PuzzleShapeMode';
import { AutoSolveToolbar, AutoSolveViewer } from '../modes/AutoSolveMode';
import { ManualSolveToolbar, ManualSolveViewer } from '../modes/ManualSolveMode';
import { ViewSolutionToolbar, ViewSolutionViewer } from '../modes/ViewSolutionMode';

export const workspaceModes: Record<string, WorkspaceMode> = {
  'shape': {
    id: 'shape',
    name: 'shape',
    displayName: 'Puzzle Shape',
    color: '#007bff',
    icon: '🧩',
    toolbar: PuzzleShapeToolbar,
    viewer: PuzzleShapeViewer,
    settings: {
      showNeighbors: true,
      editingEnabled: true,
      editMode: 'add'
    }
  },
  'auto-solve': {
    id: 'auto-solve',
    name: 'auto-solve',
    displayName: 'Auto Solve',
    color: '#6f42c1',
    icon: '🤖',
    toolbar: AutoSolveToolbar,
    viewer: AutoSolveViewer,
    settings: {
      solverEngine: 'dfs',
      showProgress: true,
      animateSteps: true
    }
  },
  'manual-solve': {
    id: 'manual-solve',
    name: 'manual-solve',
    displayName: 'Manual Solve',
    color: '#fd7e14',
    icon: '🎮',
    toolbar: ManualSolveToolbar,
    viewer: ManualSolveViewer,
    settings: {
      showHints: false,
      pieceInventory: true,
      snapToGrid: true
    }
  },
  'view-solution': {
    id: 'view-solution',
    name: 'view-solution',
    displayName: 'View Solution',
    color: '#28a745',
    icon: '👁️',
    toolbar: ViewSolutionToolbar,
    viewer: ViewSolutionViewer,
    settings: {
      showPieceLabels: true,
      colorScheme: 'rainbow',
      animateAssembly: false
    }
  }
};

export const getModeConfig = (modeId: string): WorkspaceMode => {
  const mode = workspaceModes[modeId];
  if (!mode) {
    throw new Error(`Unknown workspace mode: ${modeId}`);
  }
  return mode;
};
```

#### **Day 4: Core Workspace Components**

##### **4.1 Create Workspace Header**
**File**: `src/components/workspace/WorkspaceHeader.tsx`
```typescript
import React from 'react';
import { useWorkspace } from './WorkspaceProvider';
import { workspaceModes } from './modeRegistry';
import { WorkspaceModeId } from '../../types/workspace';

export const WorkspaceHeader: React.FC = () => {
  const { state, setMode } = useWorkspace();
  const { currentMode } = state;

  return (
    <header className="workspace-header">
      <div className="workspace-brand">
        <h1>Koos Puzzle V2</h1>
        <span className="workspace-subtitle">Unified 3D Workspace</span>
      </div>
      
      <nav className="workspace-modes">
        {Object.values(workspaceModes).map((mode) => (
          <button
            key={mode.id}
            className={`mode-button ${currentMode === mode.id ? 'active' : ''}`}
            style={{ 
              '--mode-color': mode.color,
              backgroundColor: currentMode === mode.id ? mode.color : 'transparent',
              color: currentMode === mode.id ? 'white' : mode.color,
              borderColor: mode.color
            } as React.CSSProperties}
            onClick={() => setMode(mode.id as WorkspaceModeId)}
          >
            <span className="mode-icon">{mode.icon}</span>
            <span className="mode-name">{mode.displayName}</span>
          </button>
        ))}
      </nav>
    </header>
  );
};
```

##### **4.2 Create Dynamic Toolbar**
**File**: `src/components/workspace/WorkspaceToolbar.tsx`
```typescript
import React from 'react';
import { useWorkspace } from './WorkspaceProvider';
import { getModeConfig } from './modeRegistry';

export const WorkspaceToolbar: React.FC = () => {
  const { state, updateSettings, updateModeState } = useWorkspace();
  const { currentMode, settings } = state;
  
  const modeConfig = getModeConfig(currentMode);
  const ToolbarComponent = modeConfig.toolbar;
  
  const handleSettingsChange = (newSettings: Partial<typeof settings>) => {
    updateSettings(newSettings);
  };
  
  const handleModeStateChange = (newState: Record<string, any>) => {
    updateModeState(currentMode, newState);
  };

  return (
    <div className="workspace-toolbar" style={{ borderTopColor: modeConfig.color }}>
      <ToolbarComponent
        settings={settings}
        onSettingsChange={handleSettingsChange}
        modeState={state.modeState[currentMode]}
        onModeStateChange={handleModeStateChange}
      />
    </div>
  );
};
```

##### **4.3 Create Workspace Viewer Container**
**File**: `src/components/workspace/WorkspaceViewer.tsx`
```typescript
import React from 'react';
import { useWorkspace } from './WorkspaceProvider';
import { getModeConfig } from './modeRegistry';

export const WorkspaceViewer: React.FC = () => {
  const { state, updateCoordinates, updateModeState } = useWorkspace();
  const { currentMode, coordinates, settings } = state;
  
  const modeConfig = getModeConfig(currentMode);
  const ViewerComponent = modeConfig.viewer;
  
  const handleCoordinatesChange = (newCoordinates: typeof coordinates) => {
    updateCoordinates(newCoordinates);
  };
  
  const handleModeStateChange = (newState: Record<string, any>) => {
    updateModeState(currentMode, newState);
  };

  return (
    <div className="workspace-viewer">
      <ViewerComponent
        coordinates={coordinates}
        settings={settings}
        modeState={state.modeState[currentMode]}
        onCoordinatesChange={handleCoordinatesChange}
        onModeStateChange={handleModeStateChange}
      />
    </div>
  );
};
```

#### **Day 5: Main Unified Workspace**

##### **5.1 Create Main Workspace Component**
**File**: `src/components/workspace/UnifiedWorkspace.tsx`
```typescript
import React from 'react';
import { WorkspaceProvider } from './WorkspaceProvider';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceToolbar } from './WorkspaceToolbar';
import { WorkspaceViewer } from './WorkspaceViewer';
import './UnifiedWorkspace.css';

export const UnifiedWorkspace: React.FC = () => {
  return (
    <WorkspaceProvider>
      <div className="unified-workspace">
        <WorkspaceHeader />
        <div className="workspace-main">
          <WorkspaceViewer />
          <WorkspaceToolbar />
        </div>
      </div>
    </WorkspaceProvider>
  );
};
```

##### **5.2 Create Workspace Styles**
**File**: `src/components/workspace/UnifiedWorkspace.css`
```css
.unified-workspace {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.workspace-brand h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #212529;
}

.workspace-subtitle {
  font-size: 0.875rem;
  color: #6c757d;
}

.workspace-modes {
  display: flex;
  gap: 0.5rem;
}

.mode-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 2px solid;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.mode-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.mode-button.active {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.workspace-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.workspace-viewer {
  flex: 1;
  position: relative;
  background: white;
}

.workspace-toolbar {
  border-top: 3px solid;
  background: white;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .workspace-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .workspace-modes {
    width: 100%;
    justify-content: space-between;
  }
  
  .mode-button {
    flex: 1;
    justify-content: center;
    padding: 0.5rem;
    font-size: 0.875rem;
  }
  
  .mode-name {
    display: none;
  }
}
```

### **Week 1 Days 6-7: Mode Placeholders & Integration**

#### **6.1 Create Mode Placeholder Components**
Create basic placeholder components for each mode that will be replaced with full implementations:

**Files to create:**
- `src/components/modes/PuzzleShapeMode/index.ts`
- `src/components/modes/AutoSolveMode/index.ts`
- `src/components/modes/ManualSolveMode/index.ts`
- `src/components/modes/ViewSolutionMode/index.ts`

#### **6.2 Update Main App**
**File**: `src/App.tsx`
```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UnifiedWorkspace } from './components/workspace/UnifiedWorkspace';
import { HomePage } from './views/HomePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/workspace" element={<UnifiedWorkspace />} />
        {/* Keep existing V1 routes for compatibility */}
        <Route path="/puzzle-shape" element={<PuzzleShapePage />} />
        <Route path="/view-solution" element={<SolutionViewerPage />} />
      </Routes>
    </Router>
  );
}

export default App;
```

## 🎯 Week 1 Success Metrics

### **Technical Milestones**
- [ ] Unified workspace framework loads and renders
- [ ] Mode switching works smoothly between all 4 modes
- [ ] Settings system manages state correctly
- [ ] Mobile-responsive design works on all screen sizes
- [ ] TypeScript compilation with no errors

### **User Experience**
- [ ] Smooth mode transitions (< 300ms)
- [ ] Consistent visual design across modes
- [ ] Mobile-friendly touch interactions
- [ ] Settings persist across mode switches
- [ ] Professional appearance matching V1 quality

### **Architecture Quality**
- [ ] Clean separation of concerns (workspace vs modes)
- [ ] Reusable context and state management
- [ ] Extensible mode system for future additions
- [ ] Type-safe interfaces throughout
- [ ] Proper component lifecycle management

## 🚀 Week 2 Preview: V1 Integration

Once the framework is solid, Week 2 will focus on:

1. **Port PuzzleShapeMode**: Copy your excellent ShapeEditor3D into the new framework
2. **Integrate Settings**: Connect V1 settings system with unified workspace
3. **Mobile Validation**: Ensure mobile editing perfection is preserved
4. **Testing**: Comprehensive testing of integrated functionality
5. **Performance**: Validate that framework doesn't impact performance

---

**Ready to start building the unified workspace framework? Let's begin with Day 1: Project setup and core types!** 🚀
