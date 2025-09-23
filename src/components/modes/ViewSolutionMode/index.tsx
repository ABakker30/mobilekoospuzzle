import React from 'react';
import { ModeToolbarProps, ModeViewerProps } from '../../../types/workspace';

export const ViewSolutionToolbar: React.FC<ModeToolbarProps> = ({
  settings,
  onSettingsChange,
  modeState,
  onModeStateChange
}) => {
  return (
    <div style={{ padding: '1rem', background: '#f8f9fa' }}>
      <h3 style={{ margin: 0, color: '#28a745' }}>👁️ View Solution Mode</h3>
      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6c757d' }}>
        Browse and analyze puzzle solutions • Enhanced V1 solution viewer
      </p>
    </div>
  );
};

export const ViewSolutionViewer: React.FC<ModeViewerProps> = ({
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
      background: 'linear-gradient(135deg, #28a74520, #28a74510)',
      color: '#28a745'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👁️</div>
        <h2>View Solution Mode</h2>
        <p>Enhanced solution browsing and analysis</p>
        <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
          Your V1 solution viewer will be enhanced here
        </p>
      </div>
    </div>
  );
};
