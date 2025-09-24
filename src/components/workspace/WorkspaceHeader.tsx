import React, { useState } from 'react';
import { useWorkspace } from './WorkspaceProvider';
import { useAuth } from '../../hooks/useAuth';
import { getAllModes } from './modeRegistry';
import { WorkspaceModeId } from '../../types/workspace';

export const WorkspaceHeader: React.FC = () => {
  const { state, setMode } = useWorkspace();
  const { user, signInWithGoogle, signOut, isLoading } = useAuth();
  const { currentMode, coordinates } = state;
  const allModes = getAllModes();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editAction, setEditAction] = useState<'add' | 'remove'>('add');

  const currentModeData = allModes.find(mode => mode.id === currentMode);

  return (
    <header className="workspace-header">
      {/* Line 1: Brand + Right-aligned items */}
      <div className="header-line-1">
        <div className="workspace-brand">
          <h1>Koos Puzzle V2</h1>
        </div>
        
        <div className="header-right">
          {/* Debug button (dev only) */}
          {process.env.NODE_ENV === 'development' && (
            <button 
              className="debug-button"
              onClick={() => setShowSettings(!showSettings)}
              title="Debug (Alt+D)"
            >
              Debug
            </button>
          )}
          
          {/* Cell Counter */}
          <div className="cell-counter">
            {coordinates.length} cells
          </div>

          {/* Settings */}
          <button 
            className="settings-button"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            ⚙️
          </button>

          {/* User Auth */}
          {user ? (
            <div className="user-menu">
              <button 
                className="user-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.displayName} className="user-avatar" />
                ) : (
                  <div className="user-avatar-placeholder">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="user-name">{user.displayName}</span>
              </button>
              
              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <div className="user-stats">
                      <span>Shapes: {user.stats.shapesCreated}</span>
                      <span>Solved: {user.stats.puzzlesSolved}</span>
                      <span>Rank: #{user.stats.communityRank || 'Unranked'}</span>
                    </div>
                  </div>
                  <button onClick={signOut} disabled={isLoading}>
                    {isLoading ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              className="sign-in-button"
              onClick={signInWithGoogle}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          )}
        </div>
      </div>

      {/* Line 2: Mode (left) + Mode-specific controls (center/right) */}
      <div className="header-line-2">
        <div className="mode-selector">
          <button 
            className="mode-dropdown-button"
            onClick={() => setShowModeDropdown(!showModeDropdown)}
          >
            <span className="mode-label">Mode: {getModeDisplayName(currentMode)}</span>
            <span className="dropdown-arrow">▼</span>
          </button>
          
          {showModeDropdown && (
            <div className="mode-dropdown">
              <button
                className={`mode-option ${currentMode === 'shape' ? 'active' : ''}`}
                onClick={() => {
                  setMode('shape' as WorkspaceModeId);
                  setShowModeDropdown(false);
                }}
              >
                Shape
              </button>
              <button
                className={`mode-option ${currentMode === 'view-solution' ? 'active' : ''}`}
                onClick={() => {
                  setMode('view-solution' as WorkspaceModeId);
                  setShowModeDropdown(false);
                }}
              >
                View
              </button>
              <button
                className={`mode-option ${currentMode === 'auto-solve' ? 'active' : ''}`}
                onClick={() => {
                  setMode('auto-solve' as WorkspaceModeId);
                  setShowModeDropdown(false);
                }}
              >
                Solver
              </button>
              <button
                className={`mode-option ${currentMode === 'manual-solve' ? 'active' : ''}`}
                onClick={() => {
                  setMode('manual-solve' as WorkspaceModeId);
                  setShowModeDropdown(false);
                }}
              >
                Puzzle
              </button>
            </div>
          )}
        </div>

        {/* Mode-specific controls on same line */}
        <div className="mode-controls">
          {currentMode === 'shape' && (
            <div className="shape-mode-controls">
              <button className="control-button browse-button">
                Browse
              </button>
              {coordinates.length > 0 && (
                <>
                  <button className="control-button save-button">
                    Save
                  </button>
                  <label className="edit-checkbox">
                    <input 
                      type="checkbox" 
                      checked={isEditMode}
                      onChange={(e) => setIsEditMode(e.target.checked)}
                    />
                    Edit
                  </label>
                  {isEditMode && (
                    <button
                      className={`control-button toggle-button ${editAction === 'add' ? 'add-mode' : 'remove-mode'}`}
                      onClick={() => setEditAction(editAction === 'add' ? 'remove' : 'add')}
                    >
                      {editAction === 'add' ? 'Add' : 'Remove'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
          {currentMode === 'view-solution' && (
            <div className="view-mode-controls">
              <button className="control-button browse-button">
                Browse
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );

  function getModeDisplayName(mode: string): string {
    switch (mode) {
      case 'shape': return 'Shape';
      case 'view-solution': return 'View';
      case 'auto-solve': return 'Solver';
      case 'manual-solve': return 'Puzzle';
      default: return 'Shape';
    }
  }
};
