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
