import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { WorkspaceState, WorkspaceSettings, WorkspaceModeId, UserProfile, SyncStatus, defaultWorkspaceSettings } from '../../types/workspace';
import { FCCCoord } from '../../lib/coords/fcc';

interface WorkspaceContextType {
  state: WorkspaceState;
  setMode: (mode: WorkspaceModeId) => void;
  updateSettings: (settings: Partial<WorkspaceSettings>) => void;
  updateCoordinates: (coordinates: FCCCoord[]) => void;
  updateModeState: (mode: WorkspaceModeId, state: Record<string, any>) => void;
  // User management
  setUser: (user: UserProfile | null) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setOnlineStatus: (isOnline: boolean) => void;
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
  | { type: 'UPDATE_MODE_STATE'; mode: WorkspaceModeId; state: Record<string, any> }
  | { type: 'SET_USER'; user: UserProfile | null }
  | { type: 'SET_SYNC_STATUS'; status: SyncStatus }
  | { type: 'SET_ONLINE_STATUS'; isOnline: boolean };

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
    case 'SET_USER':
      return { 
        ...state, 
        user: action.user, 
        isAuthenticated: action.user !== null,
        syncStatus: action.user ? 'synced' : 'offline'
      };
    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.status };
    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.isOnline };
    default:
      return state;
  }
};

const initialWorkspaceState: WorkspaceState = {
  currentMode: 'shape',
  settings: defaultWorkspaceSettings,
  coordinates: [],
  user: null,
  isAuthenticated: false,
  isOnline: navigator.onLine,
  syncStatus: 'offline',
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

  const setUser = useCallback((user: UserProfile | null) => {
    dispatch({ type: 'SET_USER', user });
  }, []);

  const setSyncStatus = useCallback((status: SyncStatus) => {
    dispatch({ type: 'SET_SYNC_STATUS', status });
  }, []);

  const setOnlineStatus = useCallback((isOnline: boolean) => {
    dispatch({ type: 'SET_ONLINE_STATUS', isOnline });
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  return (
    <WorkspaceContext.Provider value={{
      state,
      setMode,
      updateSettings,
      updateCoordinates,
      updateModeState,
      setUser,
      setSyncStatus,
      setOnlineStatus
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};
