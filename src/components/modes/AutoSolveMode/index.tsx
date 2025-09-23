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
