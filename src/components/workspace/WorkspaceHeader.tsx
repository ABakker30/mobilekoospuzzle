import React from 'react';
import { useWorkspace } from './WorkspaceProvider';
import { getAllModes } from './modeRegistry';
import { WorkspaceModeId } from '../../types/workspace';

export const WorkspaceHeader: React.FC = () => {
  const { state, setMode } = useWorkspace();
  const { currentMode } = state;
  const allModes = getAllModes();

  return (
    <header className="workspace-header">
      <div className="workspace-brand">
        <h1>Koos Puzzle V2</h1>
        <span className="workspace-subtitle">Unified 3D Workspace</span>
      </div>
      
      <nav className="workspace-modes">
        {allModes.map((mode) => (
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
