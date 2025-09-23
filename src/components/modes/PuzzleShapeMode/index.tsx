import React from 'react';
import { ModeToolbarProps, ModeViewerProps } from '../../../types/workspace';

export const PuzzleShapeToolbar: React.FC<ModeToolbarProps> = ({
  settings,
  onSettingsChange,
  modeState,
  onModeStateChange
}) => {
  return (
    <div style={{ padding: '1rem', background: '#f8f9fa' }}>
      <h3 style={{ margin: 0, color: '#007bff' }}>🧩 Puzzle Shape Mode</h3>
      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6c757d' }}>
        Create and edit 3D puzzle shapes • V1 features will be ported here
      </p>
    </div>
  );
};

export const PuzzleShapeViewer: React.FC<ModeViewerProps> = ({
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
      background: 'linear-gradient(135deg, #007bff20, #007bff10)',
      color: '#007bff'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🧩</div>
        <h2>Puzzle Shape Mode</h2>
        <p>Your excellent V1 ShapeEditor3D will be integrated here</p>
        <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
          Coordinates: {coordinates.length} • Settings: {Object.keys(settings).length}
        </p>
      </div>
    </div>
  );
};
