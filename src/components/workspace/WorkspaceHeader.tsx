import React, { useState } from 'react';
import { useWorkspace } from './WorkspaceProvider';
import { useAuth } from '../../hooks/useAuth';
import { getAllModes } from './modeRegistry';
import { WorkspaceModeId } from '../../types/workspace';

export const WorkspaceHeader: React.FC = () => {
  const { state, setMode } = useWorkspace();
  const { user, signInWithGoogle, signOut, isLoading } = useAuth();
  const { currentMode } = state;
  const allModes = getAllModes();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header className="workspace-header">
      <div className="workspace-brand">
        <h1>Koos Puzzle V2</h1>
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

      <div className="workspace-actions">
        <button 
          className="settings-button"
          onClick={() => setShowSettings(!showSettings)}
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      <div className="workspace-user">
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
          <div className="auth-buttons">
            <button 
              className="sign-in-button"
              onClick={signInWithGoogle}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
