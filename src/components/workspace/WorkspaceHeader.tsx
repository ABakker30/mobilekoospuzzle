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

  const currentModeData = allModes.find(mode => mode.id === currentMode);

  return (
    <header className="workspace-header">
      <div className="workspace-brand">
        <h1>Koos Puzzle V2</h1>
      </div>
      
      {/* Mode Dropdown */}
      <div className="mode-selector">
        <button 
          className="mode-dropdown-button"
          onClick={() => setShowModeDropdown(!showModeDropdown)}
        >
          <span className="mode-icon">{currentModeData?.icon}</span>
          <span className="mode-name">{currentModeData?.displayName}</span>
          <span className="dropdown-arrow">▼</span>
        </button>
        
        {showModeDropdown && (
          <div className="mode-dropdown">
            {allModes.map((mode) => (
              <button
                key={mode.id}
                className={`mode-option ${currentMode === mode.id ? 'active' : ''}`}
                onClick={() => {
                  setMode(mode.id as WorkspaceModeId);
                  setShowModeDropdown(false);
                }}
                style={{ color: mode.color }}
              >
                <span className="mode-icon">{mode.icon}</span>
                <span className="mode-name">{mode.displayName}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cell Counter */}
      <div className="cell-counter">
        {coordinates.length} cells
      </div>

      {/* Settings and User */}
      <div className="header-actions">
        <button 
          className="settings-button"
          onClick={() => setShowSettings(!showSettings)}
          title="Settings"
        >
          ⚙️
        </button>

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
    </header>
  );
};
