import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { WorkspaceState, WorkspaceSettings, WorkspaceModeId, defaultWorkspaceSettings } from '../../types/workspace';
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
      return { 
        ...state, 
        settings: { 
          ...state.settings, 
          ...action.settings,
          // Deep merge mode settings if provided
          modes: action.settings.modes 
            ? { ...state.settings.modes, ...action.settings.modes }
            : state.settings.modes
        } 
      };
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

const initialWorkspaceState: WorkspaceState = {
  currentMode: 'shape',
  settings: defaultWorkspaceSettings,
  coordinates: [],
  modeState: {
    'shape': {},
    'auto-solve': {},
    'manual-solve': {},
    'view-solution': {}
  }
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(workspaceReducer, initialWorkspaceState);

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
