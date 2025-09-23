import { WorkspaceMode, WorkspaceModeId } from '../../types/workspace';
import { PuzzleShapeToolbar, PuzzleShapeViewer } from '../modes/PuzzleShapeMode';
import { AutoSolveToolbar, AutoSolveViewer } from '../modes/AutoSolveMode';
import { ManualSolveToolbar, ManualSolveViewer } from '../modes/ManualSolveMode';
import { ViewSolutionToolbar, ViewSolutionViewer } from '../modes/ViewSolutionMode';

export const workspaceModes: Record<WorkspaceModeId, WorkspaceMode> = {
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

export const getModeConfig = (modeId: WorkspaceModeId): WorkspaceMode => {
  const mode = workspaceModes[modeId];
  if (!mode) {
    throw new Error(`Unknown workspace mode: ${modeId}`);
  }
  return mode;
};

export const getAllModes = (): WorkspaceMode[] => {
  return Object.values(workspaceModes);
};
